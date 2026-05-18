import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateHashtagCollectionDto {
  @ApiProperty({
    description: 'Name of the hashtag collection',
    example: 'Fashion Trends 2024',
  })
  @IsString()
  @IsNotEmpty()
  collection_name: string;

  @ApiProperty({
    description: 'Description of the hashtag collection',
    example: 'A collection of trending fashion hashtags for 2024',
  })
  @IsString()
  @IsNotEmpty()
  collection_description: string;

  @ApiProperty({
    description:
      'List of hashtags in the collection (comma-separated or JSON format)',
    example: ['#fashion', '#style', '#trend', '#2024', '#ootd'],
  })
  @IsArray()
  @IsNotEmpty()
  list_hashtag: string[];
}
