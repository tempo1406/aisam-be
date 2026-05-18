import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { HASHTAG_COLLECTION_EVENTS } from '../constants/hashtag-collection.constant';
import { HASHTAG_COLLECTION_CACHE } from '@modules/cache/constants/hashtag-collection-cache.constant';

@Injectable()
export class HashtagCollectionsEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(HASHTAG_COLLECTION_EVENTS.CREATED)
  async handleHashtagCollectionsCreated(payload: { user_id: string }) {
    await this.cacheService.del(
      HASHTAG_COLLECTION_CACHE.BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(HASHTAG_COLLECTION_CACHE.ALL);
  }

  @OnEvent(HASHTAG_COLLECTION_EVENTS.UPDATED)
  async handleHashtagCollectionsUpdated(payload: {
    hashtag_collection_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(
      HASHTAG_COLLECTION_CACHE.ONE(payload.hashtag_collection_id),
    );
    await this.cacheService.del(
      HASHTAG_COLLECTION_CACHE.BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(HASHTAG_COLLECTION_CACHE.ALL);
  }

  @OnEvent(HASHTAG_COLLECTION_EVENTS.DELETED)
  async handleHashtagCollectionsDeleted(payload: {
    hashtag_collection_id: string;
    user_id: string;
  }) {
    await this.cacheService.del(
      HASHTAG_COLLECTION_CACHE.ONE(payload.hashtag_collection_id),
    );
    await this.cacheService.del(
      HASHTAG_COLLECTION_CACHE.BY_USER_ID(payload.user_id),
    );
    await this.cacheService.del(HASHTAG_COLLECTION_CACHE.ALL);
  }
}
