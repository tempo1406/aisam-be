import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '@modules/users/entities/user.entity';
import { Post } from '@modules/post/entities/post.entity';
import { Categories } from '@modules/categories/entities/categories.entity';
import { Plan } from '@modules/plans/entities/plan.entity';
import { Subscription } from '@modules/subscriptions/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Post,
      Categories,
      Plan,
      Subscription,
    ]),
    JwtModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}