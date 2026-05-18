import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignPostScheduleDto {
  @ApiPropertyOptional({
    description: 'Scheduled time for posting (ISO 8601 format)',
    example: '2025-11-16T13:35:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledTime?: string;

  @ApiPropertyOptional({
    description: 'Array of Social Account IDs to post to (Facebook, Instagram, TikTok)',
    example: ['facebook-account-id', 'instagram-account-id'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  socialAccountIds?: string[];
}

export class RejectCampaignPostDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
