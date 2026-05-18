import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entities/post.entity';
import { JwtModule } from '@nestjs/jwt';
import { BrandsModule } from '@modules/brands/brands.module';
import { HashtagCollectionsModule } from '@modules/hashtag_collections/hashtag_collections.module';
import { CategoryModule } from '@modules/categories/categories.module';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { EventsModule } from '@modules/events/events.module';
import { AiModule } from '@modules/ai/ai.module';
import { SocialModule } from '@modules/social/social.module';
import { SubscriptionsModule } from '@modules/subscriptions/subscriptions.module';
import { PostSocialAccount } from './entities/post-social-account.entity';
import { FacebookModule } from '@modules/socials-connect/facebook/facebook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostSocialAccount]),
    JwtModule,
    forwardRef(() => BrandsModule),
    forwardRef(() => HashtagCollectionsModule),
    forwardRef(() => CategoryModule),
    CustomCacheModule,
    forwardRef(() => EventsModule),
    AiModule,
    forwardRef(() => SocialModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => FacebookModule),
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
