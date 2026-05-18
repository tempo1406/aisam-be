import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { SUBSCRIPTION_EVENTS } from '../constants/subscription-events.constant';
import { SUBSCRIPTION_CACHE } from '@modules/cache/constants/subscription-cache.constant';

@Injectable()
export class SubscriptionEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(SUBSCRIPTION_EVENTS.CREATED)
  async handleSubscriptionCreated(payload: { user_id: string }) {
    await this.cacheService.del(SUBSCRIPTION_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ACTIVE_BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.ALL);
  }

  @OnEvent(SUBSCRIPTION_EVENTS.UPDATED)
  async handleSubscriptionUpdated(payload: {
    subscription_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ONE(payload.subscription_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ACTIVE_BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.ALL);
  }

  @OnEvent(SUBSCRIPTION_EVENTS.CANCELED)
  async handleSubscriptionCanceled(payload: {
    subscription_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ONE(payload.subscription_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ACTIVE_BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.ALL);
  }

  @OnEvent(SUBSCRIPTION_EVENTS.DELETED)
  async handleSubscriptionDeleted(payload: {
    subscription_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ONE(payload.subscription_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ACTIVE_BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(SUBSCRIPTION_CACHE.ALL);
  }

  @OnEvent(SUBSCRIPTION_EVENTS.USAGE_INCREMENTED)
  async handleUsageIncremented(payload: { user_id: string }) {
    await this.cacheService.del(
      SUBSCRIPTION_CACHE.ACTIVE_BY_USER_ID(payload.user_id),
    );
  }
}
