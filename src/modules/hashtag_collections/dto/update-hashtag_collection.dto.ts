import { PartialType } from '@nestjs/swagger';
import { CreateHashtagCollectionDto } from './create-hashtag_collection.dto';

export class UpdateHashtagCollectionDto extends PartialType(
  CreateHashtagCollectionDto,
) {}
