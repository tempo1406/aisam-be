import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ResponseChatRoomDto } from './dto/response-chat-room.dto';
import { ResponseChatMessageDto } from './dto/response-chat-message.dto';
import { GetChatRoomsDto } from './dto/get-chat-rooms.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatRoomStatus, MessageStatus } from 'src/enums/chat.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoleEnum } from 'src/enums/role.enum';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Tạo hoặc lấy chat room cho user
  async getOrCreateChatRoom(
    userId: string,
    userRole: RoleEnum,
    targetUserId?: string,
  ): Promise<ResponseChatRoomDto> {
    try {
      let chatRoom: ChatRoom;

      if (userRole === RoleEnum.ADMIN || userRole === RoleEnum.SUPER_ADMIN) {
        // Admin tạo chat với user cụ thể
        if (!targetUserId) {
          throw new BadRequestException('Target user ID is required for admin');
        }

        let foundChatRoom = await this.chatRoomRepository.findOne({
          where: { user_id: targetUserId },
          relations: ['user', 'admin'],
        });

        if (!foundChatRoom) {
          const newChatRoom = this.chatRoomRepository.create({
            user_id: targetUserId,
            admin_id: userId,
            status: ChatRoomStatus.ACTIVE,
          });
          await this.chatRoomRepository.save(newChatRoom);

          // Load relations
          foundChatRoom = await this.chatRoomRepository.findOne({
            where: { id: newChatRoom.id },
            relations: ['user', 'admin'],
          });

          if (!foundChatRoom) {
            throw new BadRequestException('Failed to create chat room');
          }
          chatRoom = foundChatRoom;
        } else {
          if (!foundChatRoom.admin_id) {
            // Assign admin to existing room
            foundChatRoom.admin_id = userId;
            await this.chatRoomRepository.save(foundChatRoom);
          }
          chatRoom = foundChatRoom;
        }
      } else {
        // User tạo hoặc lấy chat room của mình
        let foundChatRoom = await this.chatRoomRepository.findOne({
          where: { user_id: userId },
          relations: ['user', 'admin'],
        });

        if (!foundChatRoom) {
          const newChatRoom = this.chatRoomRepository.create({
            user_id: userId,
            status: ChatRoomStatus.ACTIVE,
          });
          await this.chatRoomRepository.save(newChatRoom);

          // Load relations
          foundChatRoom = await this.chatRoomRepository.findOne({
            where: { id: newChatRoom.id },
            relations: ['user', 'admin'],
          });

          if (!foundChatRoom) {
            throw new BadRequestException('Failed to create chat room');
          }
          chatRoom = foundChatRoom;
        } else {
          chatRoom = foundChatRoom;
        }
      }

      // Get last message
      const lastMessage = await this.chatMessageRepository.findOne({
        where: { chat_room_id: chatRoom.id },
        order: { created_at: 'DESC' },
      });

      const result = plainToInstance(ResponseChatRoomDto, chatRoom);
      if (lastMessage) {
        result.last_message = lastMessage.content;
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting or creating chat room:', error);
      throw error;
    }
  }

  // Admin lấy danh sách chat rooms
  async getChatRoomsForAdmin(filters: GetChatRoomsDto): Promise<{
    data: ResponseChatRoomDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    try {
      const { page = 1, limit = 20, status, search } = filters;
      const skip = (page - 1) * limit;

      const queryBuilder = this.chatRoomRepository
        .createQueryBuilder('chat_room')
        .leftJoinAndSelect('chat_room.user', 'user')
        .leftJoinAndSelect('chat_room.admin', 'admin')
        .orderBy('chat_room.last_message_at', 'DESC')
        .addOrderBy('chat_room.created_at', 'DESC');

      if (status) {
        queryBuilder.andWhere('chat_room.status = :status', { status });
      }

      if (search) {
        queryBuilder.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const [chatRooms, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      // Get last message for each room
      const roomsWithMessages = await Promise.all(
        chatRooms.map(async (room) => {
          const lastMessage = await this.chatMessageRepository.findOne({
            where: { chat_room_id: room.id },
            order: { created_at: 'DESC' },
          });

          const roomDto = plainToInstance(ResponseChatRoomDto, room);
          if (lastMessage) {
            roomDto.last_message = lastMessage.content;
          }
          return roomDto;
        }),
      );

      return {
        data: roomsWithMessages,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error getting chat rooms for admin:', error);
      throw error;
    }
  }

  // User lấy chat room của mình
  async getChatRoomForUser(
    userId: string,
  ): Promise<ResponseChatRoomDto | null> {
    try {
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { user_id: userId },
        relations: ['user', 'admin'],
      });

      if (!chatRoom) {
        return null;
      }

      const lastMessage = await this.chatMessageRepository.findOne({
        where: { chat_room_id: chatRoom.id },
        order: { created_at: 'DESC' },
      });

      const result = plainToInstance(ResponseChatRoomDto, chatRoom);
      if (lastMessage) {
        result.last_message = lastMessage.content;
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting chat room for user:', error);
      throw error;
    }
  }

  // Lấy messages của một chat room (hỗ trợ infinite scroll)
  async getMessages(
    chatRoomId: string,
    userId: string,
    userRole: RoleEnum,
    filters: GetMessagesDto,
  ): Promise<{
    data: ResponseChatMessageDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
      nextCursor?: string;
    };
  }> {
    try {
      // Verify access
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chatRoomId },
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      // Check permissions
      const isAdmin =
        userRole === RoleEnum.ADMIN || userRole === RoleEnum.SUPER_ADMIN;
      if (!isAdmin && chatRoom.user_id !== userId) {
        throw new BadRequestException(
          'You do not have access to this chat room',
        );
      }

      const { page = 1, limit = 50, cursor } = filters;

      const queryBuilder = this.chatMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('message.chat_room_id = :chatRoomId', { chatRoomId })
        .orderBy('message.created_at', 'DESC');

      // Cursor-based pagination for infinite scroll
      if (cursor) {
        const cursorMessage = await this.chatMessageRepository.findOne({
          where: { id: cursor },
        });
        if (cursorMessage) {
          queryBuilder.andWhere('message.created_at < :cursorDate', {
            cursorDate: cursorMessage.created_at,
          });
        }
      } else {
        // Regular pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip);
      }

      const messages = await queryBuilder.take(limit + 1).getMany();

      const hasMore = messages.length > limit;
      const data = messages.slice(0, limit);
      const nextCursor = hasMore ? data[data.length - 1].id : undefined;

      const total = await this.chatMessageRepository.count({
        where: { chat_room_id: chatRoomId },
      });

      return {
        data: plainToInstance(ResponseChatMessageDto, data),
        meta: {
          page,
          limit,
          total,
          hasMore,
          nextCursor,
        },
      };
    } catch (error) {
      this.logger.error('Error getting messages:', error);
      throw error;
    }
  }

  // Gửi message
  async sendMessage(
    userId: string,
    userRole: RoleEnum,
    sendMessageDto: SendMessageDto,
  ): Promise<ResponseChatMessageDto> {
    try {
      const { chat_room_id, content, message_type, metadata } = sendMessageDto;

      // Verify chat room exists
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chat_room_id },
        relations: ['user', 'admin'],
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      // Check permissions
      const isAdmin =
        userRole === RoleEnum.ADMIN || userRole === RoleEnum.SUPER_ADMIN;
      if (!isAdmin && chatRoom.user_id !== userId) {
        throw new BadRequestException(
          'You do not have access to this chat room',
        );
      }

      // Create message
      const message = this.chatMessageRepository.create({
        chat_room_id,
        sender_id: userId,
        content,
        message_type,
        metadata,
        status: MessageStatus.SENT,
      });

      const savedMessage = await this.chatMessageRepository.save(message);

      // Update chat room
      chatRoom.last_message_at = new Date();

      // Update unread count
      if (isAdmin) {
        chatRoom.unread_count_user += 1;
      } else {
        chatRoom.unread_count_admin += 1;
      }

      await this.chatRoomRepository.save(chatRoom);

      // Load sender relation
      const messageWithSender = await this.chatMessageRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['sender'],
      });

      // Emit event for real-time update
      this.eventEmitter.emit('chat.message.sent', {
        message: messageWithSender,
        chatRoom,
        isFromAdmin: isAdmin,
      });

      return plainToInstance(ResponseChatMessageDto, messageWithSender);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(
    chatRoomId: string,
    userId: string,
    userRole: RoleEnum,
  ): Promise<void> {
    try {
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chatRoomId },
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      const isAdmin =
        userRole === RoleEnum.ADMIN || userRole === RoleEnum.SUPER_ADMIN;

      // Update unread messages
      await this.chatMessageRepository
        .createQueryBuilder()
        .update(ChatMessage)
        .set({
          status: MessageStatus.READ,
          read_at: new Date(),
        })
        .where('chat_room_id = :chatRoomId', { chatRoomId })
        .andWhere('sender_id != :userId', { userId })
        .andWhere('status != :readStatus', { readStatus: MessageStatus.READ })
        .execute();

      // Reset unread count
      if (isAdmin) {
        chatRoom.unread_count_admin = 0;
      } else {
        chatRoom.unread_count_user = 0;
      }

      await this.chatRoomRepository.save(chatRoom);

      // Emit event
      this.eventEmitter.emit('chat.messages.read', {
        chatRoomId,
        userId,
        isAdmin,
      });
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId: string, userRole: RoleEnum): Promise<number> {
    try {
      const isAdmin =
        userRole === RoleEnum.ADMIN || userRole === RoleEnum.SUPER_ADMIN;

      if (isAdmin) {
        // Count all admin unread messages
        const result = await this.chatRoomRepository
          .createQueryBuilder('chat_room')
          .select('SUM(chat_room.unread_count_admin)', 'total')
          .where('chat_room.admin_id = :userId OR chat_room.admin_id IS NULL', {
            userId,
          })
          .getRawOne();

        return parseInt(result?.total || '0');
      } else {
        // Count user's unread messages
        const chatRoom = await this.chatRoomRepository.findOne({
          where: { user_id: userId },
        });

        return chatRoom?.unread_count_user || 0;
      }
    } catch (error) {
      this.logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Close chat room (admin only)
  async closeChatRoom(chatRoomId: string): Promise<ResponseChatRoomDto> {
    try {
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chatRoomId },
        relations: ['user', 'admin'],
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      chatRoom.status = ChatRoomStatus.CLOSED;
      const updatedRoom = await this.chatRoomRepository.save(chatRoom);

      return plainToInstance(ResponseChatRoomDto, updatedRoom);
    } catch (error) {
      this.logger.error('Error closing chat room:', error);
      throw error;
    }
  }

  // Reopen chat room
  async reopenChatRoom(chatRoomId: string): Promise<ResponseChatRoomDto> {
    try {
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: chatRoomId },
        relations: ['user', 'admin'],
      });

      if (!chatRoom) {
        throw new NotFoundException('Chat room not found');
      }

      chatRoom.status = ChatRoomStatus.ACTIVE;
      const updatedRoom = await this.chatRoomRepository.save(chatRoom);

      return plainToInstance(ResponseChatRoomDto, updatedRoom);
    } catch (error) {
      this.logger.error('Error reopening chat room:', error);
      throw error;
    }
  }
}
