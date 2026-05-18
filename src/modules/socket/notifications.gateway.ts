import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      const userSocketIds = this.userSockets.get(userId) || [];
      userSocketIds.push(client.id);
      this.userSockets.set(userId, userSocketIds);

      client.join(`user:${userId}`);
      client.data.userId = userId;

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      const unreadCount =
        await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const userSocketIds = this.userSockets.get(userId) || [];
      const filteredSockets = userSocketIds.filter((id) => id !== client.id);

      if (filteredSockets.length > 0) {
        this.userSockets.set(userId, filteredSockets);
      } else {
        this.userSockets.delete(userId);
      }

      this.logger.log(`Client ${client.id} disconnected from user ${userId}`);
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { page?: number; limit?: number },
  ) {
    try {
      const userId = client.data.userId;
      const notifications = await this.notificationsService.findAllByUserId(
        userId,
        {
          page: data.page || 1,
          limit: data.limit || 10,
        },
      );

      return { event: 'notifications_list', data: notifications };
    } catch (error) {
      this.logger.error('Error getting notifications:', error);
      return {
        event: 'error',
        data: { message: 'Failed to get notifications' },
      };
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const userId = client.data.userId;
      await this.notificationsService.markAsRead(data.notificationId, userId);

      const unreadCount =
        await this.notificationsService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });

      return { event: 'marked_as_read', data: { success: true } };
    } catch (error) {
      this.logger.error('Error marking as read:', error);
      return { event: 'error', data: { message: 'Failed to mark as read' } };
    }
  }

  @SubscribeMessage('mark_all_as_read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      await this.notificationsService.markAllAsRead(userId);

      client.emit('unread_count', { count: 0 });

      return { event: 'marked_all_as_read', data: { success: true } };
    } catch (error) {
      this.logger.error('Error marking all as read:', error);
      return {
        event: 'error',
        data: { message: 'Failed to mark all as read' },
      };
    }
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: string; notification: any }) {
    try {
      this.server
        .to(`user:${payload.userId}`)
        .emit('new_notification', payload.notification);

      this.notificationsService.getUnreadCount(payload.userId).then((count) => {
        this.server
          .to(`user:${payload.userId}`)
          .emit('unread_count', { count });
      });

      this.logger.log(
        `Sent notification to user ${payload.userId} via WebSocket`,
      );
    } catch (error) {
      this.logger.error('Error sending notification via WebSocket:', error);
    }
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }
}
