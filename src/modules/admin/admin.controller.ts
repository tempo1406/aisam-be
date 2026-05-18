import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { AdminService } from './admin.service';
import { AdminDashboardDto } from './dto/admin.dto';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
@ApiBearerAuth('Authorization')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
    type: ApiResponseDto<AdminDashboardDto>,
  })
  async getDashboard(): Promise<ApiResponseDto<AdminDashboardDto>> {
    const dashboard = await this.adminService.getDashboard();
    return new ApiResponseDto(
      HttpStatus.OK,
      'Dashboard data retrieved successfully',
      dashboard,
    );
  }
}
