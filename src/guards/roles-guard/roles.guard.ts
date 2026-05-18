import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@decorators/role/role.decorator';
import { RoleEnum } from 'src/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requiredRoles) return true;

      const { user } = context.switchToHttp().getRequest();
      const isRoleValid = requiredRoles.includes(user?.role as RoleEnum);
      if (!isRoleValid) {
        throw new ForbiddenException('User does not have the required role');
      }
      return true;
    } catch (error) {
      console.error('Error checking roles:', error);
      throw error;
    }
  }
}
