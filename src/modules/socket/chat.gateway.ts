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
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from '@modules/chat/chat.service';
import { OnEvent } from '@nestjs/event-emitter';
import { SendMessageDto } from '@modules/chat/dto/send-message.dto';
import { GetMessagesDto } from '@modules/chat/dto/get-messages.dto';
import { MarkAsReadDto } from '@modules/chat/dto/mark-as-read.dto';
import { RoleEnum } from 'src/enums/role.enum';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationType } from 'src/enums/notification.enum';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { SOCKET_ON_CHAT_MESSAGE } from '@constants/socket-on.constant';
import { SOCKET_EMIT_CHAT_MESSAGE } from '@constants/socket-emit.constant';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // log handshake
    this.logger.debug(client.handshake);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_CHAT_MESSAGE.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const userId = client?.data?.user?.sub as string;
      const userRole = client?.data?.user?.role as RoleEnum;

      const message = await this.chatService.sendMessage(
        userId,
        userRole,
        data,
      );

      return { event: SOCKET_EMIT_CHAT_MESSAGE.MESSAGE_SENT, data: message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.ERROR,
        data: { message: error.message || 'Failed to send message' },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_CHAT_MESSAGE.GET_MESSAGES)
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chat_room_id: string; filters?: GetMessagesDto },
  ) {
    try {
      const userId = client?.data?.user?.sub as string;
      const userRole = client?.data?.user?.role as RoleEnum;

      const messages = await this.chatService.getMessages(
        data.chat_room_id,
        userId,
        userRole,
        data.filters || {},
      );

      return { event: SOCKET_EMIT_CHAT_MESSAGE.MESSAGES_LIST, data: messages };
    } catch (error) {
      this.logger.error('Error getting messages:', error);
      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.ERROR,
        data: { message: error.message || 'Failed to get messages' },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_CHAT_MESSAGE.MARK_AS_READ)
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkAsReadDto,
  ) {
    try {
      const userId = client?.data?.user?.sub as string;
      const userRole = client?.data?.user?.role as RoleEnum;

      await this.chatService.markMessagesAsRead(
        data.chat_room_id,
        userId,
        userRole,
      );

      const unreadCount = await this.chatService.getUnreadCount(
        userId,
        userRole,
      );
      client.emit(SOCKET_EMIT_CHAT_MESSAGE.CHAT_UNREAD_COUNT, {
        count: unreadCount,
      });

      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.MARKED_AS_READ,
        data: { success: true },
      };
    } catch (error) {
      this.logger.error('Error marking as read:', error);
      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.ERROR,
        data: { message: error.message || 'Failed to mark as read' },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_CHAT_MESSAGE.TYPING)
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chat_room_id: string; is_typing: boolean },
  ) {
    try {
      const userId = client?.data?.user?.sub as string;
      const userRole = client?.data?.user?.role as RoleEnum;

      // Broadcast typing status to the other party
      const isAdmin = userRole === RoleEnum.ADMIN;

      // Notify the other party in the chat room
      this.server
        .to(`room_${data.chat_room_id}`)
        .emit(SOCKET_EMIT_CHAT_MESSAGE.USER_TYPING, {
          userId,
          isAdmin,
          is_typing: data.is_typing,
        });

      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.TYPING_SENT,
        data: { success: true },
      };
    } catch (error) {
      this.logger.error('Error handling typing:', error);
      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.ERROR,
        data: { message: 'Failed to send typing status' },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_CHAT_MESSAGE.JOIN_CHAT_ROOM)
  handleJoinChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chat_room_id: string },
  ) {
    try {
      const userId = client?.data?.user?.sub as string;
      const userRole = client?.data?.user?.role as RoleEnum;

      void client.join(`user_${userId}`);
      void client.join(`room_${data.chat_room_id}`);

      // Admin joins admin room
      if (userRole === RoleEnum.ADMIN || userRole === RoleEnum.SUPER_ADMIN) {
        void client.join('admin_room');
        this.logger.log(`Admin ${userId} joined admin room`);
      }

      this.logger.log(
        `User ${userId} joined room user_${userId} and room_${data.chat_room_id}`,
      );

      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.JOINED_ROOM,
        data: { chat_room_id: data.chat_room_id },
      };
    } catch (error) {
      this.logger.error('Error joining room:', error);
      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.ERROR,
        data: { message: 'Failed to join room' },
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_CHAT_MESSAGE.LEAVE_CHAT_ROOM)
  handleLeaveChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chat_room_id: string },
  ) {
    try {
      void client.leave(`room_${data.chat_room_id}`);
      this.logger.log(`Client ${client.id} left room ${data.chat_room_id}`);

      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.LEFT_ROOM,
        data: { chat_room_id: data.chat_room_id },
      };
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      return {
        event: SOCKET_EMIT_CHAT_MESSAGE.ERROR,
        data: { message: 'Failed to leave room' },
      };
    }
  }

  @OnEvent('chat.message.sent')
  async handleMessageSent(payload: {
    message: any;
    chatRoom: any;
    isFromAdmin: boolean;
  }) {
    try {
      const { message, chatRoom, isFromAdmin } = payload;

      // Send to chat room
      this.server
        .to(`room_${chatRoom.id}`)
        .emit(SOCKET_EMIT_CHAT_MESSAGE.NEW_MESSAGE, message);

      // Send to specific user
      if (isFromAdmin) {
        // Admin sent message to user
        this.server
          .to(`user_${chatRoom.user_id}`)
          .emit(SOCKET_EMIT_CHAT_MESSAGE.NEW_MESSAGE, message);

        // Send notification to user
        await this.notificationsService.createFromEvent(
          chatRoom.user_id as string,
          'New message from Support',
          message.content.substring(0, 100) as string,
          NotificationType.CHAT,
          `/chat/${chatRoom.id as string}`,
          { chat_room_id: chatRoom.id, message_id: message.id },
        );

        // Update unread count for user
        const userUnreadCount = await this.chatService.getUnreadCount(
          chatRoom.user_id as string,
          RoleEnum.USER,
        );
        this.server
          .to(`user_${chatRoom.user_id}`)
          .emit(SOCKET_EMIT_CHAT_MESSAGE.CHAT_UNREAD_COUNT, {
            count: userUnreadCount,
          });
      } else {
        // User sent message to admin
        this.server
          .to('admin_room')
          .emit(SOCKET_EMIT_CHAT_MESSAGE.NEW_MESSAGE, message);

        // Send notification to admin
        if (chatRoom.admin_id) {
          await this.notificationsService.createFromEvent(
            chatRoom.admin_id as string,
            `New message from ${chatRoom.user?.firstName || 'User'}`,
            message.content.substring(0, 100) as string,
            NotificationType.CHAT,
            `/admin/chat/${chatRoom.id as string}`,
            { chat_room_id: chatRoom.id, message_id: message.id },
          );

          // Update unread count for admin
          const adminUnreadCount = await this.chatService.getUnreadCount(
            chatRoom.admin_id as string,
            RoleEnum.ADMIN,
          );
          this.server
            .to(`user_${chatRoom.admin_id}`)
            .emit(SOCKET_EMIT_CHAT_MESSAGE.CHAT_UNREAD_COUNT, {
              count: adminUnreadCount,
            });
        }
      }

      this.logger.log(
        `Message sent in room ${chatRoom.id} by ${message.sender_id}`,
      );
    } catch (error) {
      this.logger.error('Error handling message sent event:', error);
    }
  }

  @OnEvent('chat.messages.read')
  handleMessagesRead(payload: {
    chatRoomId: string;
    userId: string;
    isAdmin: boolean;
  }) {
    try {
      // Notify the other party that messages were read
      this.server
        .to(`room_${payload.chatRoomId}`)
        .emit(SOCKET_EMIT_CHAT_MESSAGE.MESSAGES_READ, {
          userId: payload.userId,
          isAdmin: payload.isAdmin,
        });

      this.logger.log(
        `Messages marked as read in room ${payload.chatRoomId} by user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error('Error handling messages read event:', error);
    }
  }

  // Helper method to send notification to user
  sendNotificationToUser(userId: string, notification: any) {
    this.server
      .to(`user_${userId}`)
      .emit(SOCKET_EMIT_CHAT_MESSAGE.NEW_NOTIFICATION, notification);
  }
}
