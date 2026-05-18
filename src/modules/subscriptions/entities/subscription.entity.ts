import { User } from '@modules/users/entities/user.entity';
import { Plan } from '@modules/plans/entities/plan.entity';
import { SubscriptionStatus } from 'src/enums/subscription.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('increment', {
    primaryKeyConstraintName: 'PK_subscription_id',
  })
  id: number;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'uuid', nullable: false })
  plan_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: false })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
    nullable: false,
  })
  status: SubscriptionStatus;

  @Column({ type: 'int', default: 0, nullable: false })
  usage_count: number;

  @Column({ type: 'int', default: 5, nullable: false })
  max_usage: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.id)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
