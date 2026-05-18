import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ResponseBrandDto } from './dto/response-brand.dto';

import { Brand } from './entities/brand.entity';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { CacheService } from '@modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BRAND_CACHE } from '@modules/cache/constants/brand-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { BRAND_EVENTS } from '@modules/events/constants/brand-events.constant';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    user_id: string,
    createBrandDto: CreateBrandDto,
  ): Promise<ResponseBrandDto> {
    try {
      const existingBrand = await this.findByNameAndUserId(
        createBrandDto.name,
        user_id,
      );
      if (existingBrand) {
        throw new ValidationException(
          ErrorCode.B005,
          'Brand name is already exists',
        );
      }
      const brand = this.brandRepository.create(createBrandDto);
      const savedBrand = await this.brandRepository.save({
        ...brand,
        user_id,
      });

      const brandWithRelations = await this.brandRepository.findOne({
        where: { id: savedBrand.id },
      });

      this.eventEmitter.emit(BRAND_EVENTS.CREATED, { user_id });

      return plainToInstance(ResponseBrandDto, brandWithRelations);
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  }

  async findByNameAndUserId(
    name: string,
    user_id: string,
  ): Promise<ResponseBrandDto> {
    try {
      const brand = await this.brandRepository.findOne({
        where: { user_id, name, delete_at: IsNull() },
      });

      const result = plainToInstance(ResponseBrandDto, brand);
      return result;
    } catch (error) {
      console.error('Error finding brand:', error);
      throw error;
    }
  }

  async findAll(): Promise<ResponseBrandDto[]> {
    try {
      const cachedBrands = await this.cacheService.get<ResponseBrandDto[]>(
        BRAND_CACHE.ALL,
      );
      if (cachedBrands) {
        return cachedBrands;
      }
      const brands = await this.brandRepository.find({
        where: { delete_at: IsNull() },
      });
      await this.cacheService.set<ResponseBrandDto[]>(
        BRAND_CACHE.ALL,
        brands,
        TTL_CACHE.BRAND,
      );
      return plainToInstance(ResponseBrandDto, brands);
    } catch (error) {
      console.error('Error finding brands:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ResponseBrandDto> {
    try {
      const cachedBrand = await this.cacheService.get<ResponseBrandDto>(
        BRAND_CACHE.ONE(id),
      );
      if (cachedBrand) {
        return cachedBrand;
      }
      const brand = await this.brandRepository.findOne({
        where: { id, delete_at: IsNull() },
      });

      const result = plainToInstance(ResponseBrandDto, brand);
      await this.cacheService.set<ResponseBrandDto>(
        BRAND_CACHE.ONE(id),
        result,
        TTL_CACHE.BRAND,
      );
      return result;
    } catch (error) {
      console.error('Error finding brand:', error);
      throw error;
    }
  }

  async findBrandByUserId(user_id: string): Promise<ResponseBrandDto[]> {
    try {
      const cachedBrands = await this.cacheService.get<ResponseBrandDto[]>(
        BRAND_CACHE.BY_USER_ID(user_id),
      );
      if (cachedBrands) {
        return cachedBrands;
      }
      const brands = await this.brandRepository.find({
        where: { user_id: user_id, delete_at: IsNull() },
        order: { createdAt: 'DESC' },
      });

      await this.cacheService.set<ResponseBrandDto[]>(
        BRAND_CACHE.BY_USER_ID(user_id),
        brands,
        TTL_CACHE.BRAND,
      );

      return plainToInstance(ResponseBrandDto, brands);
    } catch (error) {
      console.error('Error finding brands:', error);
      throw error;
    }
  }

  async update(
    id: string,
    user_id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<ResponseBrandDto> {
    const brand = await this.brandRepository.findOne({
      where: { id, delete_at: IsNull() },
    });

    if (!brand) {
      throw new ValidationException(ErrorCode.B001);
    }

    try {
      const existingBrand = await this.findByNameAndUserId(
        updateBrandDto.name || '',
        user_id,
      );
      if (existingBrand && existingBrand.id !== id) {
        throw new ValidationException(
          ErrorCode.B005,
          'Brand name is  already exists',
        );
      }
      await this.brandRepository.update(id, updateBrandDto);

      const updatedBrand = await this.brandRepository.findOne({
        where: { id },
      });

      this.eventEmitter.emit(BRAND_EVENTS.UPDATED, { brand_id: id, user_id });

      return plainToInstance(ResponseBrandDto, updatedBrand);
    } catch (error) {
      console.error('Error updating brand:', error);
      throw error;
    }
  }

  async remove(id: string, user_id: string): Promise<void> {
    const brand = await this.brandRepository.findOne({
      where: { id, user_id, delete_at: IsNull() },
    });

    if (!brand) {
      throw new ValidationException(
        ErrorCode.B001,
        `Brand with ID ${id} not found`,
      );
    }

    try {
      await this.brandRepository.update(id, { delete_at: new Date() });
      this.eventEmitter.emit(BRAND_EVENTS.DELETED, { brand_id: id, user_id });
    } catch (error) {
      console.error('Error deleting brand:', error);
      throw error;
    }
  }

  async getAdminBrands(): Promise<ResponseBrandDto[]> {
    const brands = await this.brandRepository.find({
      where: { delete_at: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ResponseBrandDto, brands);
  }

  async deleteAdminBrand(brandId: string): Promise<void> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });
    if (!brand) {
      throw new ValidationException(ErrorCode.B001, 'Brand not found');
    }

    await this.brandRepository.update(brandId, {
      delete_at: new Date(),
    });
  }

  async getDeletedBrands(): Promise<ResponseBrandDto[]> {
    const brands = await this.brandRepository.find({
      withDeleted: true,
      order: { delete_at: 'DESC' },
    });

    const deletedBrands = brands.filter((brand) => brand.delete_at !== null);
    return plainToInstance(ResponseBrandDto, deletedBrands);
  }

  async restoreBrand(brandId: string): Promise<void> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId },
    });

    if (!brand) {
      throw new ValidationException(ErrorCode.B001, 'Brand not found');
    }

    await this.brandRepository.update(brandId, {
      delete_at: null as any,
    });
  }
}
