import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '@modules/post/entities/post.entity';

@Entity('categories')
export class Categories {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_category_id',
  })
  id: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  userId: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  descriptions: string;

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  deleted_at: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
