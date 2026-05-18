import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class PublishInstagramPostDto {
  @ApiProperty({
    description: 'Instagram account ID (from social_accounts table)',
    example: '17841400008460056',
  })
  @IsString()
  @IsNotEmpty()
  instagram_account_id: string;

  @ApiProperty({
    description: 'Access token for Instagram account',
    example: 'EAABwz...',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({
    description: 'Image URL (required for Instagram)',
    example: 'https://res.cloudinary.com/...',
  })
  @IsUrl()
  @IsNotEmpty()
  image_url: string;

  @ApiProperty({
    description: 'Caption for the post',
    example: 'Check out our new product! #amazing #product',
  })
  @IsString()
  @IsNotEmpty()
  caption: string;
}

export class PublishInstagramReelDto {
  @ApiProperty({
    description: 'Instagram account ID',
    example: '17841400008460056',
  })
  @IsString()
  @IsNotEmpty()
  instagram_account_id: string;

  @ApiProperty({
    description: 'Access token',
    example: 'EAABwz...',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({
    description: 'Video URL (MP4 format)',
    example: 'https://res.cloudinary.com/.../video.mp4',
  })
  @IsUrl()
  @IsNotEmpty()
  video_url: string;

  @ApiProperty({
    description: 'Caption for the reel',
    example: 'Amazing reel! #viral #trending',
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    description: 'Cover image URL (optional)',
    example: 'https://res.cloudinary.com/.../cover.jpg',
  })
  @IsUrl()
  @IsOptional()
  cover_url?: string;
}

export class InstagramMediaResponseDto {
  @ApiProperty({ example: '17841400008460056_123456789' })
  id: string;

  @ApiProperty({ example: 'published' })
  status: string;

  @ApiProperty({ example: 'https://www.instagram.com/p/ABC123/' })
  permalink?: string;
}

export class InstagramInsightsDto {
  @ApiProperty({ example: 1500 })
  likes: number;

  @ApiProperty({ example: 50 })
  comments: number;

  @ApiProperty({ example: 10000 })
  reach: number;

  @ApiProperty({ example: 15000 })
  impressions: number;

  @ApiProperty({ example: 500 })
  saved: number;

  @ApiProperty({ example: 8.5 })
  engagement_rate: number;
}
