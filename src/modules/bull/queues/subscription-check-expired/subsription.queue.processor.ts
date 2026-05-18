import { QUEUE_NAME } from '@modules/bull/constants/queue.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Subscription } from '@modules/subscriptions/entities/subscription.entity';
import { SubscriptionStatus } from 'src/enums/subscription.enum';

@Processor(QUEUE_NAME.CHECK_EXPIRED_SUBSCRIPTION)
export class SubscriptionCheckExpiredQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(
    SubscriptionCheckExpiredQueueProcessor.name,
  );

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      this.logger.log(
        `Job started: ${job.name} (ID: ${job.id}) - Checking expired subscriptions`,
      );

      // Tìm tất cả subscription đang ACTIVE và đã hết hạn (end_date < now)
      const expiredSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          end_date: LessThan(new Date()),
        },
        relations: ['plan', 'user'],
      });

      if (expiredSubscriptions.length === 0) {
        this.logger.log('No expired subscriptions found');
        return { updatedCount: 0 };
      }

      this.logger.log(
        `Found ${expiredSubscriptions.length} expired subscriptions`,
      );

      // Cập nhật status thành EXPIRED
      let updatedCount = 0;
      for (const subscription of expiredSubscriptions) {
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(subscription);

        this.logger.log(
          `Updated subscription ID ${subscription.id} for user ${subscription.user_id} to EXPIRED`,
        );
        updatedCount++;
      }

      this.logger.log(
        `Job completed: Updated ${updatedCount} subscriptions to EXPIRED`,
      );

      return { updatedCount };
    } catch (error) {
      this.logger.error('Job failed:', error);
      throw error;
    }
  }
}
