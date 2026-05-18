import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { MessageType } from 'src/enums/chat.enum';

export class SendMessageDto {
  @ApiProperty({ description: 'Chat room ID' })
  @IsNotEmpty()
  @IsString()
  chat_room_id: string;

  @ApiProperty({ description: 'Message content' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  message_type?: MessageType;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
