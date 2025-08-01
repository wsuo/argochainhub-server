import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT || '3050', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));
