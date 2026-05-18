import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseHashtagCollectionDto {
  @Expose()
  id: string;

  @Expose()
  collection_name: string;

  @Expose()
  collection_description: string;

  @Expose()
  list_hashtag: string[];

  @Expose()
  user_id: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
