import { defineConfig } from 'prisma/config';
import { PrismaNeon } from '@prisma/adapter-neon';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    async adapter() {
      return new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    },
  },
});
