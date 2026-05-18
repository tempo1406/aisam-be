import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export type CloudinaryLib = {
  uploader: typeof cloudinary.uploader;
  api: typeof cloudinary.api;
};

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService): CloudinaryLib => {
    cloudinary.config({
      cloud_name: configService.get('cloudinary.cloudName'),
      api_key: configService.get('cloudinary.apiKey'),
      api_secret: configService.get('cloudinary.apiSecret'),
    });
    return {
      uploader: cloudinary.uploader,
      api: cloudinary.api,
    };
  },
};
