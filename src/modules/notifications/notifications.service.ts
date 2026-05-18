import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Notification } from './entities/notification.entity';
import { ResponseNotificationDto } from './dto/response-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationStatusDto } from './dto/update-notification-status.dto';
import {
  NotificationStatus,
  NotificationType,
} from '../../enums/notification.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '@modules/cache/cache.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
  ) {}

  async createFromEvent(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    actionUrl?: string,
    metadata?: Record<string, any>,
  ): Promise<ResponseNotificationDto | null> {
    try {
      if (!userId || !title || !message) {
        return null;
      }

      const notification = this.notificationRepository.create({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
        metadata,
        status: NotificationStatus.UNREAD,
      });

      const savedNotification =
        await this.notificationRepository.save(notification);

      this.eventEmitter.emit('notification.created', {
        userId: savedNotification.user_id,
        notification: savedNotification,
      });

      await this.clearUserNotificationCache(savedNotification.user_id);

      return plainToInstance(ResponseNotificationDto, savedNotification);
    } catch (error) {
      console.error('Failed to create notification:', error.message);
      return null;
    }
  }

  async findAllByUserId(
    userId: string,
    filters: GetNotificationsDto,
  ): Promise<{
    notifications: ResponseNotificationDto[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const { page = 1, limit = 10, type, status, search } = filters;
      const skip = (page - 1) * limit;

      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.user_id = :userId', { userId });

      if (type) {
        queryBuilder.andWhere('notification.type = :type', { type });
      }

      if (status) {
        queryBuilder.andWhere('notification.status = :status', { status });
      }

      if (search) {
        queryBuilder.andWhere(
          '(notification.title ILIKE :search OR notification.message ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const total = await queryBuilder.getCount();

      const notifications = await queryBuilder
        .orderBy('notification.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      // Get unread count
      const unreadCount = await this.notificationRepository.count({
        where: {
          user_id: userId,
          status: NotificationStatus.UNREAD,
        },
      });

      return {
        notifications: plainToInstance(ResponseNotificationDto, notifications),
        total,
        unreadCount,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<ResponseNotificationDto> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return plainToInstance(ResponseNotificationDto, notification);
    } catch (error) {
      console.error('Error finding notification:', error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateNotificationStatusDto,
  ): Promise<ResponseNotificationDto> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      notification.status = updateStatusDto.status;

      if (
        updateStatusDto.status === NotificationStatus.READ &&
        !notification.read_at
      ) {
        notification.read_at = new Date();
      }

      const updatedNotification =
        await this.notificationRepository.save(notification);

      await this.clearUserNotificationCache(userId);

      return plainToInstance(ResponseNotificationDto, updatedNotification);
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }

  async markAsRead(
    id: string,
    userId: string,
  ): Promise<ResponseNotificationDto> {
    return this.updateStatus(id, userId, { status: NotificationStatus.READ });
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.update(
        {
          user_id: userId,
          status: NotificationStatus.UNREAD,
        },
        {
          status: NotificationStatus.READ,
          read_at: new Date(),
        },
      );

      await this.clearUserNotificationCache(userId);
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      await this.notificationRepository.remove(notification);

      await this.clearUserNotificationCache(userId);
    } catch (error) {
      console.error('Error removing notification:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const cacheKey = `notifications:unread_count:${userId}`;

      const cachedCount = await this.cacheService.get(cacheKey);
      if (cachedCount !== null && cachedCount !== undefined) {
        return parseInt(cachedCount.toString());
      }

      const count = await this.notificationRepository.count({
        where: {
          user_id: userId,
          status: NotificationStatus.UNREAD,
        },
      });

      await this.cacheService.set(cacheKey, count.toString(), 300);

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    actionUrl?: string,
    metadata?: any,
  ): Promise<ResponseNotificationDto | null> {
    return this.createFromEvent(
      userId,
      title,
      message,
      type,
      actionUrl,
      metadata,
    );
  }

  private async clearUserNotificationCache(userId: string): Promise<void> {
    const cacheKey = `notifications:unread_count:${userId}`;
    await this.cacheService.del(cacheKey);
  }
}
