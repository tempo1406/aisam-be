import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  AISAM_PAYMENT_SERVICE_PATTERN,
  AISAM_PAYMENT_SERVICE_QUEUE,
} from '@constants/aisam-rabbitmq.constant';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePayosResponseDto } from './dto/payos-response.dto';
import { plainToInstance } from 'class-transformer';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { timeout } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    @Inject(AISAM_PAYMENT_SERVICE_QUEUE)
    private readonly paymentClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.paymentClient.connect();
      this.logger.log('✅ Connected to Payment Service RabbitMQ broker');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Payment Service:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.paymentClient.close();
      this.logger.log('Closed Payment Service RabbitMQ connection');
    } catch (error) {
      this.logger.error('Error closing Payment Service connection:', error);
    }
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<CreatePayosResponseDto> {
    try {
      this.logger.log(
        `Creating payment for user: ${createPaymentDto.userId}, subscription: ${createPaymentDto.metadata?.subscriptionId}`,
      );

      // Gửi message tới Payment Service qua RabbitMQ
      const result = await firstValueFrom(
        this.paymentClient
          .send(AISAM_PAYMENT_SERVICE_PATTERN.CREATE_PAYMENT, {
            orderId: createPaymentDto.orderId,
            userId: createPaymentDto.userId,
            projectId: createPaymentDto.projectId,
            amount: createPaymentDto.amount,
            description: createPaymentDto.description,
            returnUrl:
              createPaymentDto.returnUrl ?? 'https://example.com/return',
            cancelUrl:
              createPaymentDto.cancelUrl ?? 'https://example.com/cancel',
            metadata: createPaymentDto.metadata,
          })
          .pipe(timeout(30000)),
      );

      this.logger.log(`Payment created successfully: ${result.paymentId}`);
      return plainToInstance(CreatePayosResponseDto, result);
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`);
      throw error;
    }
  }
}
