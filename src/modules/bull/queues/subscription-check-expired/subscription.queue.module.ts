import { buildQueueConfig } from '@modules/bull/configs/queue.config';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '@modules/subscriptions/entities/subscription.entity';
import { SubscriptionCheckExpiredEvents } from './subscription.queue.event';
import { SubscriptionCheckExpiredQueueProcessor } from './subsription.queue.processor';
import { SubscriptionCheckExpiredQueueService } from './subscription.queue.service';

@Module({
  imports: [
    BullModule.registerQueue(...buildQueueConfig()),
    TypeOrmModule.forFeature([Subscription]),
  ],
  providers: [
    SubscriptionCheckExpiredEvents,
    SubscriptionCheckExpiredQueueProcessor,
    SubscriptionCheckExpiredQueueService,
  ],
  exports: [
    SubscriptionCheckExpiredEvents,
    SubscriptionCheckExpiredQueueService,
  ],
})
export class SubscriptionCheckExpiredModule {}
