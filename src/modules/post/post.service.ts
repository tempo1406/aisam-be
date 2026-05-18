import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ResponsePostDto } from './dto/response-post.dto';
import { AdminPostDto, GetAdminPostsDto } from './dto/admin-post.dto';
import { Post } from './entities/post.entity';
import { PostStatus } from 'src/enums/post.enum';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { CreateContentPostDto } from './dto/create-content-post.dto';
import { BrandsService } from '@modules/brands/brands.service';
import { ResponseBrandDto } from '@modules/brands/dto/response-brand.dto';
import { ResponseHashtagCollectionDto } from '@modules/hashtag_collections/dto/response-hashtag_collection.dto';
import { ResponseCategoryDto } from '@modules/categories/dto/response-category.dto';
import { HashtagCollectionsService } from '@modules/hashtag_collections/hashtag_collections.service';
import { CategoriesService } from '@modules/categories/categories.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { POST_EVENTS } from '@modules/events/constants/post-events.constant';
import { POST_CACHE } from '@modules/cache/constants/post-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { CreateContentPostAgent } from '@modules/ai/agents/create-content-post.agent';
import { SocialAccountService } from '@modules/social/social-account.service';
import { PUBLIC_POST_SOCIAL_EVENTS } from '@modules/events/constants/public-post-social.constant';
import { SubscriptionsService } from '@modules/subscriptions/subscriptions.service';
import { PostSocialAccount } from './entities/post-social-account.entity';
import { SocialAccountPlatform } from 'src/enums/social.enum';
import { FacebookService } from '@modules/socials-connect/facebook/facebook.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostSocialAccount)
    private readonly postSocialAccountRepository: Repository<PostSocialAccount>,
    private readonly brandsService: BrandsService,
    private readonly hashtagCollectionsService: HashtagCollectionsService,
    private readonly categoriesService: CategoriesService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly createContentPostAgent: CreateContentPostAgent,
    private readonly socialAccountsService: SocialAccountService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly facebookService: FacebookService,
  ) {}

  async create(user_id: string, createPostDto: CreatePostDto): Promise<void> {
    try {
      // Check subscription FIRST - Return 429 if not available
      const hasSubscription =
        await this.subscriptionsService.checkAvailableUsage(
          user_id,
          createPostDto.social_account_ids?.length ?? 0,
        );
      if (!hasSubscription) {
        const error = new ValidationException(
          ErrorCode.S001,
          'Subscription limit reached. Please upgrade your plan.',
        );
        (error as any).statusCode = HttpStatus.TOO_MANY_REQUESTS;
        throw error;
      }

      // Validate brand
      if (createPostDto.brand_id) {
        const brand = await this.brandsService.findOne(createPostDto.brand_id);
        if (!brand) {
          throw new ValidationException(ErrorCode.B001, 'Brand not found');
        }
      }

      // Validate category
      if (createPostDto.category_id) {
        const category = await this.categoriesService.findOne(
          createPostDto.category_id,
        );
        if (!category) {
          throw new ValidationException(ErrorCode.C001, 'Category not found');
        }
      }

      // Validate social accounts (multi-platform)
      const socialAccountIds = createPostDto.social_account_ids || [];
      const validatedAccounts: Array<{
        id: string;
        platform: SocialAccountPlatform;
      }> = [];
      if (socialAccountIds.length > 0) {
        // Verify all social accounts exist and belong to user
        for (const socialAccountId of socialAccountIds) {
          const socialAccount = await this.socialAccountsService.findPageInfo(
            socialAccountId,
            user_id,
          );
          if (!socialAccount) {
            throw new ValidationException(
              ErrorCode.SA001,
              `Social account ${socialAccountId} not found or access denied`,
            );
          }
          validatedAccounts.push({
            id: socialAccount.id,
            platform: socialAccount.platform,
          });
        }
      }

      // Create main post
      const post = this.postRepository.create({
        content: createPostDto.content,
        image: createPostDto.image,
        hashtag_collection: createPostDto.hashtag_collection,
        brand_id: createPostDto.brand_id,
        category_id: createPostDto.category_id,
        user_id,
        status: createPostDto.status || PostStatus.DRAFT,
        post_now: createPostDto.post_now || false,
        date_post: createPostDto.date_post
          ? new Date(createPostDto.date_post)
          : null,
      });
      const savedPost = await this.postRepository.save(post);

      // Create PostSocialAccount entries for each platform
      const postSocialAccounts: PostSocialAccount[] = [];
      if (validatedAccounts.length > 0) {
        for (const socialAccount of validatedAccounts) {
          const postSocialAccount = this.postSocialAccountRepository.create({
            post_id: savedPost.id,
            social_account_id: socialAccount.id,
            status: createPostDto.status || PostStatus.DRAFT,
            post_now: createPostDto.post_now,
            scheduled_at: createPostDto.date_post
              ? new Date(createPostDto.date_post)
              : null,
          });
          postSocialAccounts.push(postSocialAccount);
        }
        // Save all PostSocialAccount entries
        const savedPostSocialAccounts = await this.postSocialAccountRepository.save(postSocialAccounts);
        
        this.logger.log(
          `Created ${savedPostSocialAccounts.length} PostSocialAccount entries for post ${savedPost.id}`,
        );
      }

      this.eventEmitter.emit(POST_EVENTS.CREATED, {
        userId: user_id,
      });

      // Schedule posts for each platform
      if (savedPost.status === PostStatus.SCHEDULED && postSocialAccounts.length > 0) {
        this.logger.log(
          `Emitting SCHEDULE_POST events for ${postSocialAccounts.length} PostSocialAccount entries`,
        );
        
        for (const psa of postSocialAccounts) {
          this.logger.log(
            `Emitting SCHEDULE_POST for PostSocialAccount ${psa.id}, scheduled_at=${psa.scheduled_at?.toISOString()}`,
          );
          
          this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.SCHEDULE_POST, {
            postSocialAccount: psa,
          });
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async generateContent(
    createContentPostDto: CreateContentPostDto,
  ): Promise<string[]> {
    try {
      let brand: ResponseBrandDto | null = null;
      let hashtagCollection: ResponseHashtagCollectionDto | null = null;
      let category: ResponseCategoryDto | null = null;
      if (createContentPostDto.brand_id) {
        brand = await this.brandsService.findOne(createContentPostDto.brand_id);
      }
      if (createContentPostDto.hashtag_collection_id) {
        hashtagCollection = await this.hashtagCollectionsService.findOne(
          createContentPostDto.hashtag_collection_id,
        );
      }
      if (createContentPostDto.category_id) {
        category = await this.categoriesService.findOne(
          createContentPostDto.category_id,
        );
      }

      const content =
        await this.createContentPostAgent.askCreateContentPostAgent({
          brand: brand || undefined,
          hashtag_collection: hashtagCollection || undefined,
          category: category || undefined,
          user_prompt: createContentPostDto.user_prompt,
          is_generate_hashtag: createContentPostDto.is_generate_hashtag,
          number_of_content: createContentPostDto.number_of_content,
          language: createContentPostDto.language,
          tone_of_content: createContentPostDto.tone_of_content,
          length_of_content: createContentPostDto.length_of_content,
          isHaveIcon: createContentPostDto.isHaveIcon,
        });

      return content;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  async findAll(): Promise<ResponsePostDto[]> {
    try {
      const cachedPosts = await this.cacheService.get<ResponsePostDto[]>(
        POST_CACHE.ALL,
      );
      if (cachedPosts) {
        return cachedPosts;
      }
      const posts = await this.postRepository.find({
        relations: [
          'brand',
          'category',
          'socialAccount',
          'postSocialAccounts',
          'postSocialAccounts.socialAccount',
        ],
      });
      const result = plainToInstance(ResponsePostDto, posts);

      await this.cacheService.set<ResponsePostDto[]>(
        POST_CACHE.ALL,
        result,
        TTL_CACHE.POST,
      );

      return result;
    } catch (error) {
      console.error('Error finding all posts:', error);
      throw error;
    }
  }

  async findAllByUserId(user_id: string): Promise<ResponsePostDto[]> {
    try {
      const cachedPosts = await this.cacheService.get<ResponsePostDto[]>(
        POST_CACHE.BY_USER_ID(user_id),
      );
      if (cachedPosts) {
        return cachedPosts;
      }
      const posts = await this.postRepository.find({
        relations: [
          'brand',
          'category',
          'socialAccount',
          'postSocialAccounts',
          'postSocialAccounts.socialAccount',
        ],
        where: {
          user_id,
        },
        order: {
          createdAt: 'DESC',
        },
      });
      const result = plainToInstance(ResponsePostDto, posts);

      await this.cacheService.set<ResponsePostDto[]>(
        POST_CACHE.BY_USER_ID(user_id),
        result,
        TTL_CACHE.POST,
      );

      return result;
    } catch (error) {
      console.error('Error finding posts by user id:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ResponsePostDto | null> {
    try {
      const cachedPost = await this.cacheService.get<ResponsePostDto>(
        POST_CACHE.ONE(id),
      );
      if (cachedPost) {
        return cachedPost;
      }
      const post = await this.postRepository.findOne({
        relations: [
          'brand',
          'category',
          'socialAccount',
          'postSocialAccounts',
          'postSocialAccounts.socialAccount',
        ],
        where: {
          id,
        },
      });

      const result = plainToInstance(ResponsePostDto, post);

      await this.cacheService.set<ResponsePostDto>(
        POST_CACHE.ONE(id),
        result,
        TTL_CACHE.POST,
      );

      return result;
    } catch (error) {
      console.error('Error finding post:', error);
      throw error;
    }
  }

  async update(
    id: string,
    user_id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<void> {
    try {
      const post = await this.postRepository.findOne({
        where: {
          id,
          user_id,
          delete_at: IsNull(),
        },
        relations: ['postSocialAccounts', 'postSocialAccounts.socialAccount'],
      });

      if (!post) {
        throw new ValidationException(
          ErrorCode.P001,
          'Post not found or access denied',
        );
      }

      // Check if post has multiple platforms - không cho phép edit bài đa nền tảng
      if (post.postSocialAccounts && post.postSocialAccounts.length > 1) {
        throw new ValidationException(
          ErrorCode.P001,
          'Cannot edit multi-platform posts. Please delete and create a new post instead.',
        );
      }

      // Check if post is Instagram - không cho phép edit bài Instagram
      if (post.postSocialAccounts && post.postSocialAccounts.length > 0) {
        const hasInstagram = post.postSocialAccounts.some(
          (psa) =>
            psa.socialAccount?.platform === SocialAccountPlatform.INSTAGRAM,
        );
        if (hasInstagram) {
          throw new ValidationException(
            ErrorCode.P001,
            'Cannot edit Instagram posts. Instagram API does not support post editing.',
          );
        }
      }

      const updateData: UpdatePostDto = { ...updatePostDto };
      if (updatePostDto.date_post) {
        updateData.date_post = new Date(updatePostDto.date_post);
      }

      await this.postRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      // Get updated post to check post_now status
      const updatedPost = await this.postRepository.findOne({
        where: { id },
        relations: ['postSocialAccounts', 'postSocialAccounts.socialAccount'],
      });

      // Emit notification for post update
      this.eventEmitter.emit(POST_EVENTS.UPDATED, {
        post_id: id,
        user_id: user_id,
      });

      if (!post.postSocialAccounts || post.postSocialAccounts.length === 0) {
        return;
      }

      if (updateData.status === PostStatus.SCHEDULED) {
        for (const psa of post.postSocialAccounts) {
          this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.SCHEDULE_POST, {
            postSocialAccount: psa,
          });
        }
      } else if (updateData.status === PostStatus.DRAFT) {
        for (const psa of post.postSocialAccounts) {
          this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.REMOVE_POST, {
            postSocialAccount: psa,
          });
        }
      }

      if (
        post.status === PostStatus.PUBLISHED &&
        updatedPost?.postSocialAccounts
      ) {
        for (const psa of updatedPost.postSocialAccounts) {
          if (psa.platform_post_id && psa.status === PostStatus.PUBLISHED) {
            this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.UPDATE_POST, {
              postSocialAccount: psa,
              updatedPost,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: PostStatus): Promise<void> {
    try {
      const post = await this.postRepository.findOne({
        where: { id, delete_at: IsNull() },
      });
      if (!post) {
        throw new ValidationException(
          ErrorCode.P001,
          'Post not found or access denied',
        );
      }
      await this.postRepository.update(id, { status, updatedAt: new Date() });

      this.eventEmitter.emit(POST_EVENTS.UPDATED, {
        post_id: id,
        user_id: post.user_id,
      });

      // check post have social account
      if (!post.social_account_id) return;

      if (status === PostStatus.SCHEDULED) {
        this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.SCHEDULE_POST, {
          post,
        });
      } else if (status === PostStatus.DRAFT) {
        this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.REMOVE_POST, { post });
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      throw error;
    }
  }

  async updateFacebookPostId(
    id: string,
    facebook_post_id: string,
  ): Promise<void> {
    try {
      const post = await this.postRepository.findOne({
        where: { id },
      });

      if (!post) {
        throw new ValidationException(ErrorCode.P001, 'Post not found');
      }
      await this.postRepository.update(id, {
        facebook_post_id,
        updatedAt: new Date(),
      });

      this.eventEmitter.emit(POST_EVENTS.UPDATED, {
        post_id: id,
        user_id: post.user_id,
      });
    } catch (error) {
      console.error('Error updating facebook post id:', error);
      throw error;
    }
  }

  async remove(id: string, user_id: string): Promise<void> {
    try {
      const post = await this.postRepository.findOne({
        where: {
          id,
          user_id,
        },
        relations: ['postSocialAccounts', 'postSocialAccounts.socialAccount'],
      });

      if (!post) {
        throw new ValidationException(
          ErrorCode.P001,
          'Post not found or access denied',
        );
      }

      if (post.postSocialAccounts && post.postSocialAccounts.length > 0) {
        for (const psa of post.postSocialAccounts) {
          if (psa.platform_post_id && psa.status === PostStatus.PUBLISHED) {
            this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.REMOVE_POST, {
              postSocialAccount: psa,
              userId: user_id,
            });
          }
        }
      }

      await this.postRepository.delete(id);

      this.eventEmitter.emit(POST_EVENTS.DELETED, {
        post_id: id,
        user_id: user_id,
      });
    } catch (error) {
      console.error('Error removing post:', error);
      throw error;
    }
  }

  async removeFromPlatform(
    postId: string,
    postSocialAccountId: string,
    user_id: string,
  ): Promise<void> {
    try {
      const post = await this.postRepository.findOne({
        where: {
          id: postId,
          user_id,
        },
        relations: ['postSocialAccounts', 'postSocialAccounts.socialAccount'],
      });

      if (!post) {
        throw new ValidationException(
          ErrorCode.P001,
          'Post not found or access denied',
        );
      }

      const postSocialAccount = post.postSocialAccounts?.find(
        (psa) => psa.id === postSocialAccountId,
      );

      if (!postSocialAccount) {
        throw new ValidationException(
          ErrorCode.P001,
          'Platform post not found',
        );
      }

      if (
        postSocialAccount.platform_post_id &&
        postSocialAccount.status === PostStatus.PUBLISHED
      ) {
        const socialAccount =
          await this.socialAccountsService.findPageByPageIdAndUserIdWithAccessToken(
            postSocialAccount.social_account_id,
            user_id,
          );

        if (!socialAccount) {
          throw new ValidationException(
            ErrorCode.P001,
            'Social account not found',
          );
        }

        if (socialAccount.platform === SocialAccountPlatform.FACEBOOK) {
          await this.facebookService.deletePostOnFacebook(
            postSocialAccount.platform_post_id,
            socialAccount.access_token,
          );
        } else if (socialAccount.platform === SocialAccountPlatform.INSTAGRAM) {
          throw new ValidationException(
            ErrorCode.P001,
            'Instagram post deletion is not supported. Please delete manually on Instagram app.',
          );
        }

        this.eventEmitter.emit(PUBLIC_POST_SOCIAL_EVENTS.REMOVE_POST, {
          postSocialAccount,
          userId: user_id,
        });
      }

      await this.postSocialAccountRepository.delete(postSocialAccountId);

      const remainingPlatforms = await this.postSocialAccountRepository.count({
        where: { post_id: postId },
      });

      if (remainingPlatforms === 0) {
        await this.postRepository.delete(postId);
        this.eventEmitter.emit(POST_EVENTS.DELETED, { user_id });
      }
    } catch (error) {
      console.error('Error removing post from platform:', error);
      throw error;
    }
  }

  async getAdminPosts(filters: GetAdminPostsDto): Promise<{
    posts: AdminPostDto[];
    total: number;
  }> {
    const { page = 1, limit = 10, search, status } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('users', 'user', 'user.id = post.user_id')
      .leftJoin('categories', 'category', 'category.id = post.category_id')
      .select([
        'post.id',
        'post.content',
        'post.status',
        'post.createdAt',
        'post.updatedAt',
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'category.id',
        'category.name',
      ])
      .where('post.delete_at IS NULL');

    if (search) {
      queryBuilder.andWhere('post.content ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const rawPosts = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    const posts = rawPosts.map((raw) => ({
      id: raw.post_id,
      title: raw.post_content?.substring(0, 100) + '...' || 'No content',
      content: raw.post_content,
      status: raw.post_status,
      author: {
        id: raw.user_id,
        email: raw.user_email,
        firstName: raw.user_firstName,
        lastName: raw.user_lastName,
      },
      category: {
        id: raw.category_id,
        name: raw.category_name,
      },
      createdAt: raw.post_createdAt,
      updatedAt: raw.post_updatedAt,
    }));

    return { posts, total };
  }

  async deleteAdminPost(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new ValidationException(ErrorCode.P001, 'Post not found');
    }

    await this.postRepository.update(postId, {
      delete_at: new Date(),
    });
  }

  async getDeletedPosts(filters: GetAdminPostsDto): Promise<{
    posts: AdminPostDto[];
    total: number;
  }> {
    const { page = 1, limit = 10, search } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('users', 'user', 'user.id = post.user_id')
      .leftJoin('categories', 'category', 'category.id = post.category_id')
      .select([
        'post.id',
        'post.content',
        'post.status',
        'post.createdAt',
        'post.updatedAt',
        'post.delete_at',
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'category.id',
        'category.name',
      ])
      .where('post.delete_at IS NOT NULL');

    if (search) {
      queryBuilder.andWhere('post.content ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const rawPosts = await queryBuilder
      .orderBy('post.delete_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawMany();

    const posts = rawPosts.map((raw) => ({
      id: raw.post_id,
      title: raw.post_content?.substring(0, 100) + '...' || 'No content',
      content: raw.post_content,
      status: raw.post_status,
      author: {
        id: raw.user_id,
        email: raw.user_email,
        firstName: raw.user_firstName,
        lastName: raw.user_lastName,
      },
      category: {
        id: raw.category_id,
        name: raw.category_name,
      },
      createdAt: raw.post_createdAt,
      updatedAt: raw.post_updatedAt,
    }));

    return { posts, total };
  }

  async restorePost(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new ValidationException(ErrorCode.P001, 'Post not found');
    }

    await this.postRepository.update(postId, {
      delete_at: null as any,
    });
  }
}
