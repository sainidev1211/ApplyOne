import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const portStr = process.env.PORT || process.env.BACKEND_PORT || '3000';
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid port value: ${portStr}. PORT or BACKEND_PORT must be a number between 1 and 65535.`,
    );
  }

  return {
    port,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    uploadPath: process.env.UPLOAD_PATH ?? './uploads',
    maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '10', 10),
  };
});
