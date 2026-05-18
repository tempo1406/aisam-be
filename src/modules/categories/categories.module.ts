import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Categories } from './entities/categories.entity';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { EventsModule } from '@modules/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categories]),
    JwtModule,
    CustomCacheModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoryModule {}
