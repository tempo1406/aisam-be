import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { StatisticsSnapshot } from './entities/statistics-snapshot.entity';
import { SocialModule } from '@modules/social/social.module';
import { JwtModule } from '@nestjs/jwt';
import { MaillerModule } from '@modules/mail/mail.module';
import { UsersModule } from '@modules/users/users.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatisticsSnapshot]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    SocialModule,
    JwtModule,
    MaillerModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
