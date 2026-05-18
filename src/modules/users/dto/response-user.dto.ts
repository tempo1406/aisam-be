import { ResponseRoleDto } from '@modules/roles/dto/response-role.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseUserDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  password: string;

  @Expose()
  avatar: string;

  @Expose()
  bio: string;

  @Expose()
  phone: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  address: string;

  @Expose()
  role: ResponseRoleDto;

  @Expose()
  provider: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
