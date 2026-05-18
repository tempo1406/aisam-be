import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    example:
      'Software Developer passionate about creating amazing applications',
    description: 'User biography',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: '+84901234567',
    description: 'Phone number of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth in YYYY-MM-DD format',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    example: '123 Main Street, Ho Chi Minh City, Vietnam',
    description: 'Address of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
