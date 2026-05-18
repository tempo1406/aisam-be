import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { Brand } from '@modules/brands/entities/brand.entity';
import {
  CampaignStatus,
  Platform,
  ContentTone,
  AIModel,
  ImageStyle,
  DayOfWeek,
} from 'src/enums/campaign.enum';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  // Strategy Configuration
  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ type: 'simple-array', nullable: true })
  targetPlatforms: Platform[];

  @Column({ type: 'jsonb', nullable: true })
  contentGuidelines: {
    tone: ContentTone;
    topics: string[];
    keywords: string[];
    doNots: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  scheduleConfig: {
    postsPerWeek: number;
    preferredTimes: string[];
    preferredDays: DayOfWeek[];
  };

  // AI Configuration
  @Column({ type: 'jsonb', nullable: true })
  aiConfig: {
    model: AIModel;
    creativity: number;
    imageStyle: ImageStyle;
    autoApprove: boolean;
  };

  // Metrics
  @Column({ type: 'int', default: 0 })
  totalGeneratedPosts: number;

  @Column({ type: 'int', default: 0 })
  totalPublishedPosts: number;

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    totalPosts: number;
    approvedPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  // Relations - removed OneToMany to avoid circular dependencies
  // Use repository queries to fetch related posts and agent runs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
