import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateChatAiDto {
  @ApiProperty({ example: 'xin chào', description: 'Nội dung tin nhắn' })
  @IsNotEmpty()
  @IsString()
  message: string;
}

export class CreateChatAiImageDto {
  @ApiProperty({ example: 'xin chào', description: 'Nội dung tin nhắn' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ example: 1, description: 'Số lượng ảnh' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  number_of_images: number;
}
