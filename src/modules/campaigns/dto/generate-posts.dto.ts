import { IsNumber, IsArray, IsEnum, ValidateNested, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Platform } from 'src/enums/campaign.enum';

class DateRangeDto {
  @ApiProperty()
  @IsDateString()
  from: string;

  @ApiProperty()
  @IsDateString()
  to: string;
}

export class GeneratePostsDto {
  @ApiProperty({ minimum: 1, maximum: 50 })
  @IsNumber()
  @Min(1)
  @Max(50)
  numberOfPosts: number;

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiProperty({ enum: Platform, isArray: true })
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms: Platform[];
}
