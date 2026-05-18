import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { BRAND_EVENTS } from '../constants/brand-events.constant';
import { BRAND_CACHE } from '@modules/cache/constants/brand-cache.constant';

@Injectable()
export class BrandEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(BRAND_EVENTS.CREATED)
  async handleBrandCreated(payload: { user_id: string }) {
    await this.cacheService.del(BRAND_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(BRAND_CACHE.ALL);
  }

  @OnEvent(BRAND_EVENTS.UPDATED)
  async handleBrandUpdated(payload: { brand_id: string; user_id: string }) {
    await this.cacheService.del(BRAND_CACHE.ONE(payload.brand_id));
    await this.cacheService.del(BRAND_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(BRAND_CACHE.ALL);
  }

  @OnEvent(BRAND_EVENTS.DELETED)
  async handleBrandDeleted(payload: { brand_id: string; user_id: string }) {
    await this.cacheService.del(BRAND_CACHE.ONE(payload.brand_id));
    await this.cacheService.del(BRAND_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(BRAND_CACHE.ALL);
  }
}
