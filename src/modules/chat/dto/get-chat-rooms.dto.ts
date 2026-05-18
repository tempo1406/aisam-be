import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatRoomStatus } from 'src/enums/chat.enum';

export class GetChatRoomsDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ChatRoomStatus,
  })
  @IsOptional()
  @IsEnum(ChatRoomStatus)
  status?: ChatRoomStatus;

  @ApiPropertyOptional({ description: 'Search by user name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
