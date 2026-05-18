import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { CATEGORY_EVENTS } from '../constants/category-events.constant';
import { CATEGORY_CACHE } from '@modules/cache/constants/category-cache.constant';

@Injectable()
export class CategoryEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(CATEGORY_EVENTS.CREATED)
  async handleCategoryCreated(payload: { user_id: string }) {
    await this.cacheService.del(CATEGORY_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(CATEGORY_CACHE.ALL);
  }

  @OnEvent(CATEGORY_EVENTS.UPDATED)
  async handleCategoryUpdated(payload: {
    category_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(CATEGORY_CACHE.ONE(payload.category_id));
    await this.cacheService.del(CATEGORY_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(CATEGORY_CACHE.ALL);
  }

  @OnEvent(CATEGORY_EVENTS.DELETED)
  async handleCategoryDeleted(payload: {
    category_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(CATEGORY_CACHE.ONE(payload.category_id));
    await this.cacheService.del(CATEGORY_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(CATEGORY_CACHE.ALL);
  }
}
