import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionRevenueDto {
  @ApiProperty({ example: 1000000, description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ example: 100, description: 'Total subscriptions count' })
  totalSubscriptions: number;

  @ApiProperty({ example: 50, description: 'Active subscriptions count' })
  activeSubscriptions: number;

  @ApiProperty({ example: 30, description: 'Expired subscriptions count' })
  expiredSubscriptions: number;

  @ApiProperty({ example: 20, description: 'Cancelled subscriptions count' })
  cancelledSubscriptions: number;

  @ApiProperty({ 
    example: [
      { month: '2025-01', revenue: 100000, count: 10 },
      { month: '2025-02', revenue: 150000, count: 15 }
    ],
    description: 'Monthly revenue breakdown'
  })
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
}

export class PlanStatisticsDto {
  @ApiProperty({ example: 'uuid', description: 'Plan ID' })
  planId: string;

  @ApiProperty({ example: 'Premium', description: 'Plan name' })
  planName: string;

  @ApiProperty({ example: 50, description: 'Total subscriptions for this plan' })
  totalSubscriptions: number;

  @ApiProperty({ example: 30, description: 'Active subscriptions for this plan' })
  activeSubscriptions: number;

  @ApiProperty({ example: 500000, description: 'Total revenue from this plan' })
  totalRevenue: number;

  @ApiProperty({ example: 250000, description: 'Average revenue per subscription' })
  averageRevenue: number;

  @ApiProperty({ example: 60.0, description: 'Percentage of active subscriptions' })
  activeRate: number;
}

export class RevenueStatisticsDto {
  @ApiProperty({ type: SubscriptionRevenueDto })
  overview: SubscriptionRevenueDto;

  @ApiProperty({ type: [PlanStatisticsDto] })
  byPlan: PlanStatisticsDto[];
}
