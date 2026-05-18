import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@modules/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './configs/jwt.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MaillerModule } from '@modules/mail/mail.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-jwt.strategy';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { HttpModule } from '@nestjs/axios';
import { FacebookModule } from '@modules/socials-connect/facebook/facebook.module';
import { SocialModule } from '@modules/social/social.module';
import { InstagramModule } from '@modules/socials-connect/instagram/instagram.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    MaillerModule,
    HttpModule,
    forwardRef(() => FacebookModule),
    forwardRef(() => InstagramModule),
    forwardRef(() => SocialModule),
  ],
  exports: [JwtModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    FacebookStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
