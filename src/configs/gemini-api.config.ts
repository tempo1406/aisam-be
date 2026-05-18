import { registerAs } from '@nestjs/config';
import { GeminiApiConfig } from '../types/gemini-api.type';
import validateConfig from '@utils/validate-config';
import { IsNotEmpty, IsString } from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  GEMINI_API_KEY_TEXT_TO_TEXT: string;

  @IsString()
  @IsNotEmpty()
  GEMINI_API_KEY_TEXT_TO_IMAGE: string;
}

export default registerAs<GeminiApiConfig>('geminiApi', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    api_key_text_to_text: process.env.GEMINI_API_KEY_TEXT_TO_TEXT!,
    api_key_text_to_image: process.env.GEMINI_API_KEY_TEXT_TO_IMAGE!,
  };
});
