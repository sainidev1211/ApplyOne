import { defineConfig } from 'prisma/config';

// Prisma v7 configuration.
// DATABASE_URL will be the Supabase PostgreSQL connection string,
// added when the database integration phase begins.
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
