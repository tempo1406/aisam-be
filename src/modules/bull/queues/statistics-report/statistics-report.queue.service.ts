import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME, QUEUE_PATTERN } from '@modules/bull/constants/queue.constant';

@Injectable()
export class StatisticsReportQueueService implements OnModuleInit {
  private readonly logger = new Logger(StatisticsReportQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAME.STATISTICS_REPORT)
    private readonly statisticsReportQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('StatisticsReportQueueService initialized');
    await this.setupCronJob();
  }

  private async setupCronJob() {
    try {
      // Xóa các repeatable job cũ nếu có
      const repeatableJobs = await this.statisticsReportQueue.getRepeatableJobs();
      for (const job of repeatableJobs) {
        await this.statisticsReportQueue.removeRepeatableByKey(job.key);
      }

      // Thêm repeatable job mới - chạy lúc 00:00 mỗi ngày (timezone Asia/Ho_Chi_Minh)
      await this.statisticsReportQueue.add(
        QUEUE_NAME.GENERATE_REPORT,
        {
          
        },
        {
          repeat: {
            pattern: QUEUE_PATTERN.CHECK_EXPIRED_STATISTICS,
            tz: 'Asia/Ho_Chi_Minh',
          },
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute
          },
        },
      );

      this.logger.log(
        'Cronjob setup completed: Generate statistics report daily at 00:00',
      );
    } catch (error) {
      this.logger.error('Error setting up cronjob:', error);
      throw error;
    }
  }

  async manualTrigger() {
    try {
      const job = await this.statisticsReportQueue.add(
        QUEUE_NAME.GENERATE_REPORT_MANUAL,
        {},
        {
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(`Manual trigger: jobId=${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Error triggering manual report:', error);
      throw error;
    }
  }
}
