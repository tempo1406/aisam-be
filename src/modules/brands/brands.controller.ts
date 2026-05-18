import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ResponseBrandDto } from './dto/response-brand.dto';
import { AdminBrandDto } from './dto/admin-brand.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { RolesGuard } from '@guards/roles-guard/roles.guard';

@ApiTags('Brands')
@Controller({
  path: 'brands',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('Authorization')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Brand created successfully',
    type: ResponseBrandDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async create(
    @Req() req: any,
    @Body() createBrandDto: CreateBrandDto,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.brandsService.create(user_id, createBrandDto);
    return new ApiResponseDto(HttpStatus.CREATED, 'Brand created successfully');
  }

  @Get('my-brands')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all my brands ' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brands retrieved successfully',
    type: [ResponseBrandDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async findMyBrands(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseBrandDto[]>> {
    const user_id = req.user.sub as string;
    const brands = await this.brandsService.findBrandByUserId(user_id);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Brands retrieved successfully',
      brands,
    );
  }

  @Get('admin')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all brands for admin' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brands retrieved successfully',
    type: ResponseBrandDto,
    isArray: true,
  })
  async getAdminBrands(): Promise<ApiResponseDto<ResponseBrandDto[]>> {
    const brands = await this.brandsService.getAdminBrands();
    return new ApiResponseDto(HttpStatus.OK, 'Brands retrieved successfully', brands);
  }

  @Get('admin/deleted')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get deleted brands for admin' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deleted brands retrieved successfully',
    type: ResponseBrandDto,
    isArray: true,
  })
  async getDeletedBrands(): Promise<ApiResponseDto<ResponseBrandDto[]>> {
    const data = await this.brandsService.getDeletedBrands();
    return new ApiResponseDto(HttpStatus.OK, 'Deleted brands retrieved successfully', data);
  }

  @Delete('admin/:id')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete brand for admin' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand deleted successfully',
  })
  async deleteAdminBrand(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.brandsService.deleteAdminBrand(id);
    return new ApiResponseDto(HttpStatus.OK, 'Brand deleted successfully');
  }

  @Post('admin/:id/restore')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a brand for admin' })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand restored successfully',
  })
  async restoreBrand(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.brandsService.restoreBrand(id);
    return new ApiResponseDto(HttpStatus.OK, 'Brand restored successfully');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiParam({
    name: 'id',
    description: 'Brand ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand retrieved successfully',
    type: ResponseBrandDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ResponseBrandDto>> {
    const brand = await this.brandsService.findOne(id);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Brand retrieved successfully',
      brand,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update brand by ID' })
  @ApiParam({
    name: 'id',
    description: 'Brand ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand updated successfully',
    type: ResponseBrandDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.brandsService.update(id, user_id, updateBrandDto);
    return new ApiResponseDto(HttpStatus.OK, 'Brand updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brand by ID' })
  @ApiParam({
    name: 'id',
    description: 'Brand ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Brand deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<void>> {
    const user_id = req.user.sub as string;
    await this.brandsService.remove(id, user_id);
    return new ApiResponseDto(HttpStatus.OK, 'Brand deleted successfully');
  }

}
