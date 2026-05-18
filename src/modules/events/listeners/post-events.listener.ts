import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { POST_EVENTS } from '../constants/post-events.constant';
import { POST_CACHE } from '@modules/cache/constants/post-cache.constant';

@Injectable()
export class PostEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(POST_EVENTS.CREATED)
  async handlePostCreated(payload: { user_id: string }) {
    await this.cacheService.del(POST_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(POST_CACHE.ALL);
  }

  @OnEvent(POST_EVENTS.UPDATED)
  async handlePostUpdated(payload: { post_id: string; user_id: string }) {
    await this.cacheService.del(POST_CACHE.ONE(payload.post_id));
    await this.cacheService.del(POST_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(POST_CACHE.ALL);
  }

  @OnEvent(POST_EVENTS.DELETED)
  async handlePostDeleted(payload: { post_id: string; user_id: string }) {
    await this.cacheService.del(POST_CACHE.ONE(payload.post_id));
    await this.cacheService.del(POST_CACHE.BY_USER_ID(payload.user_id));
    await this.cacheService.del(POST_CACHE.ALL);
  }
}
