import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CreatePostPhotosFacebookDto } from './dtos/create-post.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  GetInforPlatformDto,
  GetInforPlatformResponseDto,
} from './dtos/get-infor-platform';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '@constants/error-code.constant';
import { ValidationException } from '@exceptions/validation.exception';
import facebookConfig from '@configs/facebook.config';
import {
  ExchangeTokenResponseDto,
  FacebookPageDto,
} from './dtos/connect-facebook.dto';

@Injectable()
export class FacebookService {
  private readonly graphUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @Inject(facebookConfig.KEY)
    private readonly fbConfig: ConfigType<typeof facebookConfig>,
  ) {
    this.graphUrl = `https://graph.facebook.com/${this.fbConfig.graphApiVersion}`;
  }

  async getPageInfo(
    body: GetInforPlatformDto,
  ): Promise<GetInforPlatformResponseDto> {
    try {
      const url = `${this.graphUrl}/${body.page_id}?fields=id,name,fan_count,followers_count,picture`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { access_token: body.access_token },
        }),
      );

      if (response.data.error) {
        throw new ValidationException(ErrorCode.FB001);
      }

      const userInfo = plainToInstance(GetInforPlatformResponseDto, {
        ...response.data,
        page_image_url: response.data.picture.data.url,
      });

      delete userInfo['picture'];

      return userInfo;
    } catch (error) {
      if (error.response?.data?.error?.code === 190) {
        const subcode = error.response?.data?.error?.error_subcode;
        if (subcode === 463) {
          // Token expired
          throw new ValidationException(ErrorCode.FB007);
        } else {
          // Token invalid/revoked
          throw new ValidationException(ErrorCode.FB008);
        }
      }

      console.error('Error getting page info:', error);
      throw error;
    }
  }

  async publishPostPhotos(body: CreatePostPhotosFacebookDto): Promise<any> {
    try {
      if (body.imageUrls && body.imageUrls.length > 0) {
        // 1. Upload nhiều ảnh
        const uploadedPhotos: { media_fbid: string }[] = [];

        for (const url of body.imageUrls) {
          const uploadRes = await firstValueFrom(
            this.httpService.post(`${this.graphUrl}/${body.page_id}/photos`, {
              url,
              published: false, // chỉ upload, chưa public
              access_token: body.access_token,
            }),
          );
          uploadedPhotos.push({ media_fbid: uploadRes.data.id });
        }

        // 2. Tạo post có nhiều ảnh
        const postRes = await firstValueFrom(
          this.httpService.post(`${this.graphUrl}/${body.page_id}/feed`, {
            message: body.caption,
            attached_media: uploadedPhotos,
            access_token: body.access_token,
          }),
        );

        return postRes.data;
      }

      // Nếu không có imageUrls => chỉ đăng text
      const postRes = await firstValueFrom(
        this.httpService.post(`${this.graphUrl}/${body.page_id}/feed`, {
          message: body.caption,
          access_token: body.access_token,
        }),
      );

      return postRes.data;
    } catch (err) {
      console.error(
        'Error posting photo to Facebook:',
        err.response?.data || err,
      );
      throw err;
    }
  }

  async updatePostOnFacebook(
    facebook_post_id: string,
    message: string,
    access_token: string,
  ): Promise<any> {
    try {
      const updateRes = await firstValueFrom(
        this.httpService.post(`${this.graphUrl}/${facebook_post_id}`, {
          message,
          access_token,
        }),
      );

      return updateRes.data;
    } catch (err) {
      console.error(
        'Error updating post on Facebook:',
        err.response?.data || err,
      );
      throw new ValidationException(ErrorCode.FB003);
    }
  }

  async deletePostOnFacebook(
    facebook_post_id: string,
    access_token: string,
  ): Promise<any> {
    try {
      const deleteRes = await firstValueFrom(
        this.httpService.delete(`${this.graphUrl}/${facebook_post_id}`, {
          params: {
            access_token,
          },
        }),
      );

      return deleteRes.data;
    } catch (err) {
      console.error(
        'Error deleting post on Facebook:',
        err.response?.data || err,
      );
      return { success: false, error: err.response?.data || err.message };
    }
  }

  /**
   * Get post insights/metrics from Facebook
   * Used by Campaign Analytics Sync
   */
  async getPostInsights(
    access_token: string,
    facebook_post_id: string,
  ): Promise<{
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  }> {
    try {
      // Get post details with engagement metrics
      const url = `${this.graphUrl}/${facebook_post_id}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            access_token,
            fields:
              'likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions_unique)',
          },
        }),
      );

      const data = response.data;

      // Extract metrics
      const likes = data.likes?.summary?.total_count || 0;
      const comments = data.comments?.summary?.total_count || 0;
      const shares = data.shares?.count || 0;

      // Get reach from insights (unique impressions)
      let reach = 0;
      if (
        data.insights &&
        data.insights.data &&
        data.insights.data.length > 0
      ) {
        const reachMetric = data.insights.data.find(
          (metric: any) => metric.name === 'post_impressions_unique',
        );
        reach = reachMetric?.values?.[0]?.value || 0;
      }

      return {
        likes,
        comments,
        shares,
        reach,
      };
    } catch (err) {
      console.error(
        'Error getting post insights from Facebook:',
        err.response?.data || err,
      );

      // Return zero metrics if insights not available
      // (e.g., post too new, insights not ready yet)
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
      };
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeToken(
    shortLivedToken: string,
  ): Promise<ExchangeTokenResponseDto> {
    try {
      const url = `${this.graphUrl}/oauth/access_token`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.fbConfig.appId,
            client_secret: this.fbConfig.appSecret,
            fb_exchange_token: shortLivedToken,
          },
        }),
      );

      if (response.data.error) {
        throw new ValidationException(ErrorCode.FB008);
      }

      return plainToInstance(ExchangeTokenResponseDto, response.data);
    } catch (error) {
      console.error('Error exchanging token:', error);
      if (error.response?.data?.error) {
        throw new ValidationException(ErrorCode.FB008);
      }
      throw error;
    }
  }

  /**
   * Get all pages user has access to
   */
  async getUserPages(accessToken: string): Promise<FacebookPageDto[]> {
    try {
      const url = `${this.graphUrl}/me/accounts`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            access_token: accessToken,
            fields: 'id,name,access_token,category,tasks',
          },
        }),
      );

      if (response.data.error) {
        throw new ValidationException(ErrorCode.FB001);
      }

      return response.data.data as FacebookPageDto[];
    } catch (error) {
      console.error('Error getting user pages:', error);
      if (error.response?.data?.error?.code === 190) {
        throw new ValidationException(ErrorCode.FB008);
      }
      throw error;
    }
  }
}
