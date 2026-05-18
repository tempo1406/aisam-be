import { Expose } from 'class-transformer';
import { CurrencyEnum, PlanEnum } from 'src/enums/plan.enum';

export class ResponsePlanDto {
  @Expose()
  id: string;

  @Expose()
  name: PlanEnum;

  @Expose()
  currency: CurrencyEnum;

  @Expose()
  price: number;

  @Expose()
  duration_days: number;

  @Expose()
  max_usage: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  delete_at?: Date;
}
