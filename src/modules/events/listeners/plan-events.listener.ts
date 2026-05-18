import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';
import { PLAN_EVENTS } from '../constants/plan-events.constant';
import { PLAN_CACHE } from '@modules/cache/constants/plan-cache.constant';

@Injectable()
export class PlanEventsListener {
  constructor(private cacheService: CacheService) {}

  @OnEvent(PLAN_EVENTS.CREATED)
  async handlePlanCreated() {
    await this.cacheService.del(PLAN_CACHE.ALL);
  }

  @OnEvent(PLAN_EVENTS.UPDATED)
  async handlePlanUpdated(payload: { plan_id: string }) {
    await this.cacheService.del(PLAN_CACHE.ONE(payload.plan_id));
    await this.cacheService.del(PLAN_CACHE.ALL);
  }

  @OnEvent(PLAN_EVENTS.DELETED)
  async handlePlanDeleted(payload: { plan_id: string }) {
    await this.cacheService.del(PLAN_CACHE.ONE(payload.plan_id));
    await this.cacheService.del(PLAN_CACHE.ALL);
  }
}
