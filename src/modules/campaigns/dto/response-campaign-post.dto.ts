import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignPostStatus, Platform } from 'src/enums/campaign.enum';

export class ResponseCampaignPostDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  campaignId: string;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty({ type: [String] })
  @Expose()
  images: string[];

  @ApiProperty({ type: [String] })
  @Expose()
  hashtags: string[];

  @ApiProperty()
  @Expose()
  platformVariants: {
    facebook?: {
      content: string;
      images: string[];
    };
    instagram?: {
      content: string;
      images: string[];
      isReel: boolean;
    };
    tiktok?: {
      content: string;
      videoUrl: string;
    };
  };

  @ApiProperty()
  @Expose()
  suggestedSchedule: Array<{
    platform: Platform;
    scheduledTime: Date;
    priority: number;
  }>;

  @ApiProperty({ enum: CampaignPostStatus })
  @Expose()
  status: CampaignPostStatus;

  @ApiProperty()
  @Expose()
  reviewedBy: string;

  @ApiProperty()
  @Expose()
  reviewedAt: Date;

  @ApiProperty()
  @Expose()
  rejectionReason: string;

  @ApiProperty()
  @Expose()
  publishedPosts: Array<{
    platform: Platform;
    postId: string;
    platformPostId: string;
    publishedAt: Date;
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };
  }>;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
