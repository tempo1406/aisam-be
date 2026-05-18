import { CacheService } from '@modules/cache/cache.service';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly CACHE_PREFIX = 'idempotency';
  private readonly CACHE_TTL = 30; // 30 seconds

  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `${this.CACHE_PREFIX}:${idempotencyKey}`;

    // Check if this request was already processed
    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      this.logger.log(
        `Returning cached result for idempotency key: ${idempotencyKey}`,
      );
      return of(cachedResult);
    }

    // Process request and cache result
    return next.handle().pipe(
      tap((response) => {
        this.logger.log(
          `Caching result for idempotency key: ${idempotencyKey}`,
        );
        this.cacheService
          .set(cacheKey, response, this.CACHE_TTL)
          .catch((error) => {
            this.logger.error(
              `Error caching result for idempotency key: ${idempotencyKey}`,
              error,
            );
          });
      }),
    );
  }
}
