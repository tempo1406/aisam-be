import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Body,
  UseInterceptors,
  Logger,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { ResponseSubscriptionDto } from './dto/response-subscription.dto';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@guards/jwt-guard/jwt.guard';
import { RolesGuard } from '@guards/roles-guard/roles.guard';
import { CreatePurchaseSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentService } from '@modules/payment/payment.service';
import { AISAM_PROJECT_ID } from '@constants/aisam-rabbitmq.constant';
import { CreatePayosResponseDto } from '@modules/payment/dto/payos-response.dto';
import { IdempotencyInterceptor } from 'src/interceptors/indempotency.interceptor';
import { IdempotencyGuard } from '@guards/idempotency/idempotency.guard';
import { CacheService } from '@modules/cache/cache.service';
import { ValidationException } from '@exceptions/validation.exception';
import { ErrorCode } from '@constants/error-code.constant';
import { Roles } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';
import { AdminSubscriptionQueryDto } from './dto/admin-subscription-query.dto';
import { RevenueStatisticsDto } from './dto/subscription-revenue.dto';

@ApiTags('Subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('Authorization')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentService: PaymentService,
    private readonly cacheService: CacheService,
  ) {}

  @Post('purchase')
  @UseGuards(IdempotencyGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({
    name: 'idempotency-key',
    required: false,
    description:
      'Optional idempotency key. If not provided, system will auto-generate based on user and request body',
  })
  @ApiOperation({ summary: 'Purchase a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription purchased successfully',
    type: ApiResponseDto<ResponseSubscriptionDto>,
  })
  async createPurchaseSubscription(
    @Body() createPurchaseSubscriptionDto: CreatePurchaseSubscriptionDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<CreatePayosResponseDto>> {
    const user_id = req.user.sub as string;
    let subscription: any = null;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    this.logger.log(
      ` Processing purchase with idempotency key: ${idempotencyKey}`,
    );

    try {
      // 1. Create subscription (PENDING)
      subscription = await this.subscriptionsService.create(
        user_id,
        createPurchaseSubscriptionDto,
      );
      this.logger.log(`Subscription created: ${JSON.stringify(subscription)}`);

      // 2. Create payment via RabbitMQ
      const payment = await this.paymentService.createPayment({
        orderId: subscription.id,
        userId: user_id,
        projectId: AISAM_PROJECT_ID,
        amount: subscription.plan?.price ?? 0,
        description: `Payment for ${subscription.plan?.name}`,
        metadata: {
          subscriptionId: subscription.id,
          idempotencyKey, // Pass key to payment service
        },
      });

      this.logger.log(`Payment created: ${payment.paymentId}`);

      return new ApiResponseDto(
        200,
        'Subscription purchased successfully',
        payment,
      );
    } catch (error) {
      this.logger.error(`Purchase failed: ${error.message}`);

      // CLEANUP: Cancel subscription if payment creation failed
      if (subscription?.id) {
        this.logger.warn(
          `Cancelling subscription ${subscription.id} due to payment failure`,
        );
        try {
          await this.subscriptionsService.cancelSubscription(
            subscription.id as number,
          );
        } catch (cancelError) {
          this.logger.error(
            `Failed to cancel subscription ${subscription.id}: ${cancelError.message}`,
          );
        }
      }

      // 1. ValidationException
      if (
        error instanceof ValidationException &&
        (error as any)?.getResponse?.()?.errorCode !== ErrorCode.S007
      ) {
        this.logger.warn(
          `Validation error: ${
            (error as any)?.getResponse?.()?.errorCode ?? 'Unknown'
          }`,
        );
        throw error;
      }
      // 2. Server/Payment errors -> Rollback & throw 500
      // ROLLBACK: Cancel subscription nếu đã tạo và đang PENDING
      if (
        error instanceof ValidationException &&
        (error as any)?.getResponse?.()?.errorCode === ErrorCode.S007
      ) {
        const subscriptionId = (error as any).getResponse()?.message;
        if (subscriptionId) {
          try {
            await this.subscriptionsService.cancelSubscription(
              subscriptionId as number,
            );
            throw error;
          } catch (rollbackError) {
            this.logger.error(`Failed to rollback: ${rollbackError.message}`);
          }
        }
      }
      if (subscription) {
        try {
          await this.subscriptionsService.cancelSubscription(
            subscription.id as number,
          );
          this.logger.log(`Rolled back subscription: ${subscription.id}`);
        } catch (rollbackError) {
          this.logger.error(`Failed to rollback: ${rollbackError.message}`);
        }
      }

      // Clear cache để có thể retry
      await this.cacheService.del(`idempotency:${idempotencyKey}`);

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to create payment. Please try again later.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get current user subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'User subscriptions retrieved successfully',
    type: ApiResponseDto<ResponseSubscriptionDto[]>,
  })
  async findMySubscriptions(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseSubscriptionDto[]>> {
    const user_id = req.user.sub as string;
    const subscriptions = await this.subscriptionsService.findByUserId(user_id);
    return new ApiResponseDto(
      200,
      'User subscriptions retrieved successfully',
      subscriptions,
    );
  }

  @Get('usage-status')
  @ApiOperation({ summary: 'Check current user usage status' })
  @ApiResponse({
    status: 200,
    description: 'Usage status retrieved successfully',
  })
  async checkUsageStatus(
    @Req() req: any,
  ): Promise<ApiResponseDto<ResponseSubscriptionDto[] | []>> {
    const user_id = req.user.sub as string;
    const usageStatus =
      (await this.subscriptionsService.checkUsageLimit(user_id)) ?? [];
    return new ApiResponseDto(
      200,
      'Usage status retrieved successfully',
      usageStatus,
    );
  }

  @Get('admin/all')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get all subscriptions (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions retrieved successfully',
  })
  async getAllSubscriptionsForAdmin(
    @Query() query: AdminSubscriptionQueryDto,
  ): Promise<ApiResponseDto<any>> {
    const result = await this.subscriptionsService.findAllForAdmin(query);
    return new ApiResponseDto(
      200,
      'Subscriptions retrieved successfully',
      result,
    );
  }

  @Get('admin/revenue')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get revenue statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Revenue statistics retrieved successfully',
    type: RevenueStatisticsDto,
  })
  async getRevenueStatistics(): Promise<ApiResponseDto<RevenueStatisticsDto>> {
    const stats = await this.subscriptionsService.getRevenueStatistics();
    return new ApiResponseDto(
      200,
      'Revenue statistics retrieved successfully',
      stats,
    );
  }
}
