import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateHashtagCollectionDto } from './dto/create-hashtag_collection.dto';
import { UpdateHashtagCollectionDto } from './dto/update-hashtag_collection.dto';
import { ResponseHashtagCollectionDto } from './dto/response-hashtag_collection.dto';
import { HashtagCollection } from './entities/hashtag_collection.entity';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { CacheService } from '@modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HASHTAG_COLLECTION_CACHE } from '@modules/cache/constants/hashtag-collection-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { HASHTAG_COLLECTION_EVENTS } from '@modules/events/constants/hashtag-collection.constant';

@Injectable()
export class HashtagCollectionsService {
  constructor(
    @InjectRepository(HashtagCollection)
    private readonly hashtagCollectionRepository: Repository<HashtagCollection>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    user_id: string,
    createHashtagCollectionDto: CreateHashtagCollectionDto,
  ): Promise<void> {
    try {
      const existingCollection = await this.findByNameAndUserId(
        createHashtagCollectionDto.collection_name,
        user_id,
      );
      if (existingCollection) {
        throw new ValidationException(
          ErrorCode.B005,
          'Hashtag collection name already exists for this user',
        );
      }

      const hashtagCollection = this.hashtagCollectionRepository.create({
        ...createHashtagCollectionDto,
        user_id,
      });
      await this.hashtagCollectionRepository.save(hashtagCollection);
      this.eventEmitter.emit(HASHTAG_COLLECTION_EVENTS.CREATED, { user_id });
    } catch (error) {
      console.error('Error creating hashtag collection:', error);
      throw error;
    }
  }

  async findByNameAndUserId(
    collection_name: string,
    user_id: string,
  ): Promise<ResponseHashtagCollectionDto | null> {
    try {
      const collection = await this.hashtagCollectionRepository.findOne({
        where: {
          collection_name,
          user_id,
          delete_at: IsNull(),
        },
      });

      return collection
        ? plainToInstance(ResponseHashtagCollectionDto, collection)
        : null;
    } catch (error) {
      console.error(
        'Error finding hashtag collection by name and user id:',
        error,
      );
      throw error;
    }
  }

  async findAllByUserId(
    user_id: string,
  ): Promise<ResponseHashtagCollectionDto[]> {
    const cachedCollections = await this.cacheService.get<
      ResponseHashtagCollectionDto[]
    >(HASHTAG_COLLECTION_CACHE.BY_USER_ID(user_id));
    if (cachedCollections) {
      return cachedCollections;
    }
    const collections = await this.hashtagCollectionRepository.find({
      where: {
        user_id,
        delete_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    await this.cacheService.set<ResponseHashtagCollectionDto[]>(
      HASHTAG_COLLECTION_CACHE.BY_USER_ID(user_id),
      collections,
      TTL_CACHE.HASHTAG_COLLECTION,
    );
    return plainToInstance(ResponseHashtagCollectionDto, collections);
  }

  async findAll(): Promise<ResponseHashtagCollectionDto[]> {
    try {
      const cachedCollections = await this.cacheService.get<
        ResponseHashtagCollectionDto[]
      >(HASHTAG_COLLECTION_CACHE.ALL);
      if (cachedCollections) {
        return cachedCollections;
      }
      const collections = await this.hashtagCollectionRepository.find({
        where: {
          delete_at: IsNull(),
        },
        order: {
          created_at: 'DESC',
        },
      });

      await this.cacheService.set<ResponseHashtagCollectionDto[]>(
        HASHTAG_COLLECTION_CACHE.ALL,
        collections,
        TTL_CACHE.HASHTAG_COLLECTION,
      );

      return plainToInstance(ResponseHashtagCollectionDto, collections);
    } catch (error) {
      console.error('Error finding all hashtag collections:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ResponseHashtagCollectionDto> {
    try {
      const cachedCollection =
        await this.cacheService.get<ResponseHashtagCollectionDto>(
          HASHTAG_COLLECTION_CACHE.ONE(id),
        );
      if (cachedCollection) {
        return cachedCollection;
      }
      const collection = await this.hashtagCollectionRepository.findOne({
        where: {
          id,
          delete_at: IsNull(),
        },
      });

      const result = plainToInstance(ResponseHashtagCollectionDto, collection);
      await this.cacheService.set<ResponseHashtagCollectionDto>(
        HASHTAG_COLLECTION_CACHE.ONE(id),
        result,
        TTL_CACHE.HASHTAG_COLLECTION,
      );

      return result;
    } catch (error) {
      console.error('Error finding hashtag collection:', error);
      throw error;
    }
  }

  async update(
    id: string,
    user_id: string,
    updateHashtagCollectionDto: UpdateHashtagCollectionDto,
  ): Promise<void> {
    const collection = await this.hashtagCollectionRepository.findOne({
      where: {
        id,
        user_id,
        delete_at: IsNull(),
      },
    });

    if (!collection) {
      throw new ValidationException(ErrorCode.H001);
    }

    if (
      updateHashtagCollectionDto.collection_name &&
      updateHashtagCollectionDto.collection_name !== collection.collection_name
    ) {
      const existingCollection = await this.findByNameAndUserId(
        updateHashtagCollectionDto.collection_name,
        user_id,
      );
      if (existingCollection && existingCollection.id !== id) {
        throw new ValidationException(
          ErrorCode.H003,
          'Hashtag collection name already exists for this user',
        );
      }
    }

    await this.hashtagCollectionRepository.update(id, {
      ...updateHashtagCollectionDto,
      updated_at: new Date(),
    });
    this.eventEmitter.emit(HASHTAG_COLLECTION_EVENTS.UPDATED, {
      hashtag_collection_id: id,
      user_id,
    });
  }

  async remove(id: string, user_id: string): Promise<void> {
    const collection = await this.hashtagCollectionRepository.findOne({
      where: {
        id,
        user_id,
        delete_at: IsNull(),
      },
    });

    if (!collection) {
      throw new NotFoundException(
        'Hashtag collection not found or access denied',
      );
    }

    await this.hashtagCollectionRepository.update(id, {
      delete_at: new Date(),
    });
    this.eventEmitter.emit(HASHTAG_COLLECTION_EVENTS.DELETED, {
      hashtag_collection_id: id,
      user_id,
    });
  }
}
