import { User } from '@modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ChatRoomStatus } from 'src/enums/chat.enum';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  admin_id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({
    type: 'enum',
    enum: ChatRoomStatus,
    default: ChatRoomStatus.ACTIVE,
  })
  status: ChatRoomStatus;

  @Column({ type: 'int', default: 0 })
  unread_count_user: number;

  @Column({ type: 'int', default: 0 })
  unread_count_admin: number;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date;

  @OneToMany(() => ChatMessage, (message) => message.chat_room)
  messages: ChatMessage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
