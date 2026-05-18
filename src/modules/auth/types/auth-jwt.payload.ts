import { RoleEnum } from 'src/enums/role.enum';

export class AuthJwtPayload {
  sub: string;
  role: RoleEnum;
}
