import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StatisticsService } from '@modules/statistics/statistics.service';
import { UsersService } from '@modules/users/users.service';
import { SocialAccountService } from '@modules/social/social-account.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { MaillerService } from '@modules/mail/mail.service';
import { NotificationType } from 'src/enums/notification.enum';
import { QUEUE_NAME } from '@modules/bull/constants/queue.constant';

@Processor(QUEUE_NAME.STATISTICS_REPORT)
export class StatisticsReportQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(StatisticsReportQueueProcessor.name);

  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly usersService: UsersService,
    private readonly socialAccountService: SocialAccountService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MaillerService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing statistics report job ${job.id}`);

    try {
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      const users = await this.usersService.findAll();
      this.logger.log(`Found ${users.length} users to process`);

      for (const user of users) {
        try {
          const socialAccounts = await this.socialAccountService.findMySocialAccounts(user.id);
          
          if (!socialAccounts || socialAccounts.length === 0) {
            continue;
          }

          let totalNewLikes = 0;
          let totalNewComments = 0;
          let totalNewShares = 0;
          let totalNewPosts = 0;
          const accountDetails: Array<{
            page: string;
            posts: number;
            likes: number;
            comments: number;
            shares: number;
            engagement_rate: number;
          }> = [];

          for (const account of socialAccounts) {
            try {
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              
              const stats = await this.statisticsService.getFacebookStatistics(user.id, {
                social_account_id: account.id,
                start_date: thirtyDaysAgo.toISOString().split('T')[0],
                end_date: today.toISOString().split('T')[0],
              });

              const postsForSnapshot = stats.posts.map(post => ({
                postId: post.post_id,
                message: post.message,
                likes: post.likes,
                comments: post.comments,
                shares: post.shares,
                createdAt: new Date(post.created_time),
              }));

              await this.statisticsService.saveSnapshot(
                account.id,
                todayDate,
                postsForSnapshot,
              );

              const delta = await this.statisticsService.calculateDelta(
                account.id,
                todayDate,
                yesterdayDate,
              );

              totalNewLikes += delta.newLikes;
              totalNewComments += delta.newComments;
              totalNewShares += delta.newShares;
              totalNewPosts += delta.newPosts;

              accountDetails.push({
                page: stats.page_name,
                posts: delta.newPosts,
                likes: delta.newLikes,
                comments: delta.newComments,
                shares: delta.newShares,
                engagement_rate: stats.engagement_rate,
              });
            } catch (e) {
              this.logger.error(`Failed to process account ${account.id}: ${e.message}`);
            }
          }

          if (totalNewPosts === 0 && totalNewLikes === 0 && totalNewComments === 0 && totalNewShares === 0) {
            continue;
          }

          const dateStr = today.toLocaleDateString('vi-VN');
          
          await this.notificationsService.createSystemNotification(
            user.id,
            `Báo cáo thống kê ${dateStr}`,
            `Hôm nay: +${totalNewPosts} bài, +${totalNewLikes} thích, +${totalNewComments} bình luận`,
            NotificationType.SYSTEM,
            '/statistics',
            { date: today.toISOString(), details: accountDetails },
          );

          try {
            await this.mailService.sendStatisticsEmail({
              email: user.email,
              username: user.firstName || user.email,
              date: dateStr,
              statistics: accountDetails,
            });
          } catch (e) {
            this.logger.error(`Failed to send email to ${user.email}: ${e.message}`);
          }
        } catch (e) {
          this.logger.error(`Failed to process user ${user.id}: ${e.message}`);
        }
      }

      await this.statisticsService.cleanupOldSnapshots(60);

      this.logger.log('Statistics report job completed');
    } catch (error) {
      this.logger.error(`Job failed: ${error.message}`);
      throw error;
    }
  }
}
