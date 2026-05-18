import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ResponsePostDto } from './dto/response-post.dto';
import { AdminPostDto, GetAdminPostsDto } from './dto/admin-post.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { CreateContentPostDto } from './dto/create-content-post.dto';
import { PostStatus } from 'src/enums/post.enum';

@ApiTags('Posts')
@Controller({
  path: 'posts',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('Authorization')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: ResponsePostDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiBody({ type: CreatePostDto })
  async create(
    @Req() req: any,
    @Body() createPostDto: CreatePostDto,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.postService.create(user_id, createPostDto);
    return new ApiResponseDto(HttpStatus.CREATED, 'Post created successfully');
  }

  @Post('generate-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate content for a post' })
  @ApiBody({ type: CreateContentPostDto })
  async generateContent(
    @Body() createContentPostDto: CreateContentPostDto,
  ): Promise<ApiResponseDto<string[]>> {
    const content =
      await this.postService.generateContent(createContentPostDto);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Post liked successfully',
      content,
    );
  }

  @Get('my-posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get posts for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully',
    type: [ResponsePostDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async findMyPosts(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponsePostDto[]>> {
    const user_id = req.user.sub as string;

    const posts = await this.postService.findAllByUserId(user_id);

    return new ApiResponseDto(
      HttpStatus.OK,
      'Posts retrieved successfully',
      posts,
    );
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['draft', 'published', 'archived'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully',
    type: AdminPostDto,
    isArray: true,
  })
  async getAdminPosts(
    @Query() query: GetAdminPostsDto,
  ): Promise<ApiResponseDto<{ posts: AdminPostDto[]; total: number }>> {
    const data = await this.postService.getAdminPosts(query);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Posts retrieved successfully',
      data,
    );
  }

  @Get('admin/deleted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get deleted posts for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deleted posts retrieved successfully',
    type: AdminPostDto,
    isArray: true,
  })
  async getDeletedPosts(
    @Query() query: GetAdminPostsDto,
  ): Promise<ApiResponseDto<{ posts: AdminPostDto[]; total: number }>> {
    const data = await this.postService.getDeletedPosts(query);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Deleted posts retrieved successfully',
      data,
    );
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete post for admin' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post deleted successfully',
  })
  async deleteAdminPost(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.postService.deleteAdminPost(id);
    return new ApiResponseDto(HttpStatus.OK, 'Post deleted successfully');
  }

  @Post('admin/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a post for admin' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post restored successfully',
  })
  async restorePost(@Param('id') id: string): Promise<ApiResponseDto<void>> {
    await this.postService.restorePost(id);
    return new ApiResponseDto(HttpStatus.OK, 'Post restored successfully');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({
    name: 'id',
    description: 'Post ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post retrieved successfully',
    type: ResponsePostDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ResponsePostDto | null>> {
    const post = await this.postService.findOne(id);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Post retrieved successfully',
      post,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post by ID' })
  @ApiParam({
    name: 'id',
    description: 'Post ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post updated successfully',
    type: ResponsePostDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.postService.update(id, user_id, updatePostDto);
    return new ApiResponseDto(HttpStatus.OK, 'Post updated successfully');
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post status by ID' })
  @ApiParam({
    name: 'id',
    description: 'Post ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'status',
    description: 'Post status',
    example: PostStatus.SCHEDULED,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateStatus(
    @Param('id') id: string,
    @Query('status') postStatus: PostStatus,
  ): Promise<ApiResponseDto<void>> {
    await this.postService.updateStatus(id, postStatus);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Post status updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete post by ID' })
  @ApiParam({
    name: 'id',
    description: 'Post ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.postService.remove(id, user_id);
    return new ApiResponseDto(HttpStatus.OK, 'Post deleted successfully');
  }

  @Delete(':postId/platform/:postSocialAccountId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete post from specific platform' })
  @ApiParam({
    name: 'postId',
    description: 'Post ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'postSocialAccountId',
    description: 'Post Social Account ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post deleted from platform successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post or platform not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async removeFromPlatform(
    @Param('postId') postId: string,
    @Param('postSocialAccountId') postSocialAccountId: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.postService.removeFromPlatform(postId, postSocialAccountId, user_id);
    return new ApiResponseDto(HttpStatus.OK, 'Post deleted from platform successfully');
  }

}
