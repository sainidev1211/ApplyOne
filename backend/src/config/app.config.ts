import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  uploadPath: process.env.UPLOAD_PATH ?? './uploads',
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '10', 10),
}));
