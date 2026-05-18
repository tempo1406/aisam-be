import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePostPhotosFacebookDto {
  @ApiProperty({ example: 'Hello, world!' })
  @IsString()
  @IsNotEmpty()
  caption: string;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/di8fhgrou/image/upload/v1758621172/avatar/logo_1758621177794.jpg',
      'https://res.cloudinary.com/di8fhgrou/image/upload/v1758621172/avatar/logo_1758621177795.jpg',
    ],
    description: 'Danh sách URL ảnh',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  page_id: string;

  @ApiProperty({ example: 'EAAJ...xyz' })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
