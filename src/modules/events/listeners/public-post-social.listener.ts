import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PUBLIC_POST_SOCIAL_EVENTS } from '../constants/public-post-social.constant';
import { PostSocialQueueService } from '@modules/bull/queues/post-facebook-social/post-social.queue.service';
import { Post } from '@modules/post/entities/post.entity';
import { PostSocialAccount } from '@modules/post/entities/post-social-account.entity';
import { SocialAccountService } from '@modules/social/social-account.service';
import { FacebookService } from '@modules/socials-connect/facebook/facebook.service';

@Injectable()
export class PublicPostSocialListener {
  private readonly logger = new Logger(PublicPostSocialListener.name);

  constructor(
    private readonly postSocialQueueService: PostSocialQueueService,
    private readonly socialAccountService: SocialAccountService,
    private readonly facebookService: FacebookService,
  ) {}

  @OnEvent(PUBLIC_POST_SOCIAL_EVENTS.PUBLISH_POST)
  async handlePublishPost(payload: { postSocialAccount: PostSocialAccount }) {
    this.logger.log(
      `Received PUBLISH_POST event for PostSocialAccount ${payload.postSocialAccount.id}`,
    );
    await this.postSocialQueueService.addPostSocialAccountToQueue(
      payload.postSocialAccount,
    );
  }

  @OnEvent(PUBLIC_POST_SOCIAL_EVENTS.SCHEDULE_POST)
  async handleSchedulePost(payload: { postSocialAccount: PostSocialAccount }) {
    this.logger.log(
      `Received SCHEDULE_POST event for PostSocialAccount ${payload.postSocialAccount.id}`,
    );
    await this.postSocialQueueService.addPostSocialAccountToQueue(
      payload.postSocialAccount,
    );
  }

  @OnEvent(PUBLIC_POST_SOCIAL_EVENTS.REMOVE_POST)
  async handleRemovePost(payload: {
    postSocialAccount: PostSocialAccount;
    userId: string;
  }) {
    try {
      const { postSocialAccount, userId } = payload;

      await this.postSocialQueueService.removePostFromQueue(
        postSocialAccount.post_id,
      );

      if (!postSocialAccount.platform_post_id) {
        return;
      }

      const socialAccount =
        await this.socialAccountService.findPageByPageIdAndUserIdWithAccessToken(
          postSocialAccount.social_account_id,
          userId,
        );

      if (!socialAccount) {
        return;
      }

      if (socialAccount.platform === 'facebook') {
        await this.facebookService.deletePostOnFacebook(
          postSocialAccount.platform_post_id,
          socialAccount.access_token,
        );
      }
    } catch (error) {
    }
  }

  @OnEvent(PUBLIC_POST_SOCIAL_EVENTS.UPDATE_POST)
  async handleUpdatePost(payload: {
    postSocialAccount: PostSocialAccount;
    updatedPost: Post;
  }) {
    try {
      const { postSocialAccount, updatedPost } = payload;

      if (!postSocialAccount.platform_post_id) {
        return;
      }

      const socialAccount =
        await this.socialAccountService.findPageByPageIdAndUserIdWithAccessToken(
          postSocialAccount.social_account_id,
          updatedPost.user_id,
        );

      if (!socialAccount) {
        return;
      }

      if (socialAccount.platform === 'facebook') {
        await this.facebookService.updatePostOnFacebook(
          postSocialAccount.platform_post_id,
          updatedPost.content,
          socialAccount.access_token,
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
