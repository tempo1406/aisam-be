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
import {
  SocialAccountPlatform,
  SocialAccountStatus,
} from 'src/enums/social.enum';

@Entity('social_accounts')
export class SocialAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'platform', type: 'enum', enum: SocialAccountPlatform })
  platform: SocialAccountPlatform;

  @Column({ name: 'page_id', nullable: true })
  page_id: string;

  @Column({ name: 'page_name' })
  page_name: string;

  @Column({ name: 'page_image_url', type: 'text', nullable: true })
  page_image_url?: string;

  // Facebook specific fields
  @Column({ name: 'fan_count', type: 'int', nullable: true })
  fan_count?: number;

  // Common fields (Facebook & Instagram)
  @Column({ name: 'followers_count', type: 'int', nullable: true })
  followers_count?: number;

  // Instagram specific fields
  @Column({ name: 'follows_count', type: 'int', nullable: true })
  follows_count?: number;

  @Column({ name: 'media_count', type: 'int', nullable: true })
  media_count?: number;

  @Column({ name: 'access_token', type: 'text', select: false })
  access_token: string;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  token_expires_at: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SocialAccountStatus,
    default: SocialAccountStatus.ACTIVE,
  })
  status: SocialAccountStatus;

  @Column({ name: 'permissions', type: 'json', nullable: true })
  permissions?: string[];

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
