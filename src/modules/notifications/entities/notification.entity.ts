import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { NotificationType, NotificationStatus } from '../../../enums/notification.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ 
    name: 'type', 
    type: 'enum', 
    enum: NotificationType,
    default: NotificationType.INFO 
  })
  type: NotificationType;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD 
  })
  status: NotificationStatus;

  @Column({ name: 'action_url', type: 'varchar', nullable: true })
  action_url?: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: any;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  read_at?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}