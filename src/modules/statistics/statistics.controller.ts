import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { GetFacebookStatisticsDto } from './dto/get-facebook-statistics.dto';
import { GetInstagramStatisticsDto } from './dto/get-instagram-statistics.dto';
import { FacebookStatisticsResponseDto } from './dto/facebook-statistics-response.dto';
import { InstagramStatisticsResponseDto } from './dto/instagram-statistics-response.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';

@ApiTags('Statistics')
@Controller({
  path: 'statistics',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get Facebook post statistics for a social account',
    description: 'Retrieve detailed statistics for Facebook posts including likes, comments, shares, and engagement metrics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Facebook statistics retrieved successfully',
    type: FacebookStatisticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Social account not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or expired token',
  })
  async getFacebookStatistics(
    @Req() req: any,
    @Query() dto: GetFacebookStatisticsDto,
  ): Promise<ApiResponseDto<FacebookStatisticsResponseDto>> {
    const userId = req.user.sub as string;
    const statistics = await this.statisticsService.getFacebookStatistics(userId, dto);
    
    return new ApiResponseDto(
      HttpStatus.OK,
      'Facebook statistics retrieved successfully',
      statistics,
    );
  }

  @Get('instagram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get Instagram media statistics for a social account',
    description: 'Retrieve detailed statistics for Instagram media including likes, comments, impressions, reach, and engagement metrics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Instagram statistics retrieved successfully',
    type: InstagramStatisticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Social account not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or expired token',
  })
  async getInstagramStatistics(
    @Req() req: any,
    @Query() dto: GetInstagramStatisticsDto,
  ): Promise<ApiResponseDto<InstagramStatisticsResponseDto>> {
    const userId = req.user.sub as string;
    const statistics = await this.statisticsService.getInstagramStatistics(userId, dto);
    
    return new ApiResponseDto(
      HttpStatus.OK,
      'Instagram statistics retrieved successfully',
      statistics,
    );
  }
}
