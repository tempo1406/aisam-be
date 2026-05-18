import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { PostStatus } from 'src/enums/post.enum';
import { IsEnum } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class UpdatePostStatusDto {
  @ApiProperty({
    enum: PostStatus,
    example: PostStatus.SCHEDULED,
  })
  @IsEnum(PostStatus)
  status: PostStatus;
}
