import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Total number of posts' })
  totalPosts: number;

  @ApiProperty({ description: 'Total number of active subscriptions' })
  activeSubscriptions: number;

  @ApiProperty({ description: 'Total revenue this month' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'New users this month' })
  newUsersThisMonth: number;

  @ApiProperty({ description: 'New posts this month' })
  newPostsThisMonth: number;

  @ApiProperty({ description: 'Top categories by post count' })
  topCategories: { name: string; postCount: number }[];

  @ApiProperty({ description: 'Recent user registrations' })
  recentUsers: { id: string; email: string; createdAt: Date }[];
}