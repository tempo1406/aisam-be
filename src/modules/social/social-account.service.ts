import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SocialAccount } from './entities/social-account.entity';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { FacebookService } from '@modules/socials-connect/facebook/facebook.service';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import {
  SocialAccountPlatform,
  SocialAccountStatus,
} from 'src/enums/social.enum';
import {
  ResponseSocialDto,
  ResponseSocialWithAccessTokenDto,
} from './dto/response-social.dto';
import { plainToInstance } from 'class-transformer';
import { CacheService } from '@modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SOCIAL_EVENTS } from '@modules/events/constants/social-events.constant';
import { SOCIAL_CACHE } from '@modules/cache/constants/social-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { ConnectFacebookPageDto } from './dto/create-connect-social.dto';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class SocialAccountService {
  constructor(
    @InjectRepository(SocialAccount)
    private socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private facebookService: FacebookService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    createSocialAccountDto: CreateSocialAccountDto,
    user_id: string,
  ): Promise<void> {
    try {
      const checkExist = await this.findPageByPageIdAndUserId(
        createSocialAccountDto.page_id,
        user_id,
      );
      if (checkExist) {
        throw new ValidationException(ErrorCode.SA005);
      }
      switch (createSocialAccountDto.platform) {
        case SocialAccountPlatform.FACEBOOK:
          await this.createFacebookSocialAccount(
            createSocialAccountDto,
            user_id,
          );
          break;
        default:
          throw new ValidationException(ErrorCode.SA006);
      }
      this.eventEmitter.emit(SOCIAL_EVENTS.CREATED, { user_id });
    } catch (error) {
      console.error('Error creating social account:', error);
      throw error;
    }
  }

  async createFacebookSocialAccount(
    createSocialAccountDto: CreateSocialAccountDto,
    user_id: string,
  ): Promise<void> {
    try {
      const pageInfo = await this.facebookService.getPageInfo(
        createSocialAccountDto,
      );

      if (!pageInfo) {
        throw new ValidationException(ErrorCode.SA001);
      }

      const socialAccount = this.socialAccountRepository.create({
        ...createSocialAccountDto,
        user_id,
        page_name: pageInfo.name,
        page_image_url: pageInfo.page_image_url,
        fan_count: pageInfo.fan_count,
        followers_count: pageInfo.followers_count,
      });
      await this.socialAccountRepository.save(socialAccount);
      this.eventEmitter.emit(SOCIAL_EVENTS.CREATED, { user_id });
    } catch (error) {
      console.error('Error creating Facebook social account:', error);
      throw error;
    }
  }

  async findPageByPageIdAndUserId(
    page_id: string,
    user_id: string,
  ): Promise<ResponseSocialDto> {
    try {
      const response = await this.socialAccountRepository.findOne({
        where: { page_id, user_id, deleted_at: IsNull() },
      });

      const result = plainToInstance(ResponseSocialDto, response);
      return result;
    } catch (error) {
      console.error('Error finding page info:', error);
      throw error;
    }
  }

  async findPageByPageIdAndUserIdWithAccessToken(
    id: string,
    user_id: string,
  ): Promise<ResponseSocialWithAccessTokenDto> {
    try {
      const response = await this.socialAccountRepository.findOne({
        where: { id, user_id, deleted_at: IsNull() },
        select: [
          'id',
          'platform',
          'page_id',
          'page_name',
          'page_image_url',
          'fan_count',
          'followers_count',
          'token_expires_at',
          'status',
          'permissions',
          'access_token',
        ],
      });

      const result = plainToInstance(
        ResponseSocialWithAccessTokenDto,
        response,
      );
      return result;
    } catch (error) {
      console.error('Error finding page info:', error);
      throw error;
    }
  }

  async findMySocialAccounts(user_id: string): Promise<ResponseSocialDto[]> {
    try {
      const cache = await this.cacheService.get<ResponseSocialDto[]>(
        SOCIAL_CACHE.BY_USER_ID(user_id),
      );
      if (cache) {
        return cache;
      }
      const response = await this.socialAccountRepository.find({
        where: { user_id, deleted_at: IsNull() },
      });
      const result = plainToInstance(ResponseSocialDto, response);
      await this.cacheService.set(
        SOCIAL_CACHE.BY_USER_ID(user_id),
        result,
        TTL_CACHE.SOCIAL,
      );
      return result;
    } catch (error) {
      console.error('Error finding my social accounts:', error);
      throw error;
    }
  }

  async findPageInfo(
    social_account_id: string,
    user_id: string,
  ): Promise<ResponseSocialDto> {
    try {
      const page = await this.cacheService.get(
        SOCIAL_CACHE.ONE(social_account_id),
      );
      if (page) {
        return page as ResponseSocialDto;
      }
      const response = await this.socialAccountRepository.findOne({
        where: { id: social_account_id, user_id, deleted_at: IsNull() },
      });
      const result = plainToInstance(ResponseSocialDto, response);
      await this.cacheService.set(
        SOCIAL_CACHE.ONE(social_account_id),
        result,
        TTL_CACHE.SOCIAL,
      );
      return result;
    } catch (error) {
      console.error('Error finding page info:', error);
      throw error;
    }
  }

  async findMyPageInfo(user_id: string): Promise<ResponseSocialDto[]> {
    try {
      const cache = await this.cacheService.get(
        SOCIAL_CACHE.BY_USER_ID(user_id),
      );
      if (cache) {
        return cache as ResponseSocialDto[];
      }
      const response = await this.socialAccountRepository.find({
        where: { user_id, deleted_at: IsNull() },
      });
      const result = plainToInstance(ResponseSocialDto, response);
      await this.cacheService.set(
        SOCIAL_CACHE.BY_USER_ID(user_id),
        result,
        TTL_CACHE.SOCIAL,
      );
      return result;
    } catch (error) {
      console.error('Error finding my page info:', error);
      throw error;
    }
  }

  async delete(social_account_id: string, user_id: string): Promise<void> {
    try {
      const checkExist = await this.findPageInfo(social_account_id, user_id);
      if (!checkExist) {
        throw new ValidationException(ErrorCode.SA001);
      }

      await this.socialAccountRepository.update(checkExist.id, {
        deleted_at: new Date(),
      });
      this.eventEmitter.emit(SOCIAL_EVENTS.DELETED, {
        social_account_id: social_account_id,
        user_id: user_id,
      });
    } catch (error) {
      console.error('Error deleting social account:', error);
      throw error;
    }
  }

  async connectFacebookPages(
    userId: string,
    pages: ConnectFacebookPageDto[],
  ): Promise<ResponseSocialDto[]> {
    try {
      // Kiểm tra user có tồn tại không
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User với ID ${userId} không tồn tại trong hệ thống`,
        );
      }

      console.log('pages123123123 ', pages);
      const connectedPages: ResponseSocialDto[] = [];

      for (const page of pages) {
        // Check if page already exists
        const existing = await this.findPageByPageIdAndUserId(
          page.pageId,
          userId,
        );

        if (existing) {
          // Update existing page
          await this.socialAccountRepository.update(existing.id, {
            access_token: page.pageAccessToken,
            page_name: page.pageName,
            page_image_url: page.pageImageUrl,
            fan_count: page.fanCount,
            followers_count: page.followersCount,
            status: SocialAccountStatus.ACTIVE,
          });

          // Clear deleted_at separately
          await this.socialAccountRepository
            .createQueryBuilder()
            .update(SocialAccount)
            .set({ deleted_at: null as any })
            .where('id = :id', { id: existing.id })
            .execute();

          const updated = await this.findPageInfo(existing.id, userId);
          connectedPages.push(updated);
        } else {
          // Create new page
          const socialAccount = this.socialAccountRepository.create({
            user_id: userId,
            platform: SocialAccountPlatform.FACEBOOK,
            page_id: page.pageId,
            page_name: page.pageName,
            access_token: page.pageAccessToken,
            page_image_url: page.pageImageUrl,
            fan_count: page.fanCount,
            followers_count: page.followersCount,
            status: SocialAccountStatus.ACTIVE,
          });

          const saved = await this.socialAccountRepository.save(socialAccount);
          const result = plainToInstance(ResponseSocialDto, saved);
          connectedPages.push(result);
        }

        // If has Instagram, create/update Instagram account
        if (page.instagramAccountId && page.instagramUsername) {
          const existingIg = await this.findPageByPageIdAndUserId(
            page.instagramAccountId,
            userId,
          );

          if (existingIg) {
            // Update existing Instagram account
            await this.socialAccountRepository.update(existingIg.id, {
              access_token: page.pageAccessToken,
              page_name: page.instagramUsername,
              page_image_url: page.instagramProfilePictureUrl,
              followers_count: page.instagramFollowersCount,
              follows_count: page.instagramFollowsCount,
              media_count: page.instagramMediaCount,
              status: SocialAccountStatus.ACTIVE,
            });

            // Clear deleted_at separately
            await this.socialAccountRepository
              .createQueryBuilder()
              .update(SocialAccount)
              .set({ deleted_at: null as any })
              .where('id = :id', { id: existingIg.id })
              .execute();

            const updated = await this.findPageInfo(existingIg.id, userId);
            connectedPages.push(updated);
          } else {
            // Create new Instagram account
            const igAccount = this.socialAccountRepository.create({
              user_id: userId,
              platform: SocialAccountPlatform.INSTAGRAM,
              page_id: page.instagramAccountId,
              page_name: page.instagramUsername,
              page_image_url: page.instagramProfilePictureUrl,
              access_token: page.pageAccessToken,
              followers_count: page.instagramFollowersCount,
              follows_count: page.instagramFollowsCount,
              media_count: page.instagramMediaCount,
              status: SocialAccountStatus.ACTIVE,
            });

            const saved = await this.socialAccountRepository.save(igAccount);
            const result = plainToInstance(ResponseSocialDto, saved);
            connectedPages.push(result);
          }
        }
      }

      // Emit event
      this.eventEmitter.emit(SOCIAL_EVENTS.CREATED, { user_id: userId });

      return connectedPages;
    } catch (error) {
      console.error('Error connecting Facebook pages:', error);
      throw error;
    }
  }
}
