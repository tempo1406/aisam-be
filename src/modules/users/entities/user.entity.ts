import { Role } from '@modules/roles/entities/role.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_account_id' })
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  address?: string;

  // 'local' hoặc 'google'
  @Column({ default: 'local' })
  provider: string;

  @Column({ nullable: true })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.id)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ default: false })
  banned: boolean;

  @Column({ nullable: true })
  banReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  bannedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
