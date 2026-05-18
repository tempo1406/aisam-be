import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { Campaign } from './campaign.entity';
import { CampaignPostStatus, Platform } from 'src/enums/campaign.enum';

@Entity('campaign_posts')
export class CampaignPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Campaign, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  // Content
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'simple-array', nullable: true })
  hashtags: string[];

  // Platform-specific versions
  @Column({ type: 'jsonb', nullable: true })
  platformVariants: {
    facebook?: {
      content: string;
      images: string[];
    };
    instagram?: {
      content: string;
      images: string[];
      isReel: boolean;
    };
    tiktok?: {
      content: string;
      videoUrl: string;
    };
  };

  // Scheduling
  @Column({ type: 'jsonb', nullable: true })
  suggestedSchedule: Array<{
    platform: Platform;
    scheduledTime: Date;
    priority: number;
  }>;

  // Status
  @Column({
    type: 'enum',
    enum: CampaignPostStatus,
    default: CampaignPostStatus.DRAFT,
  })
  status: CampaignPostStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  // After published - link to actual posts
  @Column({ type: 'jsonb', nullable: true })
  publishedPosts: Array<{
    platform: Platform;
    postId: string;
    platformPostId: string;
    publishedAt: Date;
    metrics: {
      likes: number;
      comments: number;
      shares: number;
      reach: number;
    };
  }>;

  // AI Generation metadata
  @Column({ type: 'jsonb', nullable: true })
  aiMetadata: {
    model: string;
    creativity: number;
    imageStyle: string;
    generatedAt: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
