import { Module, forwardRef } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookController } from './facebook.controller';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { SocialModule } from '@modules/social/social.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    JwtModule,
    HttpModule,
    PassportModule.register({ session: true }),
    forwardRef(() => SocialModule),
  ],
  controllers: [FacebookController],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}
