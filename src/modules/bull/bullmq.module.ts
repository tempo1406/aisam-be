import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { bullConnectConfig } from './configs/bull-connect.config';
import { buildQueueConfig } from './configs/queue.config';
import { PostSocialModule } from './queues/post-facebook-social/post-social.queue.module';
import { SubscriptionCheckExpiredModule } from './queues/subscription-check-expired/subscription.queue.module';
import { StatisticsReportQueueModule } from './queues/statistics-report/statistics-report.queue.module';


@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: bullConnectConfig,
    }),
    BullModule.registerQueue(...buildQueueConfig()),
    PostSocialModule,
    SubscriptionCheckExpiredModule,
    StatisticsReportQueueModule,
  ],
  exports: [
    PostSocialModule,
    SubscriptionCheckExpiredModule,
    StatisticsReportQueueModule,
  ],
})
export class BullmqModule {}
