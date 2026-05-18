import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { SocialAccount } from '@modules/social/entities/social-account.entity';
import { PostStatus } from 'src/enums/post.enum';

@Entity('post_social_accounts')
export class PostSocialAccount {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_post_social_account_id',
  })
  id: string;

  @Column({ type: 'uuid', nullable: false })
  post_id: string;

  @ManyToOne(() => Post, (post) => post.postSocialAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'uuid', nullable: false })
  social_account_id: string;

  @ManyToOne(() => SocialAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'social_account_id' })
  socialAccount: SocialAccount;

  // Status riêng cho từng platform
  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.SCHEDULED,
  })
  status: PostStatus;

  // ID bài post trên platform (facebook_post_id, instagram_media_id)
  @Column({ type: 'varchar', nullable: true })
  platform_post_id: string | null;

  // Thời gian đăng riêng cho từng platform
  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date | null;

  @Column({ type: 'boolean', nullable: true })
  post_now: boolean;

  // Metrics riêng cho từng platform
  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  @Column({ type: 'bigint', default: 0 })
  reach: number;

  // Error handling
  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
