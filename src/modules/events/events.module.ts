import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEventsListener } from './listeners/user-events.listenter';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { PostEventsListener } from './listeners/post-events.listener';
import { BrandEventsListener } from './listeners/brand-events.listener';
import { HashtagCollectionsEventsListener } from './listeners/hashtag-collections-events.listener.';
import { PlanEventsListener } from './listeners/plan-events.listener';
import { SubscriptionEventsListener } from './listeners/subscription-events.listener';
import { CategoryEventsListener } from './listeners/category-events.listener';
import { SocialEventsListener } from './listeners/social-events.listener';
import { PublicPostSocialListener } from './listeners/public-post-social.listener';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { PostSocialModule } from '@modules/bull/queues/post-facebook-social/post-social.queue.module';
import { SocialModule } from '@modules/social/social.module';
import { FacebookModule } from '@modules/socials-connect/facebook/facebook.module';
import { InstagramModule } from '@modules/socials-connect/instagram/instagram.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { Post } from '@modules/post/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    CustomCacheModule,
    forwardRef(() => PostSocialModule),
    forwardRef(() => SocialModule),
    FacebookModule,
    InstagramModule,
    NotificationsModule,
  ],
  providers: [
    UserEventsListener,
    PostEventsListener,
    BrandEventsListener,
    HashtagCollectionsEventsListener,
    PlanEventsListener,
    SubscriptionEventsListener,
    CategoryEventsListener,
    SocialEventsListener,
    PublicPostSocialListener,
    NotificationEventListener,
  ],
})
export class EventsModule {}
