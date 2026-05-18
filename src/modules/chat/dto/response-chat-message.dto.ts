import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageStatus, MessageType } from 'src/enums/chat.enum';
import { ResponseUserDto } from '@modules/users/dto/response-user.dto';

export class ResponseChatMessageDto {
  @ApiProperty({ description: 'Message ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Chat room ID' })
  @Expose()
  chat_room_id: string;

  @ApiProperty({ description: 'Sender ID' })
  @Expose()
  sender_id: string;

  @ApiPropertyOptional({ description: 'Sender details' })
  @Expose()
  @Type(() => ResponseUserDto)
  sender?: ResponseUserDto;

  @ApiProperty({ description: 'Message content' })
  @Expose()
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
  })
  @Expose()
  message_type: MessageType;

  @ApiProperty({
    description: 'Message status',
    enum: MessageStatus,
  })
  @Expose()
  status: MessageStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @Expose()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Read timestamp' })
  @Expose()
  read_at?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  created_at: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @Expose()
  updated_at: Date;
}
