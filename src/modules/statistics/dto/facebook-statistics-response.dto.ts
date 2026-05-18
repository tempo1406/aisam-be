import { ApiProperty } from '@nestjs/swagger';

export class FacebookPostStatisticsDto {
  @ApiProperty({ description: 'Post ID', example: '123456789_987654321' })
  post_id: string;

  @ApiProperty({ description: 'Post message/content', example: 'Hello World!' })
  message: string;

  @ApiProperty({ description: 'Post created time', example: '2025-01-15T10:30:00+0000' })
  created_time: string;

  @ApiProperty({ description: 'Number of likes', example: 150 })
  likes: number;

  @ApiProperty({ description: 'Number of comments', example: 25 })
  comments: number;

  @ApiProperty({ description: 'Number of shares', example: 10 })
  shares: number;

  @ApiProperty({ description: 'Total reach', example: 1000, required: false })
  reach?: number;

  @ApiProperty({ description: 'Total impressions', example: 1500, required: false })
  impressions?: number;
}

export class FacebookStatisticsResponseDto {
  @ApiProperty({ description: 'Social Account ID' })
  social_account_id: string;

  @ApiProperty({ description: 'Page name', example: 'My Business Page' })
  page_name: string;

  @ApiProperty({ description: 'Total posts in period', example: 50 })
  total_posts: number;

  @ApiProperty({ description: 'Total likes in period', example: 5000 })
  total_likes: number;

  @ApiProperty({ description: 'Total comments in period', example: 500 })
  total_comments: number;

  @ApiProperty({ description: 'Total shares in period', example: 200 })
  total_shares: number;

  @ApiProperty({ description: 'Total reach in period', example: 50000, required: false })
  total_reach?: number;

  @ApiProperty({ description: 'Total impressions in period', example: 75000, required: false })
  total_impressions?: number;

  @ApiProperty({ description: 'Average engagement rate', example: 5.2 })
  engagement_rate: number;

  @ApiProperty({ description: 'Post statistics details', type: [FacebookPostStatisticsDto] })
  posts: FacebookPostStatisticsDto[];

  @ApiProperty({ description: 'Statistics date range' })
  date_range: {
    start: string;
    end: string;
  };
}
