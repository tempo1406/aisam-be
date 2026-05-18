import { Expose } from 'class-transformer';

export class ResponseCategoryDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  userId: string;
  @Expose()
  slug: string;
  @Expose()
  descriptions: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}
