import { Expose } from 'class-transformer';
import {
  SocialAccountPlatform,
  SocialAccountStatus,
} from 'src/enums/social.enum';

export class ResponseSocialDto {
  @Expose()
  id: string;
  @Expose()
  platform: SocialAccountPlatform;
  @Expose()
  page_id: string;
  @Expose()
  page_name: string;
  @Expose()
  page_image_url: string;
  @Expose()
  fan_count: number; // Facebook only
  @Expose()
  followers_count: number; // Facebook & Instagram
  @Expose()
  follows_count: number; // Instagram only
  @Expose()
  media_count: number; // Instagram only
  @Expose()
  token_expires_at?: Date;
  @Expose()
  status: SocialAccountStatus;
  @Expose()
  permissions?: string[];
}

export class ResponseSocialWithAccessTokenDto {
  @Expose()
  id: string;
  @Expose()
  platform: SocialAccountPlatform;
  @Expose()
  page_id: string;
  @Expose()
  page_name: string;
  @Expose()
  page_image_url: string;
  @Expose()
  fan_count: number; // Facebook only
  @Expose()
  followers_count: number; // Facebook & Instagram
  @Expose()
  follows_count: number; // Instagram only
  @Expose()
  media_count: number; // Instagram only
  @Expose()
  token_expires_at?: Date;
  @Expose()
  access_token: string;
  @Expose()
  status: SocialAccountStatus;
  @Expose()
  permissions?: string[];
}
