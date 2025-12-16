/**
 * Database Optimization Utilities
 * Provides helpers for efficient database operations
 */

import prisma from './prisma';

/**
 * Execute multiple queries in parallel using Promise.all
 * Reduces total query time for independent queries
 */
export async function executeParallelQueries<T>(
  queries: Promise<T>[]
): Promise<T[]> {
  return Promise.all(queries);
}

/**
 * Execute queries in a transaction for atomicity
 * All queries succeed or all fail
 */
export async function executeTransaction<T>(
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: 5000, // Maximum time to wait for a transaction slot
    timeout: 10000, // Maximum time the transaction can run
  });
}

/**
 * Batch insert with chunking to avoid memory issues
 */
export async function batchInsert<T>(
  model: any,
  data: T[],
  chunkSize: number = 1000
): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await model.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += chunk.length;
  }
  return inserted;
}

/**
 * Optimized findMany with pagination and select
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface OptimizedQueryOptions<T> {
  where?: any;
  select?: any;
  include?: any;
  orderBy?: any;
  pagination?: PaginationOptions;
}

export async function optimizedFindMany<T>(
  model: any,
  options: OptimizedQueryOptions<T> = {}
): Promise<{ data: T[]; total: number; page: number; limit: number; pages: number }> {
  const {
    where = {},
    select,
    include,
    orderBy,
    pagination = {},
  } = options;

  const page = Math.max(1, pagination.page || 1);
  const maxLimit = pagination.maxLimit || 100;
  const limit = Math.min(maxLimit, Math.max(1, pagination.limit || 50));
  const skip = (page - 1) * limit;

  // Execute count and data queries in parallel
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      ...(select && { select }),
      ...(include && { include }),
      ...(orderBy && { orderBy }),
      skip,
      take: limit,
    }),
    model.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Check if database connection is healthy
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database connection pool stats (if available)
 */
export async function getConnectionStats(): Promise<{
  active: number;
  idle: number;
  total: number;
}> {
  try {
    // Prisma doesn't expose pool stats directly, but we can check connection
    await prisma.$queryRaw`SELECT 1`;
    return {
      active: 0, // Not directly available in Prisma
      idle: 0,
      total: 0,
    };
  } catch (error) {
    throw new Error('Failed to get connection stats');
  }
}

/**
 * Optimize query by selecting only needed fields
 * Reduces data transfer and memory usage
 */
export function selectFields<T extends Record<string, any>>(
  fields: (keyof T)[]
): Record<string, boolean> {
  const select: Record<string, boolean> = {};
  fields.forEach((field) => {
    select[field as string] = true;
  });
  return select;
}



