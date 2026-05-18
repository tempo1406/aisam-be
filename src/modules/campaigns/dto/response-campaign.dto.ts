import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  CampaignStatus,
  Platform,
  ContentTone,
  AIModel,
  ImageStyle,
  DayOfWeek,
} from 'src/enums/campaign.enum';

export class ResponseCampaignDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ enum: CampaignStatus })
  @Expose()
  status: CampaignStatus;

  @ApiProperty()
  @Expose()
  brandId: string;

  @ApiProperty({ enum: Platform, isArray: true })
  @Expose()
  targetPlatforms: Platform[];

  @ApiProperty()
  @Expose()
  contentGuidelines: {
    tone: ContentTone;
    topics: string[];
    keywords: string[];
    doNots: string[];
  };

  @ApiProperty()
  @Expose()
  scheduleConfig: {
    postsPerWeek: number;
    preferredTimes: string[];
    preferredDays: DayOfWeek[];
  };

  @ApiProperty()
  @Expose()
  aiConfig: {
    model: AIModel;
    creativity: number;
    imageStyle: ImageStyle;
    autoApprove: boolean;
  };

  @ApiProperty()
  @Expose()
  totalGeneratedPosts: number;

  @ApiProperty()
  @Expose()
  totalPublishedPosts: number;

  @ApiProperty()
  @Expose()
  startDate: Date;

  @ApiProperty()
  @Expose()
  endDate: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class ResponseCampaignListDto {
  @ApiProperty({ type: [ResponseCampaignDto] })
  @Expose()
  @Type(() => ResponseCampaignDto)
  data: ResponseCampaignDto[];

  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  page: number;

  @ApiProperty()
  @Expose()
  limit: number;
}
