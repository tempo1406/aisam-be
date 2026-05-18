import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PostStatus } from 'src/enums/post.enum';

export class CreatePostDto {
  @ApiProperty({
    description: 'Main content of the post',
    example:
      'Today I visited this beautiful place and wanted to share it with everyone...',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Array of image URLs for the post',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image?: string[];

  @ApiProperty({
    description: 'Array of hashtag collection for the post',
    example: ['#fashion', '#style', '#trend', '#2024', '#ootd'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtag_collection?: string[];

  @ApiProperty({
    description: 'Status of the post',
    enum: PostStatus,
    example: PostStatus.DRAFT,
    required: false,
  })
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @ApiProperty({
    description: 'Whether to post immediately',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  post_now?: boolean;

  @ApiProperty({
    description: 'Scheduled date for posting (ISO 8601 format)',
    example: '2024-12-31T10:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date_post?: Date;

  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiProperty({
    description: 'Brand ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  brand_id?: string;

  @ApiProperty({
    description:
      'Array of Social Account IDs to post to multiple platforms (Facebook, Instagram, etc.)',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '987e6543-e21b-12d3-a456-426614174111',
    ],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  social_account_ids?: string[];
}
