import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { QUEUE_NAME } from '@modules/bull/constants/queue.constant';

@QueueEventsListener(QUEUE_NAME.STATISTICS_REPORT, {
  blockingTimeout: 1000,
})
export class StatisticsReportQueueEvents extends QueueEventsHost {
  private readonly logger = new Logger(StatisticsReportQueueEvents.name);

  @OnQueueEvent('added')
  onAdded(job: { jobId: string; name: string }) {
    this.logger.log(`Statistics report job ${job.jobId} added to queue`);
  }

  @OnQueueEvent('waiting')
  onWaiting(job: { jobId: string; name: string }) {
    this.logger.log(`Statistics report job ${job.jobId} waiting to process`);
  }

  @OnQueueEvent('active')
  onActive(job: { jobId: string; name: string }) {
    this.logger.log(`Statistics report job ${job.jobId} started processing`);
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string; returnvalue: string }) {
    this.logger.log(`Statistics report job ${job.jobId} completed successfully`);
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; failedReason: string }) {
    this.logger.error(`Statistics report job ${job.jobId} failed: ${job.failedReason}`);
  }

  @OnQueueEvent('progress')
  onProgress(job: { jobId: string; data: number | object }) {
    this.logger.log(`Statistics report job ${job.jobId} progress: ${JSON.stringify(job.data)}`);
  }

  @OnQueueEvent('delayed')
  onDelayed(job: { jobId: string; delay: number }) {
    this.logger.log(`Statistics report job ${job.jobId} delayed by ${job.delay}ms`);
  }

  @OnQueueEvent('removed')
  onRemoved(job: { jobId: string }) {
    this.logger.log(`Statistics report job ${job.jobId} removed from queue`);
  }
}
