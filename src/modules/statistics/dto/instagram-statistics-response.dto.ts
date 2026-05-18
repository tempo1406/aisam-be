import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InstagramMediaStatisticsDto {
  @ApiProperty({
    description: 'Instagram media ID',
    example: '17895695668004550',
  })
  @Expose()
  media_id: string;

  @ApiProperty({
    description: 'Media caption/message',
    example: 'Check out our new product!',
  })
  @Expose()
  caption: string;

  @ApiProperty({
    description: 'Media type (IMAGE, VIDEO, CAROUSEL_ALBUM)',
    example: 'IMAGE',
  })
  @Expose()
  media_type: string;

  @ApiProperty({
    description: 'Media URL',
    example: 'https://scontent.cdninstagram.com/v/...',
  })
  @Expose()
  media_url: string;

  @ApiProperty({
    description: 'Permalink to the post',
    example: 'https://www.instagram.com/p/ABC123/',
  })
  @Expose()
  permalink: string;

  @ApiProperty({
    description: 'Media timestamp',
    example: '2024-01-15T10:30:00+0000',
  })
  @Expose()
  timestamp: string;

  @ApiProperty({
    description: 'Number of likes',
    example: 150,
  })
  @Expose()
  like_count: number;

  @ApiProperty({
    description: 'Number of comments',
    example: 25,
  })
  @Expose()
  comments_count: number;

  @ApiProperty({
    description: 'Number of impressions',
    example: 500,
    required: false,
  })
  @Expose()
  impressions?: number;

  @ApiProperty({
    description: 'Number of reach',
    example: 450,
    required: false,
  })
  @Expose()
  reach?: number;

  @ApiProperty({
    description: 'Number of saves',
    example: 10,
    required: false,
  })
  @Expose()
  saved?: number;
}

export class InstagramStatisticsResponseDto {
  @ApiProperty({
    description: 'Social account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  social_account_id: string;

  @ApiProperty({
    description: 'Instagram username',
    example: 'myrestaurant',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'Total number of media posts',
    example: 42,
  })
  @Expose()
  total_media: number;

  @ApiProperty({
    description: 'Total likes across all posts',
    example: 3250,
  })
  @Expose()
  total_likes: number;

  @ApiProperty({
    description: 'Total comments across all posts',
    example: 420,
  })
  @Expose()
  total_comments: number;

  @ApiProperty({
    description: 'Total impressions across all posts',
    example: 15000,
    required: false,
  })
  @Expose()
  total_impressions?: number;

  @ApiProperty({
    description: 'Total reach across all posts',
    example: 12000,
    required: false,
  })
  @Expose()
  total_reach?: number;

  @ApiProperty({
    description: 'Total saves across all posts',
    example: 180,
    required: false,
  })
  @Expose()
  total_saved?: number;

  @ApiProperty({
    description: 'Engagement rate percentage',
    example: 4.5,
  })
  @Expose()
  engagement_rate: number;

  @ApiProperty({
    description: 'Number of followers',
    example: 5420,
  })
  @Expose()
  followers_count: number;

  @ApiProperty({
    description: 'Number of accounts following',
    example: 320,
  })
  @Expose()
  follows_count: number;

  @ApiProperty({
    description: 'Array of media statistics',
    type: [InstagramMediaStatisticsDto],
  })
  @Expose()
  media: InstagramMediaStatisticsDto[];

  @ApiProperty({
    description: 'Date range for the statistics',
    example: { start: '2024-01-01T00:00:00.000Z', end: '2024-01-31T23:59:59.999Z' },
  })
  @Expose()
  date_range: {
    start: string;
    end: string;
  };
}
