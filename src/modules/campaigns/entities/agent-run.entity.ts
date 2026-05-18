import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { AgentRunStatus, Platform } from 'src/enums/campaign.enum';

@Entity('agent_runs')
export class AgentRun {
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

  @Column({
    type: 'enum',
    enum: AgentRunStatus,
    default: AgentRunStatus.RUNNING,
  })
  status: AgentRunStatus;

  // Input parameters
  @Column({ type: 'jsonb', nullable: true })
  inputParameters: {
    numberOfPosts: number;
    dateRange: {
      from: Date;
      to: Date;
    };
    platforms: Platform[];
  };

  // Output results
  @Column({ type: 'jsonb', nullable: true })
  output: {
    generatedPostIds: string[];
    totalCost: number;
    executionTime: number;
    summary?: string;
  };

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}
