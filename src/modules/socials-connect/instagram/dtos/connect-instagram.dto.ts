import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectInstagramDto {
  @ApiProperty({
    description: 'Facebook Page ID that has Instagram Business Account linked',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: 'Facebook Page access token',
    example: 'EAABwz...',
  })
  @IsString()
  @IsNotEmpty()
  pageAccessToken: string;

  @ApiProperty({
    description: 'User ID to connect Instagram account to',
    example: 'uuid-here',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class InstagramAccountResponseDto {
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
