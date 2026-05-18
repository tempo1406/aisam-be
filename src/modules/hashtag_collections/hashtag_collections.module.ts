import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashtagCollectionsService } from './hashtag_collections.service';
import { HashtagCollectionsController } from './hashtag_collections.controller';
import { HashtagCollection } from './entities/hashtag_collection.entity';
import { JwtModule } from '@nestjs/jwt';
import { EventsModule } from '@modules/events/events.module';
import { CustomCacheModule } from '@modules/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HashtagCollection]),
    JwtModule,
    forwardRef(() => EventsModule),
    CustomCacheModule,
  ],
  controllers: [HashtagCollectionsController],
  providers: [HashtagCollectionsService],
  exports: [HashtagCollectionsService],
})
export class HashtagCollectionsModule {}
