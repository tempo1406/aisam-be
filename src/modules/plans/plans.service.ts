import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ResponsePlanDto } from './dto/response-plan.dto';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { CacheService } from '@modules/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PLAN_CACHE } from '@modules/cache/constants/plan-cache.constant';
import { TTL_CACHE } from '@modules/cache/constants/ttl-cache.constant';
import { PLAN_EVENTS } from '@modules/events/constants/plan-events.constant';
import { CurrencyEnum, PlanEnum } from 'src/enums/plan.enum';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<ResponsePlanDto> {
    try {
      if (!Object.values(PlanEnum).includes(createPlanDto.name)) {
        throw new ValidationException(ErrorCode.PL003);
      }
      if (!Object.values(CurrencyEnum).includes(createPlanDto.currency)) {
        throw new ValidationException(ErrorCode.PL004);
      }

      const existingPlan = await this.planRepository.findOne({
        where: { name: createPlanDto.name },
      });

      if (existingPlan) {
        throw new ValidationException(ErrorCode.PL002);
      }

      const plan = this.planRepository.create({
        ...createPlanDto,
        price: createPlanDto.price ?? 0,
        duration_days: createPlanDto.duration_days ?? 30,
      });

      await this.planRepository.save(plan);

      this.eventEmitter.emit(PLAN_EVENTS.CREATED);

      return plainToInstance(ResponsePlanDto, plan);
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  async findAll(): Promise<ResponsePlanDto[]> {
    try {
      const cachedPlans = await this.cacheService.get<ResponsePlanDto[]>(
        PLAN_CACHE.ALL,
      );
      if (cachedPlans) {
        return cachedPlans;
      }

      const plans = await this.planRepository.find({
        order: { price: 'ASC' },
      });

      const result = plainToInstance(ResponsePlanDto, plans);

      await this.cacheService.set<ResponsePlanDto[]>(
        PLAN_CACHE.ALL,
        result,
        TTL_CACHE.PLAN,
      );

      return result;
    } catch (error) {
      console.error('Error finding all plans:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<ResponsePlanDto> {
    try {
      const cachedPlan = await this.cacheService.get<ResponsePlanDto>(
        PLAN_CACHE.ONE(id),
      );
      if (cachedPlan) {
        return cachedPlan;
      }

      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new ValidationException(ErrorCode.PL001);
      }

      const result = plainToInstance(ResponsePlanDto, plan);

      await this.cacheService.set<ResponsePlanDto>(
        PLAN_CACHE.ONE(id),
        result,
        TTL_CACHE.PLAN,
      );

      return result;
    } catch (error) {
      console.error('Error finding plan:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updatePlanDto: UpdatePlanDto,
  ): Promise<ResponsePlanDto> {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new ValidationException(ErrorCode.PL001);
      }

      if (updatePlanDto.name && updatePlanDto.name !== plan.name) {
        const existingPlan = await this.planRepository.findOne({
          where: { name: updatePlanDto.name },
        });

        if (existingPlan) {
          throw new ValidationException(ErrorCode.PL002);
        }
      }

      Object.assign(plan, updatePlanDto);
      await this.planRepository.save(plan);

      this.eventEmitter.emit(PLAN_EVENTS.UPDATED, { plan_id: id });

      return plainToInstance(ResponsePlanDto, plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new ValidationException(ErrorCode.PL001);
      }

      await this.planRepository.softRemove(plan);

      this.eventEmitter.emit(PLAN_EVENTS.DELETED, { plan_id: id });
    } catch (error) {
      console.error('Error removing plan:', error);
      throw error;
    }
  }

  async restore(id: string): Promise<ResponsePlanDto> {
    try {
      const plan = await this.planRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!plan) {
        throw new ValidationException(ErrorCode.PL001);
      }

      await this.planRepository.restore(id);
      const restoredPlan = await this.planRepository.findOne({ where: { id } });

      this.eventEmitter.emit(PLAN_EVENTS.CREATED);

      return plainToInstance(ResponsePlanDto, restoredPlan);
    } catch (error) {
      console.error('Error restoring plan:', error);
      throw error;
    }
  }

  async findByName(name: PlanEnum): Promise<ResponsePlanDto> {
    try {
      const cachedPlan = await this.cacheService.get<ResponsePlanDto>(
        PLAN_CACHE.BY_NAME(name),
      );
      if (cachedPlan) {
        return cachedPlan;
      }

      const plan = await this.planRepository.findOne({ where: { name } });

      if (!plan) {
        throw new ValidationException(ErrorCode.PL001);
      }

      const result = plainToInstance(ResponsePlanDto, plan);

      await this.cacheService.set<ResponsePlanDto>(
        PLAN_CACHE.BY_NAME(name),
        result,
        TTL_CACHE.PLAN,
      );

      return result;
    } catch (error) {
      console.error('Error finding plan by name:', error);
      throw error;
    }
  }
}
