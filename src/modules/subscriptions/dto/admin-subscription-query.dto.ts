import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, IsString, IsDateString } from 'class-validator';
import { SubscriptionStatus } from 'src/enums/subscription.enum';

export class AdminSubscriptionQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Filter by status' })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Filter by plan ID' })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Start date filter (from)' })
  @IsDateString()
  @IsOptional()
  startDateFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Start date filter (to)' })
  @IsDateString()
  @IsOptional()
  startDateTo?: string;
}
