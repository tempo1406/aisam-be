import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
// Expose dùng để chỉ định các thuộc tính sẽ được bao gồm khi chuyển đổi đối tượng sang định dạng khác (ví dụ: JSON).

export class CreateCategoryDto {
  @ApiProperty({ example: 'name category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'description category' })
  @IsString()
  @IsNotEmpty()
  descriptions: string;
}
