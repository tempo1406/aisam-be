import { QUEUE_NAME } from '@modules/bull/constants/queue.constant';
import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@QueueEventsListener(QUEUE_NAME.CHECK_EXPIRED_SUBSCRIPTION, {
  blockingTimeout: 1000,
})
export class SubscriptionCheckExpiredEvents extends QueueEventsHost {
  private readonly logger = new Logger(SubscriptionCheckExpiredEvents.name);

  @OnQueueEvent('added')
  onAdded(job: { jobId: string; name: string }) {
    this.logger.log(`Job ${job.jobId} added`);
  }

  @OnQueueEvent('waiting')
  onWaiting(job: { jobId: string; name: string }) {
    this.logger.log(`Job ${job.jobId} waiting`);
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string; name: string }) {
    this.logger.log(`Job ${job.jobId} completed`);
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; name: string }, error: Error) {
    this.logger.log(`Job ${job.jobId} failed: ${error.message}`);
  }
}
