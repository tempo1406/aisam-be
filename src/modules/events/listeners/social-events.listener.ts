import { CacheService } from '@modules/cache/cache.service';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SOCIAL_EVENTS } from '../constants/social-events.constant';
import { SOCIAL_CACHE } from '@modules/cache/constants/social-cache.constant';

@Injectable()
export class SocialEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(SOCIAL_EVENTS.CREATED)
  async handleSocialCreated(payload: { user_id: string }) {
    await this.cacheService.del(SOCIAL_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(SOCIAL_CACHE.ALL);
  }

  @OnEvent(SOCIAL_EVENTS.UPDATED)
  async handleSocialUpdated(payload: {
    social_account_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(SOCIAL_CACHE.ONE(payload.social_account_id));
    await this.cacheService.del(SOCIAL_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(SOCIAL_CACHE.ALL);
  }

  @OnEvent(SOCIAL_EVENTS.DELETED)
  async handleSocialDeleted(payload: {
    social_account_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(SOCIAL_CACHE.ONE(payload.social_account_id));
    await this.cacheService.del(SOCIAL_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(SOCIAL_CACHE.ALL);
  }
}
