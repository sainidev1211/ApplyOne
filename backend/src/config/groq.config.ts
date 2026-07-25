import { registerAs } from '@nestjs/config';

export default registerAs('groq', () => ({
  apiKey: process.env.GROQ_API_KEY ?? '',
  model: process.env.GROQ_MODEL ?? 'llama3-8b-8192',
}));
