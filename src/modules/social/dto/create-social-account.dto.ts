import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { SocialAccountPlatform } from 'src/enums/social.enum';

export class CreateSocialAccountDto {
  @ApiProperty({
    enum: SocialAccountPlatform,
    description: 'Platform của tài khoản mạng xã hội',
  })
  @IsEnum(SocialAccountPlatform)
  @IsNotEmpty()
  platform: SocialAccountPlatform;

  @ApiProperty({
    description: 'ID tài khoản trên platform',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  page_id: string;

  @ApiProperty({
    description: 'Access token để truy cập API',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
