import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';
import { PaymentStatus } from 'src/enums/payment.enum';

export class CreatePayosResponseDto {
  @ApiProperty({
    example: true,
    description: 'The success status',
  })
  success: boolean;

  @ApiProperty({
    example: '1234567890',
    description: 'The payment ID',
  })
  paymentId: string;

  @ApiProperty({
    example: 'https://example.com/checkout',
    description: 'The checkout URL',
  })
  checkoutUrl: string;

  @ApiProperty({
    example: 'https://example.com/qrcode',
    description: 'The QR code',
  })
  qrCode: string;

  @ApiProperty({
    example: '1234567890',
    description: 'The order code',
  })
  orderCode: string;

  @ApiProperty({
    example: 10000,
    description: 'The amount',
  })
  amount: number;

  @ApiProperty({
    example: 'The description',
    description: 'The description',
  })
  description: string;

  @ApiProperty({
    example: 10000,
    description: 'The expired at',
  })
  expiredAt: number;

  @ApiProperty({
    example: 'The status',
    description: 'The status',
  })
  status: PaymentStatus;

  @ApiProperty({
    example: 'The currency',
    description: 'The currency',
  })
  currency: string;

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
