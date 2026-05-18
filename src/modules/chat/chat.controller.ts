import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetChatRoomsDto } from './dto/get-chat-rooms.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { GetUser } from '@decorators/auth/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ResponseChatRoomDto } from './dto/response-chat-room.dto';
import { ResponseChatMessageDto } from './dto/response-chat-message.dto';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { RolesGuard } from '@guards/roles-guard/roles.guard';

@ApiTags('Chat')
@ApiBearerAuth('Authorization')
@Controller({ path: 'chat', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Get or create chat room for user' })
  @ApiResponse({
    status: 200,
    description: 'Chat room retrieved/created',
    type: ResponseChatRoomDto,
  })
  async getOrCreateChatRoom(
    @GetUser() user: any,
  ) {
    const userId = user?.sub;
    const userRole = user?.role;
    return this.chatService.getOrCreateChatRoom(userId, userRole);
  }

  @Post('rooms/admin')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin creates/gets chat room with specific user' })
  @ApiResponse({
    status: 200,
    description: 'Chat room retrieved/created',
    type: ResponseChatRoomDto,
  })
  async adminCreateChatRoom(
    @GetUser() user: any,
    @Body() createChatRoomDto: CreateChatRoomDto,
  ) {
    const userId = user?.sub;
    const userRole = user?.role;
    return this.chatService.getOrCreateChatRoom(
      userId,
      userRole,
      createChatRoomDto.user_id,
    );
  }

  @Get('rooms')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin gets list of all chat rooms' })
  @ApiResponse({ status: 200, description: 'List of chat rooms' })
  async getChatRoomsForAdmin(@Query() filters: GetChatRoomsDto) {
    return this.chatService.getChatRoomsForAdmin(filters);
  }

  @Get('rooms/my')
  @ApiOperation({ summary: 'User gets their chat room' })
  @ApiResponse({
    status: 200,
    description: 'User chat room',
    type: ResponseChatRoomDto,
  })
  async getChatRoomForUser(@GetUser() user: any) {
    const userId = user?.sub;
    return this.chatService.getChatRoomForUser(userId);
  }

  @Get('rooms/:chatRoomId/messages')
  @ApiOperation({
    summary: 'Get messages in a chat room (supports infinite scroll)',
  })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('chatRoomId') chatRoomId: string,
    @GetUser() user: any,
    @Query() filters: GetMessagesDto,
  ) {
    const userId = user?.sub;
    const userRole = user?.role;
    return this.chatService.getMessages(chatRoomId, userId, userRole, filters);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent',
    type: ResponseChatMessageDto,
  })
  async sendMessage(
    @GetUser() user: any,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const userId = user?.sub;
    const userRole = user?.role;
    return this.chatService.sendMessage(userId, userRole, sendMessageDto);
  }

  @Post('messages/read')
  @ApiOperation({ summary: 'Mark messages as read in a chat room' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markMessagesAsRead(
    @GetUser() user: any,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    const userId = user?.sub;
    const userRole = user?.role;
    await this.chatService.markMessagesAsRead(
      markAsReadDto.chat_room_id,
      userId,
      userRole,
    );
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(
    @GetUser() user: any,
  ) {
    const userId = user?.sub;
    const userRole = user?.role;
    const count = await this.chatService.getUnreadCount(userId, userRole);
    return { count };
  }

  @Patch('rooms/:chatRoomId/close')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin closes a chat room' })
  @ApiResponse({
    status: 200,
    description: 'Chat room closed',
    type: ResponseChatRoomDto,
  })
  async closeChatRoom(@Param('chatRoomId') chatRoomId: string) {
    return this.chatService.closeChatRoom(chatRoomId);
  }

  @Patch('rooms/:chatRoomId/reopen')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin reopens a chat room' })
  @ApiResponse({
    status: 200,
    description: 'Chat room reopened',
    type: ResponseChatRoomDto,
  })
  async reopenChatRoom(@Param('chatRoomId') chatRoomId: string) {
    return this.chatService.reopenChatRoom(chatRoomId);
  }
}
