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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HashtagCollectionsService } from './hashtag_collections.service';
import { CreateHashtagCollectionDto } from './dto/create-hashtag_collection.dto';
import { UpdateHashtagCollectionDto } from './dto/update-hashtag_collection.dto';
import { ResponseHashtagCollectionDto } from './dto/response-hashtag_collection.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';

@ApiTags('Hashtag Collections')
@Controller({
  path: 'hashtag-collections',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
export class HashtagCollectionsController {
  constructor(
    private readonly hashtagCollectionsService: HashtagCollectionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new hashtag collection' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hashtag collection created successfully',
    type: ResponseHashtagCollectionDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async create(
    @Req() req: any,
    @Body() createHashtagCollectionDto: CreateHashtagCollectionDto,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.hashtagCollectionsService.create(
      user_id,
      createHashtagCollectionDto,
    );
    return new ApiResponseDto(
      HttpStatus.CREATED,
      'Hashtag collection created successfully',
    );
  }

  @Get('my-collections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all hashtag collections for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hashtag collections retrieved successfully',
    type: [ResponseHashtagCollectionDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async findMyCollections(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseHashtagCollectionDto[]>> {
    const user_id = req.user.sub as string;
    const collections =
      await this.hashtagCollectionsService.findAllByUserId(user_id);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Hashtag collections retrieved successfully',
      collections,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get hashtag collection by ID' })
  @ApiParam({
    name: 'id',
    description: 'Hashtag Collection ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hashtag collection retrieved successfully',
    type: ResponseHashtagCollectionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Hashtag collection not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ResponseHashtagCollectionDto>> {
    const collection = await this.hashtagCollectionsService.findOne(id);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Hashtag collection retrieved successfully',
      collection,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update hashtag collection by ID' })
  @ApiParam({
    name: 'id',
    description: 'Hashtag Collection ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hashtag collection updated successfully',
    type: ResponseHashtagCollectionDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Hashtag collection not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateHashtagCollectionDto: UpdateHashtagCollectionDto,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.hashtagCollectionsService.update(
      id,
      user_id,
      updateHashtagCollectionDto,
    );
    return new ApiResponseDto(
      HttpStatus.OK,
      'Hashtag collection updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete hashtag collection by ID' })
  @ApiParam({
    name: 'id',
    description: 'Hashtag Collection ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hashtag collection deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Hashtag collection not found',
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
    await this.hashtagCollectionsService.remove(id, user_id);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Hashtag collection deleted successfully',
    );
  }
}
