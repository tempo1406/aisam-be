import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { NotificationStatus } from '../../../enums/notification.enum';

export class UpdateNotificationStatusDto {
  @ApiProperty({ 
    description: 'New notification status',
    enum: NotificationStatus 
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}