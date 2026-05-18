import { AppConfig } from '../types/app-config.type';
import { PostgresConfig } from '../types/postgre-config.type';
import { RedisConfig } from '../types/redis-config.type';
import { GoogleConfig } from '../types/google-config.type';
import { AuthConfig } from '../types/auth-config.type';
import { MailConfig } from '../types/mail-config.type';
import { CloudinaryConfig } from '../types/cloudinary-config.type';
import { GeminiApiConfig } from '../types/gemini-api.type';
import { HuggingFaceConfig } from '../types/huggingface-config.type';
import { FacebookConfig } from '../types/facebook-config.type';

export type AllConfigType = {
  app: AppConfig;
  postgres: PostgresConfig;
  redis: RedisConfig;
  google: GoogleConfig;
  auth: AuthConfig;
  mail: MailConfig;
  cloudinary: CloudinaryConfig;
  geminiApi: GeminiApiConfig;
  huggingFaceApi: HuggingFaceConfig;
  facebook: FacebookConfig;
};
