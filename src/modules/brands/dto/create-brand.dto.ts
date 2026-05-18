import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    description: 'Brand name',
    example: 'Nike',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Brand slogan',
    example: 'Just Do It',
  })
  @IsString()
  @IsNotEmpty()
  slogan: string;

  @ApiProperty({
    description: 'Main description of the brand',
    example:
      'Nike is a multinational corporation that designs, develops, and manufactures athletic footwear, apparel, equipment, and accessories.',
  })
  @IsString()
  @IsNotEmpty()
  main_description: string;

  @ApiProperty({
    description: 'Representative character description',
    example:
      'The Nike Swoosh represents movement and speed, embodying the spirit of the winged goddess of victory from Greek mythology.',
  })
  @IsString()
  @IsNotEmpty()
  representative_character_description: string;

  @ApiProperty({
    description: 'Representative character name',
    example: 'Nike Swoosh',
  })
  @IsString()
  @IsNotEmpty()
  representative_character_name: string;

  @ApiProperty({
    description: 'Representative character image URL',
    example: 'https://example.com/nike-swoosh.png',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  representative_character_image: string;

  @ApiProperty({
    description: 'Brand website URL',
    example: 'https://www.nike.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  web_url: string;
}
