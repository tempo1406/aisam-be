import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectFacebookPageDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;

  @IsString()
  @IsNotEmpty()
  pageName: string;

  @IsString()
  @IsNotEmpty()
  pageAccessToken: string;

  @IsString()
  @IsOptional()
  pageImageUrl?: string;

  @IsNumber()
  @IsOptional()
  fanCount?: number;

  @IsNumber()
  @IsOptional()
  followersCount?: number;

  // Instagram account linked to this Facebook Page (optional)
  @IsString()
  @IsOptional()
  instagramAccountId?: string;

  @IsString()
  @IsOptional()
  instagramUsername?: string;

  @IsString()
  @IsOptional()
  instagramName?: string;

  @IsString()
  @IsOptional()
  instagramProfilePictureUrl?: string;

  @IsNumber()
  @IsOptional()
  instagramFollowersCount?: number;

  @IsNumber()
  @IsOptional()
  instagramFollowsCount?: number;

  @IsNumber()
  @IsOptional()
  instagramMediaCount?: number;
}

export class ConnectMultipleFacebookPagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConnectFacebookPageDto)
  pages: ConnectFacebookPageDto[];
}
