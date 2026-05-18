import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Subscription } from './entities/subscription.entity';
import { ResponseSubscriptionDto } from './dto/response-subscription.dto';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { SubscriptionStatus } from 'src/enums/subscription.enum';
import { PlansService } from '@modules/plans/plans.service';
import { CacheService } from '@modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SUBSCRIPTION_CACHE } from '@modules/cache/constants/subscription-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { SUBSCRIPTION_EVENTS } from '@modules/events/constants/subscription-events.constant';
import { UsersService } from '@modules/users/users.service';
import { CreatePurchaseSubscriptionDto } from './dto/create-subscription.dto';
import { PlanEnum } from 'src/enums/plan.enum';
import { AdminSubscriptionQueryDto } from './dto/admin-subscription-query.dto';
import {
  RevenueStatisticsDto,
  PlanStatisticsDto,
} from './dto/subscription-revenue.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createFreeSubscription(userId: string) {
    try {
      const plan = await this.plansService.findByName(PlanEnum.FREE);

      const subscription = this.subscriptionRepository.create({
        user_id: userId,
        plan_id: plan.id,
        start_date: new Date(),
        end_date: new Date(
          new Date().setDate(new Date().getDate() + plan.duration_days),
        ),
        status: SubscriptionStatus.ACTIVE,
        usage_count: 0,
        max_usage: plan.max_usage,
        plan: plan,
      });
      await this.subscriptionRepository.save(subscription);
      this.eventEmitter.emit(SUBSCRIPTION_EVENTS.CREATED, { user_id: userId });
    } catch (error) {
      console.error('Error creating free subscription:', error);
      throw error;
    }
  }

  async create(
    userId: string,
    createPurchaseSubscriptionDto: CreatePurchaseSubscriptionDto,
  ): Promise<ResponseSubscriptionDto> {
    try {
      await this.usersService.findById(userId);

      const plan = await this.plansService.findOne(
        createPurchaseSubscriptionDto.plan_id,
      );

      if (plan.name === PlanEnum.FREE) {
        throw new ValidationException(ErrorCode.S006);
      }

      // Check if user already has PENDING or ACTIVE subscription
      const existingSamePlanSubscription =
        await this.subscriptionRepository.findOne({
          where: {
            user_id: userId,
            plan_id: plan.id,
            status: SubscriptionStatus.ACTIVE,
          },
        });

      if (existingSamePlanSubscription) {
        throw new ValidationException(ErrorCode.S002);
      }

      const existingPendingSubscription =
        await this.subscriptionRepository.findOne({
          where: {
            user_id: userId,
            status: SubscriptionStatus.PENDING,
          },
        });

      if (existingPendingSubscription) {
        throw new ValidationException(
          ErrorCode.S007,
          existingPendingSubscription.id.toString(),
        );
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + plan.duration_days);

      const subscription = this.subscriptionRepository.create({
        user_id: userId,
        plan_id: plan.id,
        start_date: startDate,
        end_date: endDate,
        max_usage: plan.max_usage,
        status: SubscriptionStatus.PENDING,
        usage_count: 0,
      });

      await this.subscriptionRepository.save(subscription);

      this.eventEmitter.emit(SUBSCRIPTION_EVENTS.CREATED, { user_id: userId });

      return plainToInstance(
        ResponseSubscriptionDto,
        {
          id: subscription.id,
          user_id: userId,
          plan_id: plan.id,
          start_date: startDate,
          end_date: endDate,
          status: SubscriptionStatus.PENDING,
          usage_count: 0,
          max_usage: plan.max_usage,
          plan: plan,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<ResponseSubscriptionDto[]> {
    try {
      const cachedSubscriptions = await this.cacheService.get<
        ResponseSubscriptionDto[]
      >(SUBSCRIPTION_CACHE.BY_USER_ID(userId));
      if (cachedSubscriptions) {
        return cachedSubscriptions;
      }

      const subscriptions = await this.subscriptionRepository.find({
        where: { user_id: userId },
        relations: ['plan'],
        order: { created_at: 'DESC' },
      });

      const result = plainToInstance(ResponseSubscriptionDto, subscriptions);

      await this.cacheService.set<ResponseSubscriptionDto[]>(
        SUBSCRIPTION_CACHE.BY_USER_ID(userId),
        result,
        TTL_CACHE.SUBSCRIPTION,
      );

      return result;
    } catch (error) {
      console.error('Error finding user subscriptions:', error);
      throw error;
    }
  }

  async incrementUsage(userId: string): Promise<boolean> {
    try {
      // Lấy tất cả subscriptions ACTIVE của user
      const subscriptions = await this.subscriptionRepository.find({
        where: {
          user_id: userId,
          status: SubscriptionStatus.ACTIVE,
        },
        relations: ['plan'],
      });

      if (!subscriptions || subscriptions.length === 0) {
        return false;
      }

      // Sắp xếp theo thứ tự ưu tiên: FREE -> GOLD -> PLATINUM
      const planPriority = {
        [PlanEnum.FREE]: 1,
        [PlanEnum.GOLD]: 2,
        [PlanEnum.PLATINUM]: 3,
      };

      subscriptions.sort((a, b) => {
        return planPriority[a.plan.name] - planPriority[b.plan.name];
      });

      // Tìm subscription đầu tiên còn usage available
      let selectedSubscription: Subscription | null = null;
      for (const subscription of subscriptions) {
        if (subscription.usage_count < subscription.plan.max_usage) {
          selectedSubscription = subscription;
          break;
        }
      }

      // Nếu không có subscription nào còn available
      if (!selectedSubscription) {
        return false;
      }

      // Tăng usage lên 1
      selectedSubscription.usage_count += 1;

      // Nếu đã dùng hết limit, chuyển status thành LIMIT_EXCEEDED
      if (
        selectedSubscription.usage_count >= selectedSubscription.plan.max_usage
      ) {
        selectedSubscription.status = SubscriptionStatus.LIMIT_EXCEEDED;
      }

      await this.subscriptionRepository.save(selectedSubscription);

      this.eventEmitter.emit(SUBSCRIPTION_EVENTS.USAGE_INCREMENTED, {
        user_id: userId,
      });

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  async checkUsageLimit(
    userId: string,
  ): Promise<ResponseSubscriptionDto[] | null> {
    try {
      const subscriptions = await this.subscriptionRepository.find({
        where: { user_id: userId, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      });

      if (!subscriptions) {
        return [];
      }

      return plainToInstance(ResponseSubscriptionDto, subscriptions);
    } catch (error) {
      this.logger.error('Error checking usage limit:', error);
      throw error;
    }
  }
  // Thêm method activate subscription
  async activateSubscription(
    subscriptionId: number,
  ): Promise<ResponseSubscriptionDto> {
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
        relations: ['plan'], // Load plan relation for socket notification
      });

      if (!subscription) {
        throw new ValidationException(ErrorCode.S001);
      }

      if (subscription.status !== SubscriptionStatus.PENDING) {
        throw new ValidationException(ErrorCode.S003);
      }

      subscription.status = SubscriptionStatus.ACTIVE;
      // Update start date when activate
      subscription.start_date = new Date();
      await this.subscriptionRepository.save(subscription);

      this.eventEmitter.emit(SUBSCRIPTION_EVENTS.UPDATED, {
        user_id: subscription.user_id,
        subscription_id: subscription.id,
      });

      // Invalidate cache
      await this.cacheService.del(
        SUBSCRIPTION_CACHE.ACTIVE_BY_USER_ID(subscription.user_id),
      );

      return plainToInstance(ResponseSubscriptionDto, subscription, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  async checkAvailableUsage(
    userId: string,
    offsetUsage?: number,
  ): Promise<boolean> {
    try {
      const subscriptions = await this.subscriptionRepository.find({
        where: { user_id: userId, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      });
      if (!subscriptions || subscriptions.length === 0) {
        return false;
      }
      return subscriptions.some(
        (subscription) =>
          subscription.plan &&
          subscription.usage_count <
            subscription.plan.max_usage - (offsetUsage || 0),
      );
    } catch (error) {
      console.error('Error checking has active subscription:', error);
      throw error;
    }
  }

  // Method cancel subscription (khi payment fail)
  async cancelSubscription(subscriptionId: number): Promise<void> {
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new ValidationException(ErrorCode.S001);
      }

      subscription.status = SubscriptionStatus.FAILED;
      await this.subscriptionRepository.save(subscription);

      this.eventEmitter.emit(SUBSCRIPTION_EVENTS.CANCELED, {
        subscription_id: subscription.id,
        user_id: subscription.user_id,
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async findAllForAdmin(query: AdminSubscriptionQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        userId,
        planId,
        startDateFrom,
        startDateTo,
      } = query;
      const skip = (page - 1) * limit;

      const queryBuilder = this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.user', 'user')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .orderBy('subscription.created_at', 'DESC')
        .skip(skip)
        .take(limit);

      // Apply filters
      if (status) {
        queryBuilder.andWhere('subscription.status = :status', { status });
      }

      if (userId) {
        queryBuilder.andWhere('subscription.user_id = :userId', { userId });
      }

      if (planId) {
        queryBuilder.andWhere('subscription.plan_id = :planId', { planId });
      }

      if (startDateFrom && startDateTo) {
        queryBuilder.andWhere(
          'subscription.start_date BETWEEN :startDateFrom AND :startDateTo',
          {
            startDateFrom,
            startDateTo,
          },
        );
      } else if (startDateFrom) {
        queryBuilder.andWhere('subscription.start_date >= :startDateFrom', {
          startDateFrom,
        });
      } else if (startDateTo) {
        queryBuilder.andWhere('subscription.start_date <= :startDateTo', {
          startDateTo,
        });
      }

      const [subscriptions, total] = await queryBuilder.getManyAndCount();

      return {
        data: plainToInstance(ResponseSubscriptionDto, subscriptions),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching subscriptions for admin:', error);
      throw error;
    }
  }

  async getRevenueStatistics(): Promise<RevenueStatisticsDto> {
    try {
      const allSubscriptions = await this.subscriptionRepository.find({
        relations: ['plan'],
      });

      // Calculate overview statistics
      const totalSubscriptions = allSubscriptions.length;
      const activeSubscriptions = allSubscriptions.filter(
        (s) => s.status === SubscriptionStatus.ACTIVE,
      ).length;
      const expiredSubscriptions = allSubscriptions.filter(
        (s) => s.status === SubscriptionStatus.EXPIRED,
      ).length;
      const cancelledSubscriptions = allSubscriptions.filter(
        (s) =>
          s.status === SubscriptionStatus.CANCELLED ||
          s.status === SubscriptionStatus.FAILED,
      ).length;

      // Calculate total revenue (exclude free plans)
      const paidSubscriptions = allSubscriptions.filter(
        (s) =>
          s.plan &&
          s.plan.price > 0 &&
          s.status !== SubscriptionStatus.CANCELLED,
      );
      const totalRevenue = paidSubscriptions.reduce(
        (sum, s) => sum + (s.plan?.price || 0),
        0,
      );

      // Calculate monthly revenue
      const monthlyRevenueMap = new Map<
        string,
        { revenue: number; count: number }
      >();

      paidSubscriptions.forEach((sub) => {
        const month = sub.start_date.toISOString().slice(0, 7); // YYYY-MM
        const existing = monthlyRevenueMap.get(month) || {
          revenue: 0,
          count: 0,
        };
        monthlyRevenueMap.set(month, {
          revenue: existing.revenue + (sub.plan?.price || 0),
          count: existing.count + 1,
        });
      });

      const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate statistics by plan
      const planMap = new Map<string, Subscription[]>();
      allSubscriptions.forEach((sub) => {
        if (sub.plan) {
          const planId = sub.plan_id;
          if (!planMap.has(planId)) {
            planMap.set(planId, []);
          }
          planMap.get(planId)!.push(sub);
        }
      });

      const byPlan: PlanStatisticsDto[] = Array.from(planMap.entries()).map(
        ([planId, subs]) => {
          const plan = subs[0].plan;
          const activeSubs = subs.filter(
            (s) => s.status === SubscriptionStatus.ACTIVE,
          );
          const paidSubs = subs.filter(
            (s) => plan.price > 0 && s.status !== SubscriptionStatus.CANCELLED,
          );
          const planRevenue = paidSubs.reduce((sum) => sum + plan.price, 0);

          return {
            planId: planId,
            planName: plan.name,
            totalSubscriptions: subs.length,
            activeSubscriptions: activeSubs.length,
            totalRevenue: planRevenue,
            averageRevenue: subs.length > 0 ? planRevenue / subs.length : 0,
            activeRate:
              subs.length > 0 ? (activeSubs.length / subs.length) * 100 : 0,
          };
        },
      );

      return {
        overview: {
          totalRevenue,
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          monthlyRevenue,
        },
        byPlan: byPlan.sort((a, b) => b.totalRevenue - a.totalRevenue),
      };
    } catch (error) {
      console.error('Error getting revenue statistics:', error);
      throw error;
    }
  }
}
