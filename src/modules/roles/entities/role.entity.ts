import { User } from '@modules/users/entities/user.entity';
import { RoleEnum } from 'src/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_role_id' })
  id: string;

  @Column({
    unique: true,
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.USER,
  })
  name: RoleEnum;

  @Column({ nullable: false })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
