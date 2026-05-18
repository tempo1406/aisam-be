import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({ description: 'Chat room ID to mark messages as read' })
  @IsNotEmpty()
  @IsString()
  chat_room_id: string;
}
