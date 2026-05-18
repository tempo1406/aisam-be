import {
  QUEUE_NAME,
  QUEUE_PATTERN,
} from '@modules/bull/constants/queue.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class SubscriptionCheckExpiredQueueService implements OnModuleInit {
  private readonly logger = new Logger(
    SubscriptionCheckExpiredQueueService.name,
  );

  constructor(
    @InjectQueue(QUEUE_NAME.CHECK_EXPIRED_SUBSCRIPTION)
    private readonly subscriptionQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('SubscriptionCheckExpiredQueueService initialized');
    await this.setupCronJob();
  }

  private async setupCronJob() {
    try {
      // Xóa các repeatable job cũ nếu có
      const repeatableJobs = await this.subscriptionQueue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await this.subscriptionQueue.removeRepeatableByKey(job.key);
      }

      // Thêm repeatable job mới - chạy lúc 00:00 mỗi ngày (timezone Asia/Ho_Chi_Minh)
      await this.subscriptionQueue.add(
        QUEUE_NAME.CHECK_EXPIRED_SUBSCRIPTION,
        {},
        {
          repeat: {
            pattern: QUEUE_PATTERN.CHECK_EXPIRED_SUBSCRIPTION,
            tz: 'Asia/Ho_Chi_Minh',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        'Cronjob setup completed: Check expired subscriptions daily at 00:00',
      );
    } catch (error) {
      this.logger.error('Error setting up cronjob:', error);
      throw error;
    }
  }

  async triggerManualCheck() {
    try {
      const job = await this.subscriptionQueue.add(
        QUEUE_NAME.CHECK_EXPIRED_SUBSCRIPTION_MANUAL,
        {},
        {
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`Manual check triggered: jobId=${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Error triggering manual check:', error);
      throw error;
    }
  }
}
