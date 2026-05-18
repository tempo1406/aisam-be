import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AISAM_PAYMENT_SERVICE_CALLBACK_PATTERN } from '@constants/aisam-rabbitmq.constant';
import { SubscriptionsService } from '@modules/subscriptions/subscriptions.service';
import { PaymentStatus } from 'src/enums/payment.enum';
import { PaymentSocketGateway } from '@modules/socket/payment-socket.gateway';
import { SOCKET_EMIT_PAYMENT_MESSAGE } from '@constants/socket-emit.constant';

@Controller({
  path: 'payment',
  version: '1',
})
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentSocketGateway: PaymentSocketGateway,
  ) {}

  @MessagePattern(AISAM_PAYMENT_SERVICE_CALLBACK_PATTERN.PAYMENT_CALLBACK)
  async handlePaymentCallback(
    @Payload()
    data: {
      paymentId: string;
      orderId: number;
      userId: string;
      status: PaymentStatus;
      amount: number;
      metadata: {
        subscriptionId?: number;
      };
    },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Received payment callback: ${data.orderId} - ${data.status}`,
    );

    try {
      if (
        data.status === PaymentStatus.SUCCESS &&
        data.metadata?.subscriptionId
      ) {
        // Activate subscription
        this.logger.log(
          ` Activating subscription: ${data.metadata.subscriptionId}`,
        );
        const subscription =
          await this.subscriptionsService.activateSubscription(
            data.metadata.subscriptionId,
          );

        // Emit socket event: Payment success
        this.paymentSocketGateway.sendResponsePaymentToUser(
          data.userId,
          {
            paymentId: data.paymentId,
            subscriptionId: data.metadata.subscriptionId,
            subscription,
            amount: data.amount,
            status: 'success',
            message: 'Payment successful! Your subscription is now active.',
          },
          SOCKET_EMIT_PAYMENT_MESSAGE.PAYMENT_SUCCESS,
        );
        this.logger.log(
          `Payment success notification sent to user ${data.userId}`,
        );
      } else if (
        data.status === PaymentStatus.FAILED &&
        data.metadata?.subscriptionId
      ) {
        // Cancel subscription
        this.logger.log(`Cancel subscription: ${data.metadata.subscriptionId}`);
        await this.subscriptionsService.cancelSubscription(
          data.metadata.subscriptionId,
        );

        //  Emit socket event: Payment failed
        this.paymentSocketGateway.sendResponsePaymentToUser(
          data.userId,
          {
            paymentId: data.paymentId,
            subscriptionId: data.metadata.subscriptionId,
            amount: data.amount,
            status: 'failed',
            message: 'Payment failed. Please try again.',
          },
          SOCKET_EMIT_PAYMENT_MESSAGE.PAYMENT_ERROR,
        );
        this.logger.log(
          `Payment failed notification sent to user ${data.userId}`,
        );
      }

      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);

      return { received: true, processed: true };
    } catch (error) {
      this.logger.error(`Failed to process callback: ${error.message}`);
      throw error;
    }
  }
}
