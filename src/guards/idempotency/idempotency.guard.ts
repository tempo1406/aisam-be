import { ExecutionContext, CanActivate, Injectable } from '@nestjs/common';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const idempotencyKey = request.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        const user = (request as any).user;
        const body = JSON.stringify(request.body);
        // FIX: Remove Date.now() to make key consistent for same user + body
        // This ensures retry requests get the same key for proper idempotency
        const generatedKey = `${user?.sub}_${this.hashString(body)}`;
        request.headers['idempotency-key'] = generatedKey;
      }
      return true;
    } catch (error) {
      console.error('Error checking idempotency:', error);
      throw error;
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}
