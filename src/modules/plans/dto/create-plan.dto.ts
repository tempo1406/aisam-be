import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { CurrencyEnum, PlanEnum } from 'src/enums/plan.enum';

export class CreatePlanDto {
  @ApiProperty({
    example: PlanEnum.FREE,
    description: 'Plan name',
    enum: PlanEnum,
  })
  @IsString()
  @IsNotEmpty()
  name: PlanEnum;

  @ApiProperty({
    example: CurrencyEnum.VND,
    description: 'Plan currency',
    enum: CurrencyEnum,
  })
  @IsString()
  @IsNotEmpty()
  currency: CurrencyEnum;

  @ApiProperty({
    example: 10000,
    description: 'Plan price',
    default: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: 30,
    description: 'Plan duration in days',
    default: 30,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  duration_days?: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum usage count for AI generations',
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  max_usage: number;
}
