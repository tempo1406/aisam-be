import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '@modules/users/entities/user.entity';
import { Post } from '@modules/post/entities/post.entity';
import { Categories } from '@modules/categories/entities/categories.entity';
import { Plan } from '@modules/plans/entities/plan.entity';
import { Subscription } from '@modules/subscriptions/entities/subscription.entity';
import { AdminDashboardDto } from './dto/admin.dto';
import { SubscriptionStatus } from 'src/enums/subscription.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getDashboard(): Promise<AdminDashboardDto> {
    try {
      const [
        totalUsers,
        totalPosts,
        activeSubscriptions,
        newUsersThisMonth,
        newPostsThisMonth,
        topCategories,
        recentUsers,
      ] = await Promise.all([
        this.userRepository.count().catch(() => 0),
        this.postRepository.count().catch(() => 0),
        this.subscriptionRepository
          .count({
            where: { status: SubscriptionStatus.ACTIVE },
          })
          .catch(() => 0),
        this.getUsersThisMonth().catch(() => 0),
        this.getPostsThisMonth().catch(() => 0),
        this.getTopCategories().catch(() => []),
        this.getRecentUsers().catch(() => []),
      ]);

      const monthlyRevenue = await this.calculateMonthlyRevenue();

      return {
        totalUsers,
        totalPosts,
        activeSubscriptions,
        monthlyRevenue,
        newUsersThisMonth,
        newPostsThisMonth,
        topCategories,
        recentUsers,
      };
    } catch (error) {
      console.error('Error in getDashboard:', error);
      return {
        totalUsers: 0,
        totalPosts: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        newUsersThisMonth: 0,
        newPostsThisMonth: 0,
        topCategories: [],
        recentUsers: [],
      };
    }
  }

  private async getUsersThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.userRepository.count({
      where: {
        createdAt: Between(startOfMonth, new Date()),
      },
    });
  }

  private async getPostsThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.postRepository.count({
      where: {
        createdAt: Between(startOfMonth, new Date()),
      },
    });
  }

  private async getTopCategories(): Promise<
    { name: string; postCount: number }[]
  > {
    try {
      const result = await this.categoriesRepository
        .createQueryBuilder('category')
        .leftJoin('category.posts', 'post')
        .where('category.deleted_at IS NULL')
        .andWhere('post.delete_at IS NULL')
        .select('category.name', 'name')
        .addSelect('COUNT(post.id)', 'postCount')
        .groupBy('category.id')
        .addGroupBy('category.name')
        .orderBy('"postCount"', 'DESC')
        .limit(5)
        .getRawMany();

      return result.map((item) => ({
        name: item.name,
        postCount: parseInt(item.postCount) || 0,
      }));
    } catch (error) {
      console.error('Error in getTopCategories:', error);
      return [];
    }
  }

  private async getRecentUsers(): Promise<
    { id: string; email: string; createdAt: Date }[]
  > {
    const users = await this.userRepository.find({
      select: ['id', 'email', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return users;
  }

  private async calculateMonthlyRevenue(): Promise<number> {
    try {
      const result = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoin('Plan', 'plan', 'plan.id = subscription.plan_id')
        .select('SUM(CAST(plan.price AS DECIMAL))', 'total')
        .where('subscription.status = :status', {
          status: SubscriptionStatus.ACTIVE,
        })
        .getRawOne();

      return parseFloat(result?.total || '0');
    } catch (error) {
      console.error('Error calculating monthly revenue:', error);
      return 0;
    }
  }
}
