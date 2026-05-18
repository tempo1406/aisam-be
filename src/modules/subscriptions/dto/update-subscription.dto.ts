import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { SubscriptionStatus } from 'src/enums/subscription.enum';

export class UpdateSubscriptionDto {
  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: 'New subscription end date',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiProperty({
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
    description: 'Subscription status',
    required: false,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiProperty({
    example: 50,
    description: 'Current usage count',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  usage_count?: number;
}
