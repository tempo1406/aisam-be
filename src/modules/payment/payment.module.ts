import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AISAM_PAYMENT_SERVICE_QUEUE } from '@constants/aisam-rabbitmq.constant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscriptionsModule } from '@modules/subscriptions/subscriptions.module';
import { SocketModule } from '@modules/socket/socket.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AISAM_PAYMENT_SERVICE_QUEUE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('rabbitmq.url')],
            queue: AISAM_PAYMENT_SERVICE_QUEUE,
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
    forwardRef(() => SubscriptionsModule),
    SocketModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
