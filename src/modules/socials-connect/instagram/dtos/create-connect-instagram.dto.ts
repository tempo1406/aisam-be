import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectInstagramAccountDto {
  @IsString()
  @IsNotEmpty()
  instagramAccountId: string;

  @IsString()
  @IsNotEmpty()
  instagramUsername: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsOptional()
  instagramName?: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsNumber()
  @IsOptional()
  followersCount?: number;

  @IsNumber()
  @IsOptional()
  followsCount?: number;

  @IsNumber()
  @IsOptional()
  mediaCount?: number;
}

export class ConnectMultipleInstagramAccountsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConnectInstagramAccountDto)
  accounts: ConnectInstagramAccountDto[];
}
