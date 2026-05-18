import {
  Injectable,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookGuard extends AuthGuard('facebook') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Get userId from query parameter
    const userId = request.query?.userId as string | undefined;

    console.log('FacebookGuard - Received userId from query:', userId);

    // If no userId provided, use hardcoded for testing
    const finalUserId = userId || '5fdcdf63-a6b8-42fd-96f3-0b92c152e108';

    console.log('FacebookGuard - Passing userId in state:', finalUserId);

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalUserId)) {
      throw new BadRequestException(
        'Invalid userId format. Must be a valid UUID.',
      );
    }

    // Pass userId as state parameter to OAuth flow
    return {
      state: finalUserId,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activate = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    await super.logIn(request);
    return activate;
  }
}
