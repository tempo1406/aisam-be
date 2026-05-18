import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { PlansModule } from '@modules/plans/plans.module';
import { UsersModule } from '@modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { EventsModule } from '@modules/events/events.module';
import { PaymentModule } from '@modules/payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    forwardRef(() => PlansModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    CustomCacheModule,
    forwardRef(() => EventsModule),
    PaymentModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
