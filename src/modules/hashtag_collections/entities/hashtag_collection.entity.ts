import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('hashtag_collection')
export class HashtagCollection {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_hashtag_collection_id',
  })
  id: string;

  @Column({ nullable: false })
  collection_name: string;

  @Column({ nullable: false })
  collection_description: string;

  @Column({ type: 'text', nullable: false, array: true })
  list_hashtag: string[];

  @Column({ nullable: false })
  user_id: string;

  @Column({ nullable: true })
  delete_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at: Date;
}
