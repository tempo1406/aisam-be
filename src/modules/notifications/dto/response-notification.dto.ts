import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationStatus } from '../../../enums/notification.enum';

export class ResponseNotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  user_id: string;

  @ApiProperty({ description: 'Notification title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @Expose()
  message: string;

  @ApiProperty({ 
    description: 'Notification type',
    enum: NotificationType 
  })
  @Expose()
  type: NotificationType;

  @ApiProperty({ 
    description: 'Notification status',
    enum: NotificationStatus 
  })
  @Expose()
  status: NotificationStatus;

  @ApiProperty({ description: 'Action URL', required: false })
  @Expose()
  action_url?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @Expose()
  metadata?: any;

  @ApiProperty({ description: 'Read timestamp', required: false })
  @Expose()
  read_at?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  created_at: Date;

  @ApiProperty({ description: 'Update timestamp' })
  @Expose()
  updated_at: Date;
}