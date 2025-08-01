import { registerAs } from '@nestjs/config';

export default registerAs('openrouter', () => ({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
  model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
}));