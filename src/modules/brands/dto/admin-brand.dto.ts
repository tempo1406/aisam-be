import { ApiProperty } from '@nestjs/swagger';

export class AdminBrandDto {
  @ApiProperty({ description: 'Brand ID' })
  id: string;

  @ApiProperty({ description: 'Brand name' })
  name: string;

  @ApiProperty({ description: 'Brand description' })
  description: string;

  @ApiProperty({ description: 'Brand logo URL' })
  logo?: string;

  @ApiProperty({ description: 'Brand website URL' })
  website?: string;

  @ApiProperty({ description: 'Brand creator information' })
  creator: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({ description: 'Brand creation date' })
  createdAt: Date;
}