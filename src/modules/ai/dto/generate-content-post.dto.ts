import { ResponseBrandDto } from '@modules/brands/dto/response-brand.dto';
import { ResponseCategoryDto } from '@modules/categories/dto/response-category.dto';
import { ResponseHashtagCollectionDto } from '@modules/hashtag_collections/dto/response-hashtag_collection.dto';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GenerateContentPostDto {
  @IsOptional()
  brand?: ResponseBrandDto;

  @IsOptional()
  hashtag_collection?: ResponseHashtagCollectionDto;

  @IsOptional()
  category?: ResponseCategoryDto;

  @IsString()
  @IsNotEmpty()
  user_prompt: string;

  @IsBoolean()
  @IsNotEmpty()
  is_generate_hashtag: boolean;

  @IsNumber()
  @IsNotEmpty()
  number_of_content: number;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  tone_of_content: string;

  @IsNumber()
  @IsNotEmpty()
  length_of_content: number;

  @IsBoolean()
  @IsNotEmpty()
  isHaveIcon: boolean;
}
