import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectFacebookDto {
  @ApiProperty({
    description: 'Short-lived access token from Facebook Login',
    example: 'EAABwz...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class ExchangeTokenResponseDto {
  @ApiProperty({ example: 'EAABwz...' })
  access_token: string;

  @ApiProperty({ example: 'bearer' })
  token_type: string;

  @ApiProperty({ example: 5183944 })
  expires_in: number;
}

export class FacebookPageDto {
  @ApiProperty({ example: '123456789' })
  id: string;

  @ApiProperty({ example: 'My Business Page' })
  name: string;

  @ApiProperty({ example: 'EAABwz...' })
  access_token: string;

  @ApiProperty({ example: 'PAGE' })
  category: string;

  @ApiProperty({ example: ['MANAGE', 'CREATE_CONTENT'] })
  tasks?: string[];
}

export class InstagramAccountDto {
  @ApiProperty({ example: '987654321' })
  id: string;

  @ApiProperty({ example: 'mybusiness' })
  username: string;

  @ApiProperty({ example: 'My Business Instagram' })
  name?: string;

  @ApiProperty({ example: 'https://...' })
  profile_picture_url?: string;

  @ApiProperty({ example: 1500 })
  followers_count?: number;

  @ApiProperty({ example: 250 })
  follows_count?: number;

  @ApiProperty({ example: 85 })
  media_count?: number;
}

export class ConnectedPageResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'facebook' })
  platform: string;

  @ApiProperty({ example: '123456789' })
  pageId: string;

  @ApiProperty({ example: 'My Business Page' })
  pageName: string;

  @ApiProperty({ example: 'https://....' })
  pageImageUrl?: string;

  @ApiProperty({ example: 5000 })
  fanCount?: number;

  @ApiProperty({ example: 4800 })
  followersCount?: number;

  @ApiProperty({ example: 250 })
  followsCount?: number;

  @ApiProperty({ example: 85 })
  mediaCount?: number;

  @ApiProperty({ example: true })
  hasInstagram: boolean;

  @ApiProperty({ example: 'mybusiness' })
  instagramUsername?: string;

  @ApiProperty({ example: '987654321' })
  instagramAccountId?: string;
}
