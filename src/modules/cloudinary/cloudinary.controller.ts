import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@decorators/auth/public.decorator';
import { ApiResponseDto } from '@common/dto/api-response.dto';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Public()
  @Post('upload')
  @ApiOperation({ summary: 'Upload an image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Directory path where the file will be stored',
          example: 'avatar',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    const result = await this.cloudinaryService.uploadFile(file, folder);
    const url = result.url;
    return new ApiResponseDto(200, 'File uploaded successfully', url);
  }

  @Public()
  @Delete(':url')
  @ApiOperation({ summary: 'Delete a file from Cloudinary' })
  async deleteFile(@Param('url') url: string) {
    const decodedUrl = decodeURIComponent(url);

    await this.cloudinaryService.deleteFileByUrl(decodedUrl);

    return new ApiResponseDto(200, 'File deleted successfully');
  }
}
