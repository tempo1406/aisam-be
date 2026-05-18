import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetInforPlatformDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  page_id: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}

export class GetInforPlatformResponseDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Page name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsNotEmpty()
  fan_count: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsNotEmpty()
  followers_count: number;

  @ApiProperty({
    example:
      'https://scontent.fsgn2-4.fna.fbcdn.net/v/t39.30808-1/558882941_1186519313296855_4672951622679702092_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=101&ccb=1-7&_nc_sid=f907e8&_nc_ohc=Ey-jLnSM60EQ7kNvwFRxcMg&_nc_oc=AdnWn0C2Fg8mLjRvIerl_AkGUEolzfPFQeH6XubwUF4XUYvvW420Cph0pJnOpvsSyP4&_nc_zt=24&_nc_ht=scontent.fsgn2-4.fna&edm=AJdBtusEAAAA&_nc_gid=RMwV0XimofnEONQSTDX2Dg&oh=00_Afc9RZD2ZPKo2XxCkbqm1SZGNO0nZXEDen_IGNpC1YrzpA&oe=68E4FB85',
  })
  @IsString()
  @IsNotEmpty()
  page_image_url: string;
}
