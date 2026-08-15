import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not defined. Set the environment variable JWT_SECRET to a strong random value before running in production.',
    );
  }
  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  };
});
