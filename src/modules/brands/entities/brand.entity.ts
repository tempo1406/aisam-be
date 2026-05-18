import { User } from '@modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_brand_id' })
  id: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  slogan: string;

  @Column({ type: 'text', nullable: false })
  main_description: string;

  @Column({ type: 'text', nullable: false })
  representative_character_description: string;

  @Column({ type: 'text', nullable: false })
  representative_character_name: string;

  @Column({ type: 'text', nullable: false })
  representative_character_image: string;

  @Column({ type: 'text', nullable: false })
  web_url: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'timestamp', nullable: true })
  delete_at: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
