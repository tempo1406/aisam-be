import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { SocialAccountService } from '@modules/social/social-account.service';
import { GetFacebookStatisticsDto } from './dto/get-facebook-statistics.dto';
import { GetInstagramStatisticsDto } from './dto/get-instagram-statistics.dto';
import {
  FacebookStatisticsResponseDto,
  FacebookPostStatisticsDto,
} from './dto/facebook-statistics-response.dto';
import {
  InstagramStatisticsResponseDto,
  InstagramMediaStatisticsDto,
} from './dto/instagram-statistics-response.dto';
import { StatisticsSnapshot } from './entities/statistics-snapshot.entity';
import { ErrorCode } from '@constants/error-code.constant';
import { ValidationException } from '@exceptions/validation.exception';

interface PostSnapshot {
  postId: string;
  message: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
}

@Injectable()
export class StatisticsService {
  private readonly graphUrl = 'https://graph.facebook.com/v23.0';
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly socialAccountService: SocialAccountService,
    @InjectRepository(StatisticsSnapshot)
    private readonly snapshotRepository: Repository<StatisticsSnapshot>,
  ) {}

  async getFacebookStatistics(
    userId: string,
    dto: GetFacebookStatisticsDto,
  ): Promise<FacebookStatisticsResponseDto> {
    // Get social account with access token
    const socialAccount =
      await this.socialAccountService.findPageByPageIdAndUserIdWithAccessToken(
        dto.social_account_id,
        userId,
      );

    if (!socialAccount) {
      throw new NotFoundException('Social account not found');
    }

    // Set date range (default last 30 days)
    const endDate = dto.end_date ? new Date(dto.end_date) : new Date();
    const startDate = dto.start_date
      ? new Date(dto.start_date)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Fetch posts from Facebook
      const postsUrl = `${this.graphUrl}/${socialAccount.page_id}/feed`;
      const postsResponse = await firstValueFrom(
        this.httpService.get(postsUrl, {
          params: {
            access_token: socialAccount.access_token,
            fields:
              'id,message,created_time,likes.summary(true),comments.summary(true),shares',
            since: Math.floor(startDate.getTime() / 1000),
            until: Math.floor(endDate.getTime() / 1000),
            limit: 100,
          },
        }),
      );

      if (postsResponse.data.error) {
        throw new ValidationException(ErrorCode.FB001);
      }

      const posts = postsResponse.data.data || [];

      // Calculate statistics
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;

      const postStatistics: FacebookPostStatisticsDto[] = posts.map(
        (post: any) => {
          const likes = post.likes?.summary?.total_count || 0;
          const comments = post.comments?.summary?.total_count || 0;
          const shares = post.shares?.count || 0;

          totalLikes += likes;
          totalComments += comments;
          totalShares += shares;

          return {
            post_id: post.id,
            message: post.message || '(No message)',
            created_time: post.created_time,
            likes,
            comments,
            shares,
          };
        },
      );

      // Calculate engagement rate
      const totalEngagements = totalLikes + totalComments + totalShares;
      const engagementRate =
        posts.length > 0
          ? (totalEngagements /
              (posts.length * (socialAccount.followers_count || 1))) *
            100
          : 0;

      return {
        social_account_id: socialAccount.id,
        page_name: socialAccount.page_name,
        total_posts: posts.length,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_shares: totalShares,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        posts: postStatistics,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      if (error.response?.data?.error?.code === 190) {
        throw new ValidationException(ErrorCode.FB008);
      }
      console.error('Error fetching Facebook statistics:', error);
      throw error;
    }
  }

  async saveSnapshot(
    socialAccountId: string,
    snapshotDate: Date,
    posts: PostSnapshot[],
  ): Promise<void> {
    try {
      await this.snapshotRepository.delete({
        socialAccountId,
        snapshotDate,
      });

      if (posts.length === 0) {
        return;
      }

      const snapshots = posts.map((post) => {
        const snapshot = new StatisticsSnapshot();
        snapshot.socialAccountId = socialAccountId;
        snapshot.postId = post.postId;
        snapshot.snapshotDate = snapshotDate;
        snapshot.likes = post.likes;
        snapshot.comments = post.comments;
        snapshot.shares = post.shares;
        snapshot.message = post.message;
        snapshot.postCreatedAt = post.createdAt;
        return snapshot;
      });

      await this.snapshotRepository.insert(snapshots);
    } catch (error) {
      this.logger.error(`Failed to save snapshots: ${error.message}`);
      throw error;
    }
  }

  async calculateDelta(
    socialAccountId: string,
    currentDate: Date,
    previousDate: Date,
  ): Promise<{
    newPosts: number;
    newLikes: number;
    newComments: number;
    newShares: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    topPosts: Array<{
      postId: string;
      message: string;
      likesGained: number;
      commentsGained: number;
      sharesGained: number;
    }>;
  }> {
    try {
      const currentSnapshots = await this.snapshotRepository.find({
        where: { socialAccountId, snapshotDate: currentDate },
      });

      const previousSnapshots = await this.snapshotRepository.find({
        where: { socialAccountId, snapshotDate: previousDate },
      });

      const previousMap = new Map(previousSnapshots.map((s) => [s.postId, s]));

      let newPosts = 0;
      let newLikes = 0;
      let newComments = 0;
      let newShares = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;

      const postDeltas: Array<{
        postId: string;
        message: string;
        likesGained: number;
        commentsGained: number;
        sharesGained: number;
        totalEngagement: number;
      }> = [];

      for (const current of currentSnapshots) {
        totalLikes += current.likes;
        totalComments += current.comments;
        totalShares += current.shares;

        const previous = previousMap.get(current.postId);

        if (!previous) {
          newPosts++;
          newLikes += current.likes;
          newComments += current.comments;
          newShares += current.shares;

          postDeltas.push({
            postId: current.postId,
            message: current.message || '(No message)',
            likesGained: current.likes,
            commentsGained: current.comments,
            sharesGained: current.shares,
            totalEngagement: current.likes + current.comments + current.shares,
          });
        } else {
          const likesGained = Math.max(0, current.likes - previous.likes);
          const commentsGained = Math.max(
            0,
            current.comments - previous.comments,
          );
          const sharesGained = Math.max(0, current.shares - previous.shares);

          newLikes += likesGained;
          newComments += commentsGained;
          newShares += sharesGained;

          if (likesGained > 0 || commentsGained > 0 || sharesGained > 0) {
            postDeltas.push({
              postId: current.postId,
              message: current.message || '(No message)',
              likesGained,
              commentsGained,
              sharesGained,
              totalEngagement: likesGained + commentsGained + sharesGained,
            });
          }
        }
      }

      const topPosts = postDeltas
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 5)
        .map(({ totalEngagement, ...rest }) => rest);

      return {
        newPosts,
        newLikes,
        newComments,
        newShares,
        totalPosts: currentSnapshots.length,
        totalLikes,
        totalComments,
        totalShares,
        topPosts,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate delta: ${error.message}`);
      throw error;
    }
  }

  async cleanupOldSnapshots(daysToKeep: number = 60): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.snapshotRepository
        .createQueryBuilder()
        .delete()
        .where('snapshot_date < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old snapshots`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old snapshots: ${error.message}`);
    }
  }

  async getInstagramStatistics(
    userId: string,
    dto: GetInstagramStatisticsDto,
  ): Promise<InstagramStatisticsResponseDto> {
    const socialAccount =
      await this.socialAccountService.findPageByPageIdAndUserIdWithAccessToken(
        dto.social_account_id,
        userId,
      );

    if (!socialAccount) {
      throw new NotFoundException('Social account not found');
    }

    const endDate = dto.end_date ? new Date(dto.end_date) : new Date();
    const startDate = dto.start_date
      ? new Date(dto.start_date)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const mediaUrl = `${this.graphUrl}/${socialAccount.page_id}/media`;
      const mediaResponse = await firstValueFrom(
        this.httpService.get(mediaUrl, {
          params: {
            access_token: socialAccount.access_token,
            fields:
              'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
            since: Math.floor(startDate.getTime() / 1000),
            until: Math.floor(endDate.getTime() / 1000),
            limit: 100,
          },
        }),
      );

      if (mediaResponse.data.error) {
        throw new ValidationException(ErrorCode.IG001);
      }

      const mediaList = mediaResponse.data.data || [];

      let totalLikes = 0;
      let totalComments = 0;
      let totalImpressions = 0;
      let totalReach = 0;
      let totalSaved = 0;

      const mediaStatistics: InstagramMediaStatisticsDto[] = [];

      for (const media of mediaList) {
        const likes = media.like_count || 0;
        const comments = media.comments_count || 0;

        totalLikes += likes;
        totalComments += comments;

        let impressions = 0;
        let reach = 0;
        let saved = 0;

        try {
          const insightsUrl = `${this.graphUrl}/${media.id}/insights`;
          const insightsResponse = await firstValueFrom(
            this.httpService.get(insightsUrl, {
              params: {
                access_token: socialAccount.access_token,
                metric: 'impressions,reach,saved',
              },
            }),
          );

          if (insightsResponse.data && insightsResponse.data.data) {
            insightsResponse.data.data.forEach((insight: any) => {
              if (insight.name === 'impressions') {
                impressions = insight.values[0]?.value || 0;
                totalImpressions += impressions;
              } else if (insight.name === 'reach') {
                reach = insight.values[0]?.value || 0;
                totalReach += reach;
              } else if (insight.name === 'saved') {
                saved = insight.values[0]?.value || 0;
                totalSaved += saved;
              }
            });
          }
        } catch (insightError) {
          this.logger.warn(`Could not fetch insights for media ${media.id}`);
        }

        mediaStatistics.push({
          media_id: media.id,
          caption: media.caption || '',
          media_type: media.media_type,
          media_url: media.media_url || '',
          permalink: media.permalink,
          timestamp: media.timestamp,
          like_count: likes,
          comments_count: comments,
          impressions,
          reach,
          saved,
        });
      }

      const totalEngagements = totalLikes + totalComments;
      const engagementRate =
        mediaList.length > 0 && socialAccount.followers_count
          ? (totalEngagements /
              (mediaList.length * socialAccount.followers_count)) *
            100
          : 0;

      return {
        social_account_id: socialAccount.id,
        username: socialAccount.page_name,
        total_media: mediaList.length,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_impressions: totalImpressions > 0 ? totalImpressions : undefined,
        total_reach: totalReach > 0 ? totalReach : undefined,
        total_saved: totalSaved > 0 ? totalSaved : undefined,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        followers_count: socialAccount.followers_count || 0,
        follows_count: socialAccount.follows_count || 0,
        media: mediaStatistics,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    } catch (error) {
      if (error.response?.data?.error?.code === 190) {
        throw new ValidationException(ErrorCode.IG003);
      }
      console.error('Error fetching Instagram statistics:', error);
      throw error;
    }
  }
}
