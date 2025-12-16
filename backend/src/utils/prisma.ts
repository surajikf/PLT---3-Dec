import { PrismaClient } from '@prisma/client';

/**
 * Production-ready Prisma Client configuration
 * Optimized for connection pooling, performance, and reliability
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    // Connection pool configuration (handled via DATABASE_URL)
    // Example: postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=20
    // These are set in DATABASE_URL connection string
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Prevent multiple instances in development (Next.js hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;

