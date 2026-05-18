import { registerAs } from '@nestjs/config';
import { CloudinaryConfig } from 'src/types/cloudinary-config.type';
import validateConfig from '@utils/validate-config';
import { IsNotEmpty } from 'class-validator';
import { IsString } from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  CLD_CLOUD_NAME: string;

  @IsString()
  @IsNotEmpty()
  CLD_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  CLD_API_SECRET: string;
}

export default registerAs<CloudinaryConfig>('cloudinary', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    cloudName: process.env.CLD_CLOUD_NAME!,
    apiKey: process.env.CLD_API_KEY!,
    apiSecret: process.env.CLD_API_SECRET!,
  };
});
