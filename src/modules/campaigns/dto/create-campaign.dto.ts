import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsUUID, ValidateNested, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Platform,
  ContentTone,
  AIModel,
  ImageStyle,
  DayOfWeek,
} from 'src/enums/campaign.enum';

class ContentGuidelinesDto {
  @ApiProperty({ enum: ContentTone })
  @IsEnum(ContentTone)
  tone: ContentTone;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  doNots?: string[];
}

class ScheduleConfigDto {
  @ApiProperty({ minimum: 1, maximum: 14 })
  @IsNumber()
  @Min(1)
  @Max(14)
  postsPerWeek: number;

  @ApiProperty({ type: [String], example: ['09:00', '15:00', '20:00'] })
  @IsArray()
  @IsString({ each: true })
  preferredTimes: string[];

  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  preferredDays: DayOfWeek[];
}

class AIConfigDto {
  @ApiProperty({ enum: AIModel })
  @IsEnum(AIModel)
  model: AIModel;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  creativity: number;

  @ApiProperty({ enum: ImageStyle })
  @IsEnum(ImageStyle)
  imageStyle: ImageStyle;

  @ApiProperty()
  @IsBoolean()
  autoApprove: boolean;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ enum: Platform, isArray: true })
  @IsArray()
  @IsEnum(Platform, { each: true })
  targetPlatforms: Platform[];

  @ApiProperty({ type: ContentGuidelinesDto })
  @ValidateNested()
  @Type(() => ContentGuidelinesDto)
  contentGuidelines: ContentGuidelinesDto;

  @ApiProperty({ type: ScheduleConfigDto })
  @ValidateNested()
  @Type(() => ScheduleConfigDto)
  scheduleConfig: ScheduleConfigDto;

  @ApiProperty({ type: AIConfigDto })
  @ValidateNested()
  @Type(() => AIConfigDto)
  aiConfig: AIConfigDto;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
