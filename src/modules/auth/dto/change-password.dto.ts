import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateIf } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => o.newPassword !== o.confirmPassword)
  confirmPassword: string;
}
