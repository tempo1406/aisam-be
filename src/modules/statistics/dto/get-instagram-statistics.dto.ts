import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class GetInstagramStatisticsDto {
  @ApiProperty({
    description: 'Instagram social account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  social_account_id: string;

  @ApiProperty({
    description: 'Start date for statistics (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({
    description: 'End date for statistics (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
