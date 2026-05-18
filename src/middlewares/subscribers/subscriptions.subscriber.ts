import { User } from '@modules/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { PlanEnum } from 'src/enums/plan.enum';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@Injectable()
@EventSubscriber()
export class SubscriptionsSubscriber
  implements EntitySubscriberInterface<User>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  async afterInsert(event: InsertEvent<User>) {
    try {
      console.log(
        '[SubscriptionsSubscriber] New user created:',
        event.entity.id,
      );

      // Sử dụng transaction manager từ event để chạy trong cùng transaction
      const plan = await event.manager
        .getRepository('Plan')
        .findOne({ where: { name: PlanEnum.FREE } });

      if (!plan) {
        console.warn('[SubscriptionsSubscriber] Free plan not found');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + plan.duration_days);

      await event.manager.getRepository('Subscription').insert({
        user_id: event.entity.id,
        plan_id: plan.id,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        usage_count: 0,
        max_usage: plan.max_usage,
      });

      console.log(
        '[SubscriptionsSubscriber] Free subscription created successfully',
      );
    } catch (error) {
      console.error(
        '[SubscriptionsSubscriber] Error creating free subscription:',
        error,
      );
    }
  }
}
