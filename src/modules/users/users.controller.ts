import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Req,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { AdminUserDto, UserManagementFilterDto } from './dto/admin-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { DIRECTORY_CLOUDINARY } from '@constants/diractiory-cloudinary.constant';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BanUserDto, UnbanUserDto } from './dto/ban-user.dto';

@ApiTags('Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('Authorization')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(): Promise<ApiResponseDto<ResponseUserDto[]>> {
    const users = await this.usersService.findAllWithDefaultAvatar();
    return new ApiResponseDto(200, 'Users retrieved successfully', users);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any): Promise<ApiResponseDto<ResponseUserDto>> {
    const userId = req.user.sub as string;
    const user = await this.usersService.findById(userId);
    return new ApiResponseDto(200, 'Profile retrieved successfully', user);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponseDto<ResponseUserDto>> {
    const userId = req.user.sub as string;
    const user = await this.usersService.updateProfile(
      userId,
      updateProfileDto,
    );
    return new ApiResponseDto(200, 'Profile updated successfully', user);
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<ResponseUserDto>> {
    const userId = req.user.sub as string;

    // Upload to Cloudinary
    const result = await this.cloudinaryService.uploadFile(
      file,
      DIRECTORY_CLOUDINARY.AVATAR,
    );

    const avatarUrl = result.url as string;

    // Update user avatar
    const user = await this.usersService.updateAvatar(userId, avatarUrl);
    return new ApiResponseDto(200, 'Avatar uploaded successfully', user);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Delete current user avatar' })
  async deleteAvatar(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseUserDto>> {
    const userId = req.user.sub as string;

    await this.usersService.deleteAvatar(userId);
    return new ApiResponseDto(200, 'Avatar deleted successfully');
  }

  @Get('admin')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all users with filters for admin' })
  async getAdminUsers(
    @Query() filters: UserManagementFilterDto,
  ): Promise<
    ApiResponseDto<{ users: AdminUserDto[]; total: number; totalPages: number }>
  > {
    const result = await this.usersService.getAdminUsers(filters);
    return new ApiResponseDto(200, 'Users retrieved successfully', result);
  }

  @Get('admin/banned')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all banned users (Admin only)' })
  async getBannedUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.usersService.getBannedUsers(page, limit);
    return new ApiResponseDto(200, 'Banned users retrieved successfully', result);
  }

  @Get('admin/:id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get user details by ID for admin' })
  async getAdminUserById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<AdminUserDto>> {
    const user = await this.usersService.getAdminUserById(id);
    return new ApiResponseDto(200, 'User details retrieved successfully', user);
  }

  @Delete('admin/:id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete user for admin' })
  async deleteAdminUser(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.usersService.deleteAdminUser(id);
    return new ApiResponseDto(200, 'User deleted successfully');
  }

  @Post('admin/ban')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Ban a user (Admin only)' })
  async banUser(
    @Body() dto: BanUserDto,
  ): Promise<ApiResponseDto<ResponseUserDto>> {
    const user = await this.usersService.banUser(dto.userId, dto.reason);
    return new ApiResponseDto(200, 'User banned successfully', user);
  }

  @Post('admin/unban')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Unban a user (Admin only)' })
  async unbanUser(
    @Body() dto: UnbanUserDto,
  ): Promise<ApiResponseDto<ResponseUserDto>> {
    const user = await this.usersService.unbanUser(dto.userId);
    return new ApiResponseDto(200, 'User unbanned successfully', user);
  }
}
