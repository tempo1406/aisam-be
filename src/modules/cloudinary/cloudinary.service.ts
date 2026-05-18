import { Inject, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './dto/cloudinary-response.dto';
import { CloudinaryLib } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    @Inject('CLOUDINARY')
    private readonly cloudinary: CloudinaryLib,
  ) {}

  uploadFile(
    file: Express.Multer.File,
    folder: string,
    options?: { resourceType?: 'auto' | 'image' | 'video' | 'raw' },
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const normalizedFolder = this.normalizeFolder(folder);

      this.logger.log(
        `Starting upload for file: ${file.originalname}, size: ${file.size} bytes`,
      );
      this.logger.log(`Target folder: ${normalizedFolder}`);

      // Determine if it's an image file
      const isImage = file.mimetype.startsWith('image/');
      const resourceType = options?.resourceType || (isImage ? 'image' : 'raw');

      // Generate filename
      const timestamp = Date.now();

      const fileName = file.originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/\./g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '');

      const publicId = `${fileName}_${timestamp}`;

      const uploadOptions = {
        resource_type: resourceType as any,
        public_id: publicId,
        folder: normalizedFolder,
        use_filename: false,
        unique_filename: false,
        access_mode: 'public',
        type: 'upload',
        timeout: 60000, // 60 seconds timeout
        ...(resourceType === 'image' && {
          transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
        }),
        context: {
          purpose: isImage ? 'avatar_image' : 'document_storage',
          type: isImage ? 'user_avatar' : 'business_document',
        },
      };

      this.logger.log(
        `Upload options: ${JSON.stringify(uploadOptions, null, 2)}`,
      );

      const uploadStream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`, error.stack);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            this.logger.log(`Upload successful: ${result?.public_id}`);
            resolve(result as CloudinaryResponse);
          }
        },
      );

      // Set timeout for the upload stream
      const timeoutId = setTimeout(() => {
        this.logger.error('Upload timeout after 60 seconds');
        uploadStream.destroy();
        reject(new Error('Upload timeout after 60 seconds'));
      }, 60000);

      uploadStream.on('finish', () => {
        clearTimeout(timeoutId);
      });

      uploadStream.on('error', (error) => {
        clearTimeout(timeoutId);
        this.logger.error(`Stream error: ${error.message}`, error.stack);
        reject(new Error(`Upload stream error: ${error.message}`));
      });

      // Write the file buffer to the stream
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload base64 image to Cloudinary
   * @param base64Data - Pure base64 string (without data:image/xxx;base64, prefix)
   * @param folder - Target folder in Cloudinary
   */
  uploadBase64(
    base64Data: string,
    folder: string,
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const normalizedFolder = this.normalizeFolder(folder);
      const timestamp = Date.now();
      const publicId = `campaign_image_${timestamp}`;

      this.logger.log(`[Cloudinary] Uploading base64 image to folder: ${normalizedFolder}`);

      // Cloudinary accepts base64 with data URL prefix
      const dataUrl = `data:image/png;base64,${base64Data}`;

      this.cloudinary.uploader.upload(
        dataUrl,
        {
          resource_type: 'image',
          public_id: publicId,
          folder: normalizedFolder,
          use_filename: false,
          unique_filename: false,
          access_mode: 'public',
          type: 'upload',
          timeout: 60000,
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error(`[Cloudinary] Upload failed: ${error.message}`, error.stack);
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            this.logger.log(`[Cloudinary] Upload successful: ${result?.secure_url}`);
            resolve(result as CloudinaryResponse);
          }
        },
      );
    });
  }

  private normalizeFolder(folder: string): string {
    return folder.startsWith('/') ? folder.substring(1) : folder;
  }

  async deleteFileByUrl(url: string): Promise<void> {
    const publicId = this.extractPublicIdFromUrl(url);
    try {
      return new Promise<void>((resolve, reject) => {
        void cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            this.logger.error(`Delete failed: ${error.message}`, error.stack);
            return reject(error as Error);
          }
          this.logger.log(
            `Deleted file: ${publicId}, result: ${JSON.stringify(result)}`,
          );
          resolve();
        });
      });
    } catch (error) {
      this.logger.error(`Error deleting file: ${url}`, error);
      throw new Error(`Error deleting file: ${url}`);
    }
  }

  private extractPublicIdFromUrl(url: string): string {
    try {
      const parts = url.split('/');
      const fileWithExt = parts[parts.length - 1];
      // bỏ phần đuôi .png
      const publicId = fileWithExt.replace(/\.[^/.]+$/, '');
      // Nếu có folder, ghép lại
      const folderPath = parts
        .slice(parts.indexOf('upload') + 2, parts.length - 1)
        .join('/');

      return folderPath ? `${folderPath}/${publicId}` : publicId;
    } catch (e) {
      this.logger.error(`Invalid Cloudinary URL: ${url}`, e);
      throw new Error(`Invalid Cloudinary URL: ${url}`);
    }
  }
}
