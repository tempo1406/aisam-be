import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const customStore = {
      store: (req: any, callback: (err: any, state?: string) => void) => {
        callback(null, undefined);
      },
      verify: (
        req: any,
        providedState: string,
        callback: (err: any, ok?: boolean, state?: string) => void,
      ) => {
        callback(null, true, providedState);
      },
    };

    super({
      authorizationURL: 'https://www.facebook.com/v23.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v23.0/oauth/access_token',
      clientID: configService.get<string>('facebook.appId'),
      clientSecret: configService.get<string>('facebook.appSecret'),
      callbackURL: `${configService.get<string>('BACKEND_DOMAIN')}/api/v1/auth/facebook/callback`,
      scope: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_content_publish',
      ],
      state: true,
      store: customStore, // Use custom store instead of session
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      // Get user info from Facebook
      const userInfoUrl = `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${accessToken}`;
      const response = await firstValueFrom(this.httpService.get(userInfoUrl));

      // Get userId from state parameter (passed from FacebookGuard)
      const userId = req.query.state;

      if (!userId) {
        done(new UnauthorizedException('Missing userId'), null);
        return null;
      }

      const user = {
        facebookId: response.data.id,
        name: response.data.name,
        email: response.data.email,
        accessToken,
        userId,
      };

      done(null, user);
      return user;
    } catch (error) {
      console.log('Error', error);
      done(new UnauthorizedException('Failed to validate Facebook user'), null);
      return null;
    }
  }
}
