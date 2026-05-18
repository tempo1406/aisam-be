import { buildQueueConfig } from '@modules/bull/configs/queue.config';
import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostSocialEvents } from './post-social.queue.events';
import { PostSocialQueueProcessor } from './post-social.queue.processor';
import { PostSocialQueueService } from './post-social.queue.service';
import { PostModule } from '@modules/post/post.module';
import { SocialModule } from '@modules/social/social.module';
import { FacebookModule } from '@modules/socials-connect/facebook/facebook.module';
import { InstagramModule } from '@modules/socials-connect/instagram/instagram.module';
import { SubscriptionsModule } from '@modules/subscriptions/subscriptions.module';
import { PostSocialAccount } from '@modules/post/entities/post-social-account.entity';

@Module({
  imports: [
    BullModule.registerQueue(...buildQueueConfig()),
    TypeOrmModule.forFeature([PostSocialAccount]),
    forwardRef(() => PostModule),
    forwardRef(() => SocialModule),
    forwardRef(() => FacebookModule),
    forwardRef(() => InstagramModule),
    SubscriptionsModule,
  ],
  providers: [
    PostSocialEvents,
    PostSocialQueueProcessor,
    PostSocialQueueService,
  ],
  exports: [PostSocialQueueService],
})
export class PostSocialModule {}
