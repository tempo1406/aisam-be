import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import facebookConfig from '@configs/facebook.config';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import {
  PublishInstagramPostDto,
  PublishInstagramReelDto,
  InstagramMediaResponseDto,
  InstagramInsightsDto,
} from './dtos/publish-instagram.dto';
import { plainToInstance } from 'class-transformer';
import { InstagramAccountDto } from '../facebook/dtos/connect-facebook.dto';

@Injectable()
export class InstagramService {
  private readonly graphUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @Inject(facebookConfig.KEY)
    private readonly fbConfig: ConfigType<typeof facebookConfig>,
  ) {
    this.graphUrl = `https://graph.facebook.com/${this.fbConfig.graphApiVersion}`;
  }

  /**
   * Publish single image post to Instagram
   * Instagram requires 2-step process: Create container → Publish container
   */
  async publishPost(
    dto: PublishInstagramPostDto,
  ): Promise<InstagramMediaResponseDto> {
    try {
      // Step 1: Create media container
      const containerUrl = `${this.graphUrl}/${dto.instagram_account_id}/media`;
      const containerResponse = await firstValueFrom(
        this.httpService.post(containerUrl, {
          image_url: dto.image_url,
          caption: dto.caption,
          access_token: dto.access_token,
        }),
      );

      if (containerResponse.data.error) {
        console.error(
          'Instagram container error:',
          containerResponse.data.error,
        );
        throw new ValidationException(ErrorCode.IG001);
      }

      const containerId = containerResponse.data.id;

      // Step 2: Publish the container
      const publishUrl = `${this.graphUrl}/${dto.instagram_account_id}/media_publish`;
      const publishResponse = await firstValueFrom(
        this.httpService.post(publishUrl, {
          creation_id: containerId,
          access_token: dto.access_token,
        }),
      );

      if (publishResponse.data.error) {
        console.error('Instagram publish error:', publishResponse.data.error);
        throw new ValidationException(ErrorCode.IG002);
      }

      // Step 3: Get media details
      const mediaId = publishResponse.data.id;
      const mediaUrl = `${this.graphUrl}/${mediaId}`;
      const mediaResponse = await firstValueFrom(
        this.httpService.get(mediaUrl, {
          params: {
            fields: 'id,permalink',
            access_token: dto.access_token,
          },
        }),
      );

      return plainToInstance(InstagramMediaResponseDto, {
        id: mediaResponse.data.id,
        status: 'published',
        permalink: mediaResponse.data.permalink,
      });
    } catch (error) {
      console.error('Error publishing to Instagram:', error);
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        console.error('Facebook API Error:', fbError);

        // Handle specific Instagram errors
        if (fbError.code === 190) {
          throw new ValidationException(ErrorCode.IG003); // Invalid token
        } else if (fbError.code === 100) {
          throw new ValidationException(ErrorCode.IG004); // Invalid parameters
        }
      }
      throw error;
    }
  }

  /**
   * Publish carousel (multiple images) to Instagram
   * Instagram supports up to 10 images in a carousel
   */
  async publishCarousel(
    instagram_account_id: string,
    access_token: string,
    image_urls: string[],
    caption?: string,
  ): Promise<InstagramMediaResponseDto> {
    try {
      if (!image_urls || image_urls.length === 0) {
        throw new Error('At least one image is required for carousel');
      }

      if (image_urls.length > 10) {
        throw new Error('Instagram carousel supports maximum 10 images');
      }

      // Step 1: Create item containers for each image
      const itemContainerIds: string[] = [];

      for (const imageUrl of image_urls) {
        const itemContainerUrl = `${this.graphUrl}/${instagram_account_id}/media`;
        const itemResponse = await firstValueFrom(
          this.httpService.post(itemContainerUrl, {
            image_url: imageUrl,
            is_carousel_item: true,
            access_token: access_token,
          }),
        );

        if (itemResponse.data.error) {
          console.error(
            'Instagram carousel item error:',
            itemResponse.data.error,
          );
          throw new ValidationException(ErrorCode.IG001);
        }

        itemContainerIds.push(itemResponse.data.id);
      }

      // Step 2: Create carousel container
      const carouselContainerUrl = `${this.graphUrl}/${instagram_account_id}/media`;
      const carouselResponse = await firstValueFrom(
        this.httpService.post(carouselContainerUrl, {
          media_type: 'CAROUSEL',
          children: itemContainerIds.join(','),
          caption: caption || '',
          access_token: access_token,
        }),
      );

      if (carouselResponse.data.error) {
        console.error(
          'Instagram carousel container error:',
          carouselResponse.data.error,
        );
        throw new ValidationException(ErrorCode.IG001);
      }

      const carouselContainerId = carouselResponse.data.id;

      // Step 3: Publish the carousel
      const publishUrl = `${this.graphUrl}/${instagram_account_id}/media_publish`;
      const publishResponse = await firstValueFrom(
        this.httpService.post(publishUrl, {
          creation_id: carouselContainerId,
          access_token: access_token,
        }),
      );

      if (publishResponse.data.error) {
        console.error(
          'Instagram carousel publish error:',
          publishResponse.data.error,
        );
        throw new ValidationException(ErrorCode.IG002);
      }

      const mediaId = publishResponse.data.id;

      // Step 4: Get media details
      const mediaUrl = `${this.graphUrl}/${mediaId}`;
      const mediaResponse = await firstValueFrom(
        this.httpService.get(mediaUrl, {
          params: {
            fields: 'id,permalink',
            access_token: access_token,
          },
        }),
      );

      return plainToInstance(InstagramMediaResponseDto, {
        id: mediaResponse.data.id,
        status: 'published',
        permalink: mediaResponse.data.permalink,
      });
    } catch (error) {
      console.error('Error publishing carousel to Instagram:', error);
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        console.error('Facebook API Error:', fbError);
      }
      throw error;
    }
  }

  /**
   * Publish reel (video) to Instagram
   */
  async publishReel(
    dto: PublishInstagramReelDto,
  ): Promise<InstagramMediaResponseDto> {
    try {
      // Step 1: Create reel container
      const containerUrl = `${this.graphUrl}/${dto.instagram_account_id}/media`;
      const containerData: any = {
        media_type: 'REELS',
        video_url: dto.video_url,
        access_token: dto.access_token,
      };

      if (dto.caption) {
        containerData.caption = dto.caption;
      }

      if (dto.cover_url) {
        containerData.cover_url = dto.cover_url;
      }

      const containerResponse = await firstValueFrom(
        this.httpService.post(containerUrl, containerData),
      );

      if (containerResponse.data.error) {
        console.error(
          'Instagram reel container error:',
          containerResponse.data.error,
        );
        throw new ValidationException(ErrorCode.IG001);
      }

      const containerId = containerResponse.data.id;

      // Step 2: Wait for video processing (Instagram needs time to process video)
      await this.waitForContainerReady(
        containerId,
        dto.access_token,
        30000, // 30 seconds timeout
      );

      // Step 3: Publish the reel
      const publishUrl = `${this.graphUrl}/${dto.instagram_account_id}/media_publish`;
      const publishResponse = await firstValueFrom(
        this.httpService.post(publishUrl, {
          creation_id: containerId,
          access_token: dto.access_token,
        }),
      );

      if (publishResponse.data.error) {
        console.error(
          'Instagram reel publish error:',
          publishResponse.data.error,
        );
        throw new ValidationException(ErrorCode.IG002);
      }

      const mediaId = publishResponse.data.id;

      return plainToInstance(InstagramMediaResponseDto, {
        id: mediaId,
        status: 'published',
      });
    } catch (error) {
      console.error('Error publishing reel to Instagram:', error);
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        console.error('Facebook API Error:', fbError);
      }
      throw error;
    }
  }

  /**
   * Wait for Instagram container to be ready for publishing
   */
  private async waitForContainerReady(
    containerId: string,
    accessToken: string,
    timeout: number = 30000,
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const statusUrl = `${this.graphUrl}/${containerId}`;
        const statusResponse = await firstValueFrom(
          this.httpService.get(statusUrl, {
            params: {
              fields: 'status_code',
              access_token: accessToken,
            },
          }),
        );

        const statusCode = statusResponse.data.status_code;

        if (statusCode === 'FINISHED') {
          return; // Ready to publish
        } else if (statusCode === 'ERROR') {
          throw new ValidationException(ErrorCode.IG005); // Processing error
        }

        // Wait before next check
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      } catch (error) {
        console.error('Error checking container status:', error);
        throw error;
      }
    }

    throw new ValidationException(ErrorCode.IG006); // Timeout
  }

  /**
   * Get Instagram post insights/metrics
   */
  async getPostInsights(
    mediaId: string,
    accessToken: string,
  ): Promise<InstagramInsightsDto> {
    try {
      const url = `${this.graphUrl}/${mediaId}/insights`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            metric: 'engagement,impressions,reach,saved',
            access_token: accessToken,
          },
        }),
      );

      const insights = response.data.data || [];
      const result: any = {
        likes: 0,
        comments: 0,
        reach: 0,
        impressions: 0,
        saved: 0,
        engagement_rate: 0,
      };

      // Parse insights
      insights.forEach((insight: any) => {
        if (insight.name === 'engagement') {
          result.likes = insight.values[0]?.value || 0;
        } else if (insight.name === 'impressions') {
          result.impressions = insight.values[0]?.value || 0;
        } else if (insight.name === 'reach') {
          result.reach = insight.values[0]?.value || 0;
        } else if (insight.name === 'saved') {
          result.saved = insight.values[0]?.value || 0;
        }
      });

      // Get likes and comments from media object
      const mediaUrl = `${this.graphUrl}/${mediaId}`;
      const mediaResponse = await firstValueFrom(
        this.httpService.get(mediaUrl, {
          params: {
            fields: 'like_count,comments_count',
            access_token: accessToken,
          },
        }),
      );

      result.likes = mediaResponse.data.like_count || 0;
      result.comments = mediaResponse.data.comments_count || 0;

      // Calculate engagement rate
      if (result.reach > 0) {
        result.engagement_rate =
          ((result.likes + result.comments) / result.reach) * 100;
      }

      return plainToInstance(InstagramInsightsDto, result);
    } catch (error) {
      console.error('Error getting Instagram insights:', error);
      // Return zero metrics if insights not available
      return plainToInstance(InstagramInsightsDto, {
        likes: 0,
        comments: 0,
        reach: 0,
        impressions: 0,
        saved: 0,
        engagement_rate: 0,
      });
    }
  }

  /**
   * Get Instagram Business Account linked to Facebook Page
   */
  async getInstagramAccount(
    pageId: string,
    pageAccessToken: string,
  ): Promise<InstagramAccountDto | null> {
    try {
      const url = `${this.graphUrl}/${pageId}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            access_token: pageAccessToken,
            fields: 'instagram_business_account',
          },
        }),
      );

      if (!response.data.instagram_business_account) {
        return null;
      }

      const igAccountId = response.data.instagram_business_account.id;

      // Get Instagram account details
      const igUrl = `${this.graphUrl}/${igAccountId}`;
      const igResponse = await firstValueFrom(
        this.httpService.get(igUrl, {
          params: {
            access_token: pageAccessToken,
            fields:
              'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
          },
        }),
      );

      return plainToInstance(InstagramAccountDto, igResponse.data);
    } catch (error) {
      console.error('Error getting Instagram account:', error);
      // Return null if no Instagram account linked
      return null;
    }
  }
}
