import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StatisticsReportQueueProcessor } from './statistics-report.queue.processor';
import { StatisticsReportQueueService } from './statistics-report.queue.service';
import { StatisticsReportQueueEvents } from './statistics-report.queue.events';
import { StatisticsModule } from '@modules/statistics/statistics.module';
import { UsersModule } from '@modules/users/users.module';
import { SocialModule } from '@modules/social/social.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { MaillerModule } from '@modules/mail/mail.module';
import { buildQueueConfig } from '@modules/bull/configs/queue.config';

@Module({
  imports: [
    BullModule.registerQueue(...buildQueueConfig()),
    StatisticsModule,
    UsersModule,
    SocialModule,
    NotificationsModule,
    MaillerModule,
  ],
  providers: [
    StatisticsReportQueueEvents,
    StatisticsReportQueueProcessor,
    StatisticsReportQueueService,
  ],
  exports: [StatisticsReportQueueService],
})
export class StatisticsReportQueueModule {}
