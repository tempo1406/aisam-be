import { Exclude, Expose, Type } from 'class-transformer';
import { ResponseUserDto } from '@modules/users/dto/response-user.dto';
import { SubscriptionStatus } from 'src/enums/subscription.enum';
import { Plan } from '@modules/plans/entities/plan.entity';

@Exclude()
export class ResponseSubscriptionDto {
  @Expose()
  id: number;

  @Expose()
  user_id: string;

  @Expose()
  plan_id: string;

  @Expose()
  start_date: Date;

  @Expose()
  end_date: Date;

  @Expose()
  status: SubscriptionStatus;

  @Expose()
  usage_count: number;

  @Expose()
  max_usage: number;

  @Expose()
  @Type(() => ResponseUserDto)
  user?: ResponseUserDto;

  @Expose()
  plan?: Plan;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
