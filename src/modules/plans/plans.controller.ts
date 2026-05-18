import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ResponsePlanDto } from './dto/response-plan.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { Public } from '@decorators/auth/public.decorator';

@ApiTags('Plans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a new plan (Admin only)' })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: ApiResponseDto<ResponsePlanDto>,
  })
  async create(
    @Body() createPlanDto: CreatePlanDto,
  ): Promise<ApiResponseDto<ResponsePlanDto>> {
    const plan = await this.plansService.create(createPlanDto);
    return new ApiResponseDto(201, 'Plan created successfully', plan);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all plans (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
    type: ApiResponseDto<ResponsePlanDto[]>,
  })
  async findAll(): Promise<ApiResponseDto<ResponsePlanDto[]>> {
    const plans = await this.plansService.findAll();
    return new ApiResponseDto(200, 'Plans retrieved successfully', plans);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all plans for admin management' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
    type: ApiResponseDto<ResponsePlanDto[]>,
  })
  async findAllForAdmin(): Promise<ApiResponseDto<ResponsePlanDto[]>> {
    const plans = await this.plansService.findAll();
    return new ApiResponseDto(200, 'Plans retrieved successfully', plans);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
    type: ApiResponseDto<ResponsePlanDto>,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<ResponsePlanDto>> {
    const plan = await this.plansService.findOne(id);
    return new ApiResponseDto(200, 'Plan retrieved successfully', plan);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update plan (Admin only)' })
  @ApiBody({ type: UpdatePlanDto })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: ApiResponseDto<ResponsePlanDto>,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<ApiResponseDto<ResponsePlanDto>> {
    const plan = await this.plansService.update(id, updatePlanDto);
    return new ApiResponseDto(200, 'Plan updated successfully', plan);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Plan deleted successfully',
    type: ApiResponseDto<null>,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.plansService.remove(id);
    return new ApiResponseDto(200, 'Plan deleted successfully', null);
  }

  @Put(':id/restore')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Restore deleted plan (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Plan restored successfully',
    type: ApiResponseDto<ResponsePlanDto>,
  })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<ResponsePlanDto>> {
    const plan = await this.plansService.restore(id);
    return new ApiResponseDto(200, 'Plan restored successfully', plan);
  }
}
