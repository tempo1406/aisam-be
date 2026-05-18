import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminPostDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title (truncated content)' })
  title: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Post status' })
  status: string;

  @ApiProperty({ description: 'Post author information' })
  author: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({ description: 'Post category information' })
  category: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Post creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Post last update date' })
  updatedAt: Date;
}

export class GetAdminPostsDto {
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

  @ApiPropertyOptional({ description: 'Search term for post content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ['draft', 'published', 'archived']
  })
  @IsOptional()
  @IsString()
  status?: string;
}