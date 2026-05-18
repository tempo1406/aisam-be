import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return (await this.cache.get<T>(key)) as T | undefined;
    } catch (error) {
      console.error('Cache get failed:', error);
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error) {
      console.error('Cache del failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cache.clear();
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }
}
