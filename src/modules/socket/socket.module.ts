import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { PaymentSocketGateway } from './payment-socket.gateway';
import { NotificationsGateway } from './notifications.gateway';
import { ChatGateway } from './chat.gateway';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { ChatModule } from '@modules/chat/chat.module';

@Module({
  imports: [
    CacheModule.register(),
    JwtModule,
    NotificationsModule,
    forwardRef(() => ChatModule),
  ],
  providers: [PaymentSocketGateway, NotificationsGateway, ChatGateway],
  exports: [PaymentSocketGateway, NotificationsGateway, ChatGateway],
})
export class SocketModule {}
