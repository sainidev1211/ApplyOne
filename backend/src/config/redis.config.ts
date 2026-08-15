import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const url = process.env.REDIS_URL;
  // Note: REDIS_URL is optional. If not provided, the application will log a warning
  // and either use in-memory cache (for cache-manager) or fail gracefully for queues.
  return {
    url: url || '',
  };
});
