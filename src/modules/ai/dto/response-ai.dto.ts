import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ResponseTextToImagesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];
}
