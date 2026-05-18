import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RoleEnum } from 'src/enums/role.enum';

export class CreateRoleDto {
  @ApiProperty({ example: RoleEnum.ADMIN })
  @IsString()
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  name: RoleEnum;

  @ApiProperty({ example: 'Administrator role with full system access' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
