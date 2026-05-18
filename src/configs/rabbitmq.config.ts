import { registerAs } from '@nestjs/config';
import validateConfig from '@utils/validate-config';
import { IsNotEmpty, IsString } from 'class-validator';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL: string;
}

export default registerAs('rabbitmq', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    url: process.env.RABBITMQ_URL!,
  };
});
