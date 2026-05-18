import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleEnum } from 'src/enums/role.enum';

export class AdminUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'First name' })
  firstName?: string;

  @ApiProperty({ description: 'Last name' })
  lastName?: string;

  @ApiProperty({ description: 'Avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'User bio' })
  bio?: string;

  @ApiProperty({ description: 'Phone number' })
  phone?: string;

  @ApiProperty({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Address' })
  address?: string;

  @ApiProperty({ description: 'Account provider' })
  provider: string;

  @ApiProperty({ description: 'User role' })
  role: {
    id: string;
    name: RoleEnum;
    description?: string;
  };

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Total posts created' })
  totalPosts: number;

  @ApiProperty({ description: 'Account status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Linked social accounts' })
  socialAccounts?: AdminSocialAccountDto[];

  @ApiPropertyOptional({ description: 'Whether user has any linked social accounts' })
  hasSocialAccount?: boolean;
}

export class AdminSocialAccountDto {
  @ApiProperty({ description: 'Social account id' })
  id: string;

  @ApiProperty({ description: 'Platform' })
  platform: string;

  @ApiProperty({ description: 'Page id' })
  page_id?: string;

  @ApiProperty({ description: 'Page name' })
  page_name?: string;

  @ApiProperty({ description: 'Access token (partial for security)' })
  access_token?: string;

  @ApiProperty({ description: 'Token type' })
  token_type?: string;
}

export class UserManagementFilterDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for email or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role', enum: RoleEnum })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;

  @ApiPropertyOptional({ description: 'Filter by account provider' })
  @IsOptional()
  @IsString()
  provider?: 'local' | 'google';
}

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'New role ID' })
  roleId: string;
}