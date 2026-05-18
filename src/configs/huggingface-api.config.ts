import { registerAs } from '@nestjs/config';
import validateConfig from '@utils/validate-config';
import { IsNotEmpty, IsString } from 'class-validator';
import { HuggingFaceConfig } from '../types/huggingface-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  HUGGING_FACE_API_KEY: string;
}

export default registerAs<HuggingFaceConfig>('huggingFaceApi', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    apiKey: process.env.HUGGING_FACE_API_KEY!,
  };
});
