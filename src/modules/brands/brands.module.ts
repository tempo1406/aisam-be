import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { Brand } from './entities/brand.entity';
import { JwtModule } from '@nestjs/jwt';
import { CustomCacheModule } from '@modules/cache/cache.module';
import { EventsModule } from '@modules/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand]),
    JwtModule,
    CustomCacheModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
