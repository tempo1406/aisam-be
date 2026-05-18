import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('statistics_snapshots')
@Index(['socialAccountId', 'postId', 'snapshotDate'], { unique: true })
export class StatisticsSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'social_account_id' })
  @Index()
  socialAccountId: string;

  @Column({ type: 'varchar', length: 255, name: 'post_id' })
  postId: string;

  @Column({ type: 'date', name: 'snapshot_date' })
  @Index()
  snapshotDate: Date;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', name: 'post_created_at', nullable: true })
  postCreatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
