import type { Config } from 'drizzle-kit';

export default {
    schema: './src/lib/db/schema/index.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'japan-politics.db',
    },
} satisfies Config;
