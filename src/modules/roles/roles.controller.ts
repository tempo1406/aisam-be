import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { ResponseRoleDto } from './dto/response-role.dto';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';

@ApiBearerAuth('Authorization')
@Controller({ path: 'roles', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
@ApiTags('Roles (Admin)')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'The role has been successfully created.',
    type: ApiResponseDto<ResponseRoleDto>,
  })
  @ApiBody({ type: CreateRoleDto })
  async create(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<ApiResponseDto<ResponseRoleDto>> {
    await this.rolesService.create(createRoleDto);
    return new ApiResponseDto(201, 'Role created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'The roles have been successfully retrieved.',
    type: ApiResponseDto<ResponseRoleDto[]>,
  })
  async findAll(): Promise<ApiResponseDto<ResponseRoleDto[]>> {
    const response = await this.rolesService.findAll();
    return new ApiResponseDto(200, 'Roles retrieved successfully', response);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully retrieved.',
    type: ApiResponseDto<ResponseRoleDto>,
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ApiResponseDto<ResponseRoleDto>> {
    const response = await this.rolesService.findOne(id);
    return new ApiResponseDto(200, 'Role retrieved successfully', response);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a role by id' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully updated.',
    type: ApiResponseDto<ResponseRoleDto>,
  })
  @ApiBody({ type: UpdateRoleDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<ApiResponseDto<ResponseRoleDto>> {
    await this.rolesService.update(id, updateRoleDto);
    return new ApiResponseDto(200, 'Role updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role by id' })
  @ApiResponse({
    status: 200,
    description: 'The role has been successfully deleted.',
    type: ApiResponseDto<ResponseRoleDto>,
  })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ApiResponseDto<ResponseRoleDto>> {
    await this.rolesService.remove(id);
    return new ApiResponseDto(200, 'Role deleted successfully');
  }
}
