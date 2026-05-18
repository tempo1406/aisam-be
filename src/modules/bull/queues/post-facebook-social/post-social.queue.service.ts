import { QUEUE_NAME } from '@modules/bull/constants/queue.constant';
import { PostSocialAccount } from '@modules/post/entities/post-social-account.entity';
import { PostService } from '@modules/post/post.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import * as dayjs from 'dayjs';
import { PostStatus } from 'src/enums/post.enum';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
@Injectable()
export class PostSocialQueueService implements OnModuleInit {
  private readonly logger = new Logger(PostSocialQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAME.PUBLISH_POST)
    private readonly postQueue: Queue,
    @InjectRepository(PostSocialAccount)
    private readonly postSocialAccountRepo: Repository<PostSocialAccount>,
    private readonly postService: PostService,
  ) {}

  async onModuleInit() {
    this.logger.log('PostSocialQueueService initialized');
    await this.initializeQueue();
  }

  private async initializeQueue() {
    try {
      await this.addAllPostToQueue();
    } catch (error) {
      this.logger.error('Error initializing queue:', error);
      throw error;
    }
  }

  async addAllPostToQueue() {
    try {
      // Load all scheduled PostSocialAccounts
      const postSocialAccounts = await this.postSocialAccountRepo.find({
        where: { status: PostStatus.SCHEDULED },
        relations: ['post'],
      });

      this.logger.log(
        `Found ${postSocialAccounts.length} scheduled PostSocialAccounts`,
      );

      for (const psa of postSocialAccounts) {
        await this.addPostSocialAccountToQueue(psa);
      }
    } catch (error) {
      this.logger.error('Error adding all post to queue:', error);
      throw error;
    }
  }

  async addPostSocialAccountToQueue(psa: PostSocialAccount) {
    try {
      let delay = 0;

      // Calculate delay from scheduled_at
      if (psa.post_now) {
        delay = 0;
      } else {
        if (psa.scheduled_at) {
          const target = dayjs(psa.scheduled_at).tz('Asia/Ho_Chi_Minh');
          const now = dayjs().tz('Asia/Ho_Chi_Minh');
          delay = target.diff(now, 'millisecond');
          if (delay < 0) delay = 0;
        }
      }

      // Remove existing job if any
      await this.removePostSocialAccountFromQueue(psa.id);

      const job = await this.postQueue.add(
        QUEUE_NAME.PUBLISH_POST,
        {
          postSocialAccountId: psa.id,
        },
        {
          delay,
          removeOnComplete: true,
          removeOnFail: 3,
          jobId: psa.id,
        },
      );

      this.logger.log(
        `Job added: id=${job.id}, postSocialAccountId=${psa.id}, delay=${delay}ms`,
      );
    } catch (error) {
      this.logger.error('Error adding PostSocialAccount to queue:', error);
      throw error;
    }
  }

  async removePostSocialAccountFromQueue(postSocialAccountId: string) {
    try {
      const job = await this.postQueue.getJob(postSocialAccountId);

      if (job) {
        await job.remove();
        this.logger.log(`✅ Removed job ${postSocialAccountId}`);
      } else {
        this.logger.warn(`Job ${postSocialAccountId} not found`);
      }
    } catch (error) {
      this.logger.error('Error removing PostSocialAccount from queue:', error);
      throw error;
    }
  }

  /**
   * DEPRECATED: Use removePostSocialAccountFromQueue instead
   */
  async removePostFromQueue(postId: string) {
    try {
      const job = await this.postQueue.getJob(postId);

      if (job) {
        await job.remove();
        this.logger.log(`Removed job ${postId}`);
      } else {
        this.logger.warn(`Job ${postId} not found`);
      }
    } catch (error) {
      this.logger.error('Error removing post from queue:', error);
      throw error;
    }
  }
}
