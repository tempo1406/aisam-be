import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatRoomDto {
  @ApiProperty({
    description: 'User ID to chat with (for admin creating chat)',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
