import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProduction = process.env.NODE_ENV === 'production';

// Local development should always use local SQLite unless explicitly overridden.
const databaseUrl = isProduction
  ? process.env.DATABASE_URL
  : process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || 'file:./prisma/dev.db';

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set in production.');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (!isProduction) globalForPrisma.prisma = prisma;
