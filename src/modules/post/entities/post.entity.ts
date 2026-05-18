import { Brand } from '@modules/brands/entities/brand.entity';
import { Categories } from '@modules/categories/entities/categories.entity';
import { SocialAccount } from '@modules/social/entities/social-account.entity';
import { PostStatus } from 'src/enums/post.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostSocialAccount } from './post-social-account.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_post_id' })
  id: string;

  @Column({ nullable: true })
  content: string;

  @Column({ type: 'text', array: true, nullable: true })
  image: string[];

  @Column({ type: 'enum', enum: PostStatus, nullable: false })
  status: PostStatus;

  @Column({ type: 'text', array: true, nullable: true })
  hashtag_collection: string[] | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  post_now: boolean;

  @Column({ type: 'timestamp', nullable: true })
  date_post: Date | null;

  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  @ManyToOne(() => Categories, (category) => category.id)
  @JoinColumn({ name: 'category_id' })
  category: Categories;

  @Column({ type: 'uuid', nullable: true })
  brand_id: string | null;

  @ManyToOne(() => Brand, (brand) => brand.id)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  // DEPRECATED: Kept for backward compatibility
  @Column({ type: 'uuid', nullable: true })
  social_account_id: string | null;

  @ManyToOne(() => SocialAccount, (socialAccount) => socialAccount.id)
  @JoinColumn({ name: 'social_account_id' })
  socialAccount: SocialAccount;

  @Column({ type: 'varchar', nullable: true })
  facebook_post_id: string | null;

  @OneToMany(
    () => PostSocialAccount,
    (postSocialAccount) => postSocialAccount.post,
    { cascade: true },
  )
  postSocialAccounts: PostSocialAccount[];

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'timestamp', nullable: true })
  delete_at: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
