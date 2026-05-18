import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ResponseUserDto } from '@modules/users/dto/response-user.dto';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): ResponseUserDto | any => {
    const request = ctx.switchToHttp().getRequest();
    const user: ResponseUserDto = request.user;
    if (!user) return undefined;
    if (!data) return user;
    return (user as any)[data];
  },
);
