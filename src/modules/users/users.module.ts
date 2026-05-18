import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SocialAccount } from '@modules/social/entities/social-account.entity';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from '@modules/roles/roles.module';
import { EventsModule } from '@modules/events/events.module';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { SubscriptionsSubscriber } from 'src/middlewares/subscribers/subscriptions.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SocialAccount]),
    forwardRef(() => RolesModule),
    CloudinaryModule,
    JwtModule,
    forwardRef(() => EventsModule),
    CustomCacheModule,
  ],
  controllers: [UsersController],
  exports: [UsersService],
  providers: [UsersService, SubscriptionsSubscriber],
})
export class UsersModule {}
