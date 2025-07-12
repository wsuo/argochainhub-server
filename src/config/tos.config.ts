import { registerAs } from '@nestjs/config';

export default registerAs('tos', () => ({
  region: process.env.TOS_REGION || 'cn-beijing',
  endpoint: process.env.TOS_ENDPOINT || 'https://tos-s3-cn-beijing.volces.com',
  accessKeyId: process.env.VOLC_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.VOLC_ACCESS_KEY_SECRET || '',
  bucket: process.env.TOS_BUCKET || 'argochainhub',
  // 可选配置
  sessionToken: process.env.TOS_SESSION_TOKEN || undefined,
  requestTimeout: parseInt(process.env.TOS_REQUEST_TIMEOUT || '60000', 10),
  // CDN配置（如果有的话）
  cdnDomain: process.env.TOS_CDN_DOMAIN || undefined,
}));
