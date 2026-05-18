import { ApiProperty } from '@nestjs/swagger';

export class AdminCategoryDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category description' })
  description: string;

  @ApiProperty({ description: 'Category color' })
  color: string;

  @ApiProperty({ description: 'Category creator information' })
  creator: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({ description: 'Number of posts in this category' })
  postCount: number;

  @ApiProperty({ description: 'Category creation date' })
  createdAt: Date;
}