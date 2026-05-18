import { ResponseBrandDto } from '@modules/brands/dto/response-brand.dto';
import { ResponseCategoryDto } from '@modules/categories/dto/response-category.dto';
import { ResponseSocialDto } from '@modules/social/dto/response-social.dto';
import { Exclude, Expose, Type } from 'class-transformer';
import { PostStatus } from 'src/enums/post.enum';

@Exclude()
export class ResponsePostSocialAccountDto {
  @Expose()
  id: string;

  @Expose()
  social_account_id: string;

  @Expose()
  status: PostStatus;

  @Expose()
  platform_post_id: string;

  @Expose()
  scheduled_at: Date;

  @Expose()
  published_at: Date;

  @Expose()
  likes: number;

  @Expose()
  comments: number;

  @Expose()
  shares: number;

  @Expose()
  reach: number;

  @Expose()
  error_message: string;

  @Expose()
  retry_count: number;

  @Expose()
  @Type(() => ResponseSocialDto)
  socialAccount: ResponseSocialDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

@Exclude()
export class ResponsePostDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  image: string[];

  @Expose()
  hashtag_collection: string[];

  @Expose()
  status: PostStatus;

  @Expose()
  post_now: boolean;

  @Expose()
  date_post: Date;

  @Expose()
  user_id: string;

  @Expose()
  @Type(() => ResponseBrandDto)
  brand: ResponseBrandDto;

  @Expose()
  @Type(() => ResponseCategoryDto)
  category: ResponseCategoryDto;

  @Expose()
  @Type(() => ResponseSocialDto)
  socialAccount: ResponseSocialDto;

  @Expose()
  facebook_post_id: string;

  @Expose()
  @Type(() => ResponsePostSocialAccountDto)
  postSocialAccounts: ResponsePostSocialAccountDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
