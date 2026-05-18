import { SOCKET_EMIT_PAYMENT_MESSAGE } from '@constants/socket-emit.constant';
import { SOCKET_ON_PAYMENT_MESSAGE } from '@constants/socket-on.constant';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/payment',
})
export class PaymentSocketGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PaymentSocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // log handshake
    this.logger.debug(client.handshake);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage(SOCKET_ON_PAYMENT_MESSAGE.JOIN_ROOM)
  handleJoinRoom(@ConnectedSocket() client: Socket) {
    const userId = client?.data?.user?.sub as string;
    void client.join(`user_${userId}`);
    this.logger.log(`User ${userId} joined payment room user_${userId}`);
    client.emit(
      SOCKET_EMIT_PAYMENT_MESSAGE.JOIN_ROOM,
      'Joined payment room successfully',
    );
  }

  sendResponsePaymentToUser(userId: string, data: any, event: string) {
    // Emit to room instead of specific socketId for better reliability
    this.logger.log(
      `Sending payment response to user ${userId} in room user_${userId}`,
    );
    this.server.to(`user_${userId}`).emit(event, data);
  }
}
