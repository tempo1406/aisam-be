import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class GetFacebookStatisticsDto {
  @ApiProperty({
    description: 'Social Account ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  social_account_id: string;

  @ApiProperty({
    description: 'Start date for statistics (ISO 8601 format)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    description: 'End date for statistics (ISO 8601 format)',
    example: '2025-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
