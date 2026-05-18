import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatRoomStatus } from 'src/enums/chat.enum';
import { ResponseUserDto } from '@modules/users/dto/response-user.dto';

export class ResponseChatRoomDto {
  @ApiProperty({ description: 'Chat room ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  user_id: string;

  @ApiPropertyOptional({ description: 'User details' })
  @Expose()
  @Type(() => ResponseUserDto)
  user?: ResponseUserDto;

  @ApiPropertyOptional({ description: 'Admin ID' })
  @Expose()
  admin_id?: string;

  @ApiPropertyOptional({ description: 'Admin details' })
  @Expose()
  @Type(() => ResponseUserDto)
  admin?: ResponseUserDto;

  @ApiProperty({
    description: 'Room status',
    enum: ChatRoomStatus,
  })
  @Expose()
  status: ChatRoomStatus;

  @ApiProperty({ description: 'Unread count for user' })
  @Expose()
  unread_count_user: number;

  @ApiProperty({ description: 'Unread count for admin' })
  @Expose()
  unread_count_admin: number;

  @ApiPropertyOptional({ description: 'Last message timestamp' })
  @Expose()
  last_message_at?: Date;

  @ApiPropertyOptional({ description: 'Last message preview' })
  @Expose()
  last_message?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  created_at: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @Expose()
  updated_at: Date;
}
