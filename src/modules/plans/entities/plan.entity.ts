import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanEnum } from 'src/enums/plan.enum';
import { CurrencyEnum } from 'src/enums/plan.enum';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_plan_id' })
  id: string;

  @Column({
    type: 'enum',
    enum: PlanEnum,
    unique: true,
    nullable: false,
  })
  name: PlanEnum;

  @Column({
    type: 'enum',
    enum: CurrencyEnum,
    default: CurrencyEnum.VND,
    nullable: false,
  })
  currency: CurrencyEnum;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  price: number;

  @Column({ type: 'int', default: 30, nullable: false })
  duration_days: number;

  @Column({ type: 'int', nullable: false })
  max_usage: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  delete_at?: Date;
}
