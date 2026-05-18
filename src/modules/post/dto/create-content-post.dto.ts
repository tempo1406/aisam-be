import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateContentPostDto {
  @ApiProperty({
    description: 'Brand ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  brand_id: string;

  @ApiProperty({
    description: 'Hashtag Collection ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  hashtag_collection_id: string;

  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  category_id: string;

  @ApiProperty({
    description: 'User prompt',
    example: 'I want to create a post about the latest fashion trends',
  })
  @IsString()
  @IsNotEmpty()
  user_prompt: string;

  @ApiProperty({
    description: 'Is generate hashtag',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  is_generate_hashtag: boolean;

  @ApiProperty({
    description: 'Number of content',
    example: 1,
  })
  @IsNumber()
  number_of_content: number;

  @ApiProperty({
    description: 'Tone of content',
    example: 'formal',
  })
  @IsString()
  tone_of_content: string;

  @ApiProperty({
    description: 'Length of content',
    example: 30,
  })
  @IsNumber()
  length_of_content: number;

  @ApiProperty({
    description: 'Is have icon',
    example: true,
  })
  @IsBoolean()
  isHaveIcon: boolean;

  @ApiProperty({
    description: 'Language',
    example: 'vi',
  })
  @IsString()
  language: string;
}
