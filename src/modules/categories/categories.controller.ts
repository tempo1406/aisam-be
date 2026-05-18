import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminCategoryDto } from './dto/admin-category.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { ResponseCategoryDto } from './dto/response-category.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { CategoriesService } from './categories.service';

@Controller({
  path: 'category',
  version: '1',
})
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Category')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: ApiResponseDto<ResponseCategoryDto>,
  })
  @ApiBody({ type: CreateCategoryDto })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseCategoryDto>> {
    const userId = req.user.sub as string;
    await this.categoryService.create(createCategoryDto, userId);
    return new ApiResponseDto(201, 'Category created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'The categories have been successfully retrieved.',
    type: ApiResponseDto<ResponseCategoryDto[]>,
  })
  async findAll(): Promise<ApiResponseDto<ResponseCategoryDto[]>> {
    const response = await this.categoryService.findAll();
    return new ApiResponseDto(
      200,
      'Categories retrieved successfully',
      response,
    );
  }

  @Get('my-categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'The categories have been successfully retrieved.',
    type: ApiResponseDto<ResponseCategoryDto[]>,
  })
  async myCategories(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseCategoryDto[]>> {
    const userId = req.user.sub as string;
    const response = await this.categoryService.myCategories(userId);
    return new ApiResponseDto(
      200,
      'Categories retrieved successfully',
      response,
    );
  }

  @Get('admin')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all categories for admin' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: ResponseCategoryDto,
    isArray: true,
  })
  async getAdminCategories(): Promise<ApiResponseDto<ResponseCategoryDto[]>> {
    const categories = await this.categoryService.getAdminCategories();
    return new ApiResponseDto(
      200,
      'Categories retrieved successfully',
      categories,
    );
  }

  @Get('admin/deleted')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get deleted categories for admin' })
  @ApiResponse({
    status: 200,
    description: 'Deleted categories retrieved successfully',
    type: ResponseCategoryDto,
    isArray: true,
  })
  async getDeletedCategories(): Promise<ApiResponseDto<ResponseCategoryDto[]>> {
    const data = await this.categoryService.getDeletedCategories();
    return new ApiResponseDto(
      200,
      'Deleted categories retrieved successfully',
      data,
    );
  }

  @Delete('admin/:id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete category for admin' })
  async deleteAdminCategory(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.categoryService.deleteAdminCategory(id);
    return new ApiResponseDto(200, 'Category deleted successfully');
  }

  @Post('admin/:id/restore')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Restore a category for admin' })
  async restoreCategory(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.categoryService.restoreCategory(id);
    return new ApiResponseDto(200, 'Category restored successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully retrieved.',
    type: ApiResponseDto<ResponseCategoryDto>,
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ResponseCategoryDto>> {
    const response = await this.categoryService.findOne(id);
    return new ApiResponseDto(200, 'Category retrieved successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category ' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
    type: ApiResponseDto<ResponseCategoryDto>,
  })
  @ApiBody({ type: UpdateCategoryDto })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseCategoryDto>> {
    const userId = req.user.sub as string;
    await this.categoryService.update(id, userId, updateCategoryDto);
    return new ApiResponseDto(200, 'Category updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category by id' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
    type: ApiResponseDto<ResponseCategoryDto>,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<null>> {
    const userId = req.user.sub as string;
    await this.categoryService.remove(id, userId);
    return new ApiResponseDto(200, 'Category deleted successfully');
  }
}
