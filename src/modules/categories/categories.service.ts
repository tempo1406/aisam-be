import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Categories } from './entities/categories.entity';
import { IsNull, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ResponseCategoryDto } from './dto/response-category.dto';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { CacheService } from '@modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CATEGORY_CACHE } from '@modules/cache/constants/category-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { CATEGORY_EVENTS } from '@modules/events/constants/category-events.constant';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories)
    private readonly categoryRepository: Repository<Categories>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<ResponseCategoryDto> {
    try {
      const existingCategory = await this.findCategoryByNameAndUserId(
        createCategoryDto.name,
        userId,
      );
      if (existingCategory) {
        throw new ValidationException(ErrorCode.C002);
      }

      const newCategory = await this.categoryRepository.save({
        ...createCategoryDto,
        userId: userId,
      });

      this.eventEmitter.emit(CATEGORY_EVENTS.CREATED, { user_id: userId });

      return plainToInstance(ResponseCategoryDto, newCategory);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async findAll(): Promise<ResponseCategoryDto[]> {
    try {
      const cachedCategories = await this.cacheService.get<
        ResponseCategoryDto[]
      >(CATEGORY_CACHE.ALL);
      if (cachedCategories) {
        return cachedCategories;
      }

      const categories = await this.categoryRepository.find();
      if (!categories.length) {
        throw new ValidationException(ErrorCode.C003);
      }

      const result = plainToInstance(ResponseCategoryDto, categories);

      await this.cacheService.set<ResponseCategoryDto[]>(
        CATEGORY_CACHE.ALL,
        result,
        TTL_CACHE.CATEGORY,
      );

      return result;
    } catch (error) {
      console.error('Error finding all categories:', error);
      throw error;
    }
  }

  async findCategoryByNameAndUserId(
    name: string,
    userId: string,
  ): Promise<ResponseCategoryDto> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { name, userId, deleted_at: IsNull() },
      });
      return plainToInstance(ResponseCategoryDto, category);
    } catch (error) {
      console.error('Error finding category by name and user id:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const cachedCategory = await this.cacheService.get<ResponseCategoryDto>(
        CATEGORY_CACHE.ONE(id),
      );
      if (cachedCategory) {
        return cachedCategory;
      }

      const category = await this.categoryRepository.findOne({
        where: { id: id, deleted_at: IsNull() },
      });
      if (!category) {
        throw new ValidationException(ErrorCode.C003);
      }

      const result = plainToInstance(ResponseCategoryDto, category);

      await this.cacheService.set<ResponseCategoryDto>(
        CATEGORY_CACHE.ONE(id),
        result,
        TTL_CACHE.CATEGORY,
      );

      return result;
    } catch (error) {
      console.error('Error finding category:', error);
      throw error;
    }
  }

  async update(
    id: string,
    userId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<ResponseCategoryDto> {
    try {
      const existingCategory = await this.findCategoryByNameAndUserId(
        updateCategoryDto.name || '',
        userId,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ValidationException(ErrorCode.C002);
      }

      const category = await this.categoryRepository.findOne({
        where: { id, deleted_at: IsNull() },
      });
      if (!category) {
        throw new ValidationException(ErrorCode.C003);
      }
      await this.categoryRepository.update(id, updateCategoryDto);

      this.eventEmitter.emit(CATEGORY_EVENTS.UPDATED, {
        category_id: id,
        user_id: userId,
      });

      return plainToInstance(ResponseCategoryDto, category);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id, userId, deleted_at: IsNull() },
      });
      if (!category) {
        throw new ValidationException(ErrorCode.V008);
      }
      await this.categoryRepository.update(id, { deleted_at: new Date() });

      this.eventEmitter.emit(CATEGORY_EVENTS.DELETED, {
        category_id: id,
        user_id: category.userId,
      });

      return plainToInstance(ResponseCategoryDto, category);
    } catch (error) {
      console.error('Error removing category:', error);
      throw error;
    }
  }

  async myCategories(userId: string): Promise<ResponseCategoryDto[]> {
    try {
      const cachedCategories = await this.cacheService.get<
        ResponseCategoryDto[]
      >(CATEGORY_CACHE.BY_USER_ID(userId));
      if (cachedCategories) {
        return cachedCategories;
      }

      const category = await this.categoryRepository.find({
        where: { userId, deleted_at: IsNull() },
      });
      if (!category.length) {
        throw new ValidationException(ErrorCode.C003);
      }

      const result = plainToInstance(ResponseCategoryDto, category);

      await this.cacheService.set<ResponseCategoryDto[]>(
        CATEGORY_CACHE.BY_USER_ID(userId),
        result,
        TTL_CACHE.CATEGORY,
      );

      return result;
    } catch (error) {
      console.error('Error getting my categories:', error);
      throw error;
    }
  }

  async getAdminCategories(): Promise<ResponseCategoryDto[]> {
    const categories = await this.categoryRepository.find({
      where: { deleted_at: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ResponseCategoryDto, categories);
  }

  async deleteAdminCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new ValidationException(ErrorCode.C001, 'Category not found');
    }

    await this.categoryRepository.softDelete(categoryId);
  }

  async getDeletedCategories(): Promise<ResponseCategoryDto[]> {
    const categories = await this.categoryRepository.find({
      withDeleted: true,
      order: { deleted_at: 'DESC' },
    });

    const deletedCategories = categories.filter(
      (category) => category.deleted_at !== null,
    );
    return plainToInstance(ResponseCategoryDto, deletedCategories);
  }

  async restoreCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      withDeleted: true,
    });

    if (!category) {
      throw new ValidationException(ErrorCode.C001, 'Category not found');
    }

    await this.categoryRepository.restore(categoryId);
  }
}
