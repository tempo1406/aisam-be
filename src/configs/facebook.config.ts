import { registerAs } from '@nestjs/config';
import { FacebookConfig } from 'src/types/facebook-config.type';

export default registerAs<FacebookConfig>('facebook', () => ({
  appId: process.env.FACEBOOK_APP_ID || '',
  appSecret: process.env.FACEBOOK_APP_SECRET || '',
  graphApiVersion: process.env.FACEBOOK_GRAPH_API_VERSION || 'v23.0',
}));
