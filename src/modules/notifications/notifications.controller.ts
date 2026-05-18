import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ResponseNotificationDto } from './dto/response-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';

@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ==================== USER ENDPOINTS ====================
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user notifications with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    type: ResponseNotificationDto,
    isArray: true,
  })
  async getMyNotifications(
    @Req() req: any,
    @Query() filters: GetNotificationsDto,
  ): Promise<ApiResponseDto<{
    notifications: ResponseNotificationDto[];
    total: number;
    unreadCount: number;
  }>> {
    const userId = req.user.sub as string;
    const data = await this.notificationsService.findAllByUserId(userId, filters);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Notifications retrieved successfully',
      data,
    );
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(
    @Req() req: any,
  ): Promise<ApiResponseDto<{ count: number }>> {
    const userId = req.user.sub as string;
    const count = await this.notificationsService.getUnreadCount(userId);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Unread count retrieved successfully',
      { count },
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    type: ResponseNotificationDto,
  })
  async getNotification(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseNotificationDto>> {
    const userId = req.user.sub as string;
    const notification = await this.notificationsService.findOne(id, userId);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Notification retrieved successfully',
      notification,
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification status' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification status updated successfully',
    type: ResponseNotificationDto,
  })
  async updateNotificationStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateNotificationStatusDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseNotificationDto>> {
    const userId = req.user.sub as string;
    const notification = await this.notificationsService.updateStatus(
      id,
      userId,
      updateStatusDto,
    );
    return new ApiResponseDto(
      HttpStatus.OK,
      'Notification status updated successfully',
      notification,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read successfully',
    type: ResponseNotificationDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseNotificationDto>> {
    const userId = req.user.sub as string;
    const notification = await this.notificationsService.markAsRead(id, userId);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Notification marked as read successfully',
      notification,
    );
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read successfully',
  })
  async markAllAsRead(
    @Req() req: any,
  ): Promise<ApiResponseDto<void>> {
    const userId = req.user.sub as string;
    await this.notificationsService.markAllAsRead(userId);
    return new ApiResponseDto(
      HttpStatus.OK,
      'All notifications marked as read successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ApiResponseDto<void>> {
    const userId = req.user.sub as string;
    await this.notificationsService.remove(id, userId);
    return new ApiResponseDto(
      HttpStatus.OK,
      'Notification deleted successfully',
    );
  }
}