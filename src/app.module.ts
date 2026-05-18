import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from '@configs/app.config';
import postgreConfig from '@database/config/postgre.config';
import { UsersModule } from '@modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from '@database/config/type-orm.config';
import redisConfig from '@database/config/redis.config';
import { RedisModule } from '@nestjs-modules/ioredis';
import googleConfig from '@modules/auth/configs/google-oauth.config';
import { AuthModule } from '@modules/auth/auth.module';
import jwtConfig from '@modules/auth/configs/jwt.config';
import refreshJwtConfig from '@modules/auth/configs/refresh-jwt.config';
import authConfig from '@modules/auth/configs/auth.config';
import mailConfig from '@modules/mail/configs/mail.config';
import { MaillerModule } from '@modules/mail/mail.module';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { apiDocs_config } from '@configs/api-docs.config';
import cloudinaryConfig from '@configs/cloudinary.config';
import { RolesModule } from '@modules/roles/roles.module';
import { CategoryModule } from '@modules/categories/categories.module';
import { AiModule } from '@modules/ai/ai.module';
import geminiApiConfig from '@configs/gemini-api.config';
import { BrandsModule } from '@modules/brands/brands.module';
import { HashtagCollectionsModule } from '@modules/hashtag_collections/hashtag_collections.module';
import { PostModule } from '@modules/post/post.module';
import { PlansModule } from '@modules/plans/plans.module';
import huggingfaceApiConfig from '@configs/huggingface-api.config';
import { SubscriptionsModule } from '@modules/subscriptions/subscriptions.module';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { EventsModule } from '@modules/events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SocialModule } from '@modules/social/social.module';
import { BullmqModule } from '@modules/bull/bullmq.module';
import { FacebookModule } from '@modules/socials-connect/facebook/facebook.module';
import { InstagramModule } from '@modules/socials-connect/instagram/instagram.module';
import { PolicyModule } from '@modules/policy/policy.module';
import { PaymentModule } from '@modules/payment/payment.module';
import rabbitmqConfig from '@configs/rabbitmq.config';
import { SocketModule } from '@modules/socket/socket.module';
import { AdminModule } from '@modules/admin/admin.module';
import { StatisticsModule } from '@modules/statistics/statistics.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { ChatModule } from '@modules/chat/chat.module';
import { CampaignsModule } from '@modules/campaigns/campaigns.module';
import facebookConfig from '@configs/facebook.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        postgreConfig,
        redisConfig,
        jwtConfig,
        refreshJwtConfig,
        authConfig,
        googleConfig,
        mailConfig,
        cloudinaryConfig,
        apiDocs_config,
        geminiApiConfig,
        huggingfaceApiConfig,
        rabbitmqConfig,
        facebookConfig,
      ],
      cache: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'single',
          options: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
            username: configService.get<string>('redis.username'),
            password: configService.get<string>('redis.password'),
            tls: configService.get<boolean>('redis.tls') ? {} : undefined,
            retryStrategy: (times: number) => {
              if (times > 5) {
                return null; // Stop retrying after 5 attempts
              }
              const delay = Math.min(times * 2000, 10000); // Longer delays
              return delay;
            },
            connectTimeout: 15000,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            enableOfflineQueue: true,
            keepAlive: 30000,
          },
        };
      },
    }),
    CustomCacheModule,
    EventsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CategoryModule,
    HashtagCollectionsModule,
    BrandsModule,
    PostModule,
    PlansModule,
    SubscriptionsModule,
    MaillerModule,
    CloudinaryModule,
    AiModule,
    FacebookModule,
    InstagramModule,
    SocialModule,
    BullmqModule,
    PolicyModule,
    PaymentModule,
    SocketModule,
    AdminModule,
    StatisticsModule,
    NotificationsModule,
    ChatModule,
    CampaignsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
