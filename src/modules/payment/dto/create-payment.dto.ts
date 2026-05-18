import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AISAM_PROJECT_ID } from '@constants/aisam-rabbitmq.constant';

export class CreatePaymentDto {
  @ApiProperty({
    example: 1,
    description: 'The subscription ID',
  })
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'The user ID',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: AISAM_PROJECT_ID,
    description: 'The project ID',
  })
  @IsString()
  @IsNotEmpty()
  projectId: typeof AISAM_PROJECT_ID;

  @ApiProperty({
    example: 10000,
    description: 'The amount',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'The description',
    description: 'The description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'https://example.com/cancel',
    description: 'The cancel URL',
  })
  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @ApiProperty({
    example: 'https://example.com/return',
    description: 'The return URL',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiProperty({
    example: {
      subscriptionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    },
    description: 'The metadata',
  })
  @IsObject()
  @IsNotEmpty()
  metadata: Record<string, any>;
}
