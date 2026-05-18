import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class BanUserDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID to ban' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ example: 'Violated terms of service', description: 'Reason for ban' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UnbanUserDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID to unban' })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
