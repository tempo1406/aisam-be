import { QUEUE_NAME } from '@modules/bull/constants/queue.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PostService } from '@modules/post/post.service';
import { SocialAccountService } from '@modules/social/social-account.service';
import { FacebookService } from '@modules/socials-connect/facebook/facebook.service';
import { InstagramService } from '@modules/socials-connect/instagram/instagram.service';
import { PostStatus } from 'src/enums/post.enum';
import { SubscriptionsService } from '@modules/subscriptions/subscriptions.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostSocialAccount } from '@modules/post/entities/post-social-account.entity';
import { SocialAccountPlatform } from 'src/enums/social.enum';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';

@Processor(QUEUE_NAME.PUBLISH_POST)
export class PostSocialQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(PostSocialQueueProcessor.name);
  constructor(
    @InjectRepository(PostSocialAccount)
    private readonly postSocialAccountRepo: Repository<PostSocialAccount>,
    private readonly postService: PostService,
    private readonly socialAccountService: SocialAccountService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      // Load PostSocialAccount with relations
      const postSocialAccount = await this.postSocialAccountRepo.findOne({
        where: { id: job.data.postSocialAccountId },
        relations: ['post', 'socialAccount'],
      });

      if (!postSocialAccount) {
        this.logger.warn(
          `PostSocialAccount ${job.data.postSocialAccountId} not found`,
        );
        return;
      }

      const { post, socialAccount } = postSocialAccount;

      // Get social account with access token
      const socialAccountWithToken =
        await this.socialAccountService.findPageByPageIdAndUserIdWithAccessToken(
          socialAccount.id,
          post.user_id,
        );

      let platformPostId: string;

      // Check platform and call appropriate service
      if (socialAccount.platform === SocialAccountPlatform.FACEBOOK) {
        this.logger.log(`Publishing to Facebook: ${socialAccount.page_name}`);

        const response = await this.facebookService.publishPostPhotos({
          page_id: socialAccountWithToken.page_id,
          access_token: socialAccountWithToken.access_token,
          caption: post.content,
          imageUrls: post.image,
        });

        platformPostId = response.id;
      } else if (socialAccount.platform === SocialAccountPlatform.INSTAGRAM) {
        this.logger.log(`Publishing to Instagram: ${socialAccount.page_name}`);

        // Instagram requires at least one image
        if (!post.image || post.image.length === 0) {
          throw new Error('Instagram requires at least one image');
        }

        let response: any;

        if (post.image.length === 1) {
          // Single image post
          this.logger.log('Publishing single image to Instagram');
          response = await this.instagramService.publishPost({
            instagram_account_id: socialAccountWithToken.page_id,
            access_token: socialAccountWithToken.access_token,
            image_url: post.image[0],
            caption: post.content || '',
          });
        } else {
          this.logger.log(
            `Publishing carousel with ${post.image.length} images to Instagram`,
          );
          response = await this.instagramService.publishCarousel(
            socialAccountWithToken.page_id,
            socialAccountWithToken.access_token,
            post.image.slice(0, 10),
            post.content || '',
          );
        }

        platformPostId = response.id;
      } else {
        throw new ValidationException(
          ErrorCode.P005,
          `Unsupported platform: ${SocialAccountPlatform[socialAccount.platform] as string}`,
        );
      }

      // Update PostSocialAccount status
      postSocialAccount.status = PostStatus.PUBLISHED;
      postSocialAccount.platform_post_id = platformPostId;
      postSocialAccount.published_at = new Date();
      await this.postSocialAccountRepo.save(postSocialAccount);

      this.logger.log(
        `Published to ${socialAccountWithToken.platform}: ${platformPostId}`,
      );

      // Check if all platforms published, then update main Post status
      const allPostSocialAccounts = await this.postSocialAccountRepo.find({
        where: { post_id: post.id },
      });

      const allPublished = allPostSocialAccounts.every(
        (psa) => psa.status === PostStatus.PUBLISHED,
      );

      if (allPublished) {
        await this.postService.updateStatus(post.id, PostStatus.PUBLISHED);
        this.logger.log(`All platforms published for post ${post.id}`);
      }

      // Increment usage count (once per platform)
      const usageIncremented = await this.subscriptionsService.incrementUsage(
        post.user_id,
      );

      if (!usageIncremented) {
        this.logger.warn(
          `Failed to increment usage for user ${post.user_id} - no active subscription or limit exceeded`,
        );
      } else {
        this.logger.log(
          `Usage incremented successfully for user ${post.user_id}`,
        );
      }
    } catch (error) {
      this.logger.error('Error processing job:', error);

      // Update PostSocialAccount with error
      if (job.data.postSocialAccountId) {
        try {
          const postSocialAccount = await this.postSocialAccountRepo.findOne({
            where: { id: job.data.postSocialAccountId },
          });

          if (postSocialAccount) {
            postSocialAccount.status = PostStatus.ARCHIVED; // Mark as failed
            postSocialAccount.error_message = error.message;
            postSocialAccount.retry_count += 1;
            await this.postSocialAccountRepo.save(postSocialAccount);
          }
        } catch (updateError) {
          this.logger.error('Error updating PostSocialAccount:', updateError);
        }
      }

      throw error;
    }
  }
}
