import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePurchaseSubscriptionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Plan ID to subscribe to',
  })
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;
}
