import { defineConfig } from 'prisma/config';

// Prisma v7 configuration — connection URLs live here, not in schema.prisma
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
    // directUrl is used for Prisma Migrate (bypasses pgBouncer connection pooler)
    ...(process.env.DIRECT_URL ? { directUrl: process.env.DIRECT_URL } : {}),
  },
});
