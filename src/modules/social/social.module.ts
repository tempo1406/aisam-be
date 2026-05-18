import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SocialAccount } from './entities/social-account.entity';
import { SocialAccountController } from './social-account.controller';
import { SocialAccountService } from './social-account.service';
import { FacebookModule } from '@modules/socials-connect/facebook/facebook.module';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { EventsModule } from '@modules/events/events.module';
import { User } from '@modules/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialAccount, User]),
    JwtModule,
    FacebookModule,
    CustomCacheModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [SocialAccountController],
  providers: [SocialAccountService],
  exports: [SocialAccountService],
})
export class SocialModule {}
