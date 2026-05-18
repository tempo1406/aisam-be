import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseBrandDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slogan: string;

  @Expose()
  main_description: string;

  @Expose()
  representative_character_description: string;

  @Expose()
  representative_character_name: string;

  @Expose()
  representative_character_image: string;

  @Expose()
  web_url: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
