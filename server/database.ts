import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support DATABASE_URL env var for production, with fallback to local dev settings
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString, max: 20, idleTimeoutMillis: 30000 }
    : {
        host: 'localhost',
        port: 5432,
        database: 'kampani',
        user: 'postgres',
        password: 'postgres123',
        max: 20,
        idleTimeoutMillis: 30000,
      }
);

/**
 * Convert ? placeholders to PostgreSQL $1, $2, ... style
 */
function convertPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `\$${++index}`);
}

export interface DatabaseExecutor {
  run(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  prepare(sql: string): {
    run: (...params: any[]) => Promise<{ lastID: number; changes: number }>;
    get: (...params: any[]) => Promise<any>;
    all: (...params: any[]) => Promise<any[]>;
  };
}

export type TransactionClient = PoolClient & DatabaseExecutor;

const attachExecutorHelpers = (
  queryExecutor: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number | null }>
): DatabaseExecutor => {
  const run = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
    const result = await queryExecutor(convertPlaceholders(sql), params);
    const lastID = result.rows[0]?.id || 0;
    const changes = result.rowCount || 0;
    return { lastID, changes };
  };

  const get = async (sql: string, params: any[] = []): Promise<any> => {
    const result = await queryExecutor(convertPlaceholders(sql), params);
    return result.rows[0] || null;
  };

  const all = async (sql: string, params: any[] = []): Promise<any[]> => {
    const result = await queryExecutor(convertPlaceholders(sql), params);
    return result.rows;
  };

  const prepare = (sql: string) => ({
    run: (...params: any[]) => run(sql, normalizeParams(params)),
    get: (...params: any[]) => get(sql, normalizeParams(params)),
    all: (...params: any[]) => all(sql, normalizeParams(params)),
  });

  return {
    run,
    get,
    all,
    prepare,
  };
};

// withTransaction helper
export async function withTransaction<T>(
  fn: (client: TransactionClient) => Promise<T>
): Promise<T> {
  const rawClient = await pool.connect();
  const client = rawClient as TransactionClient;
  Object.assign(
    client,
    attachExecutorHelpers((sql: string, params: any[] = []) => rawClient.query(sql, params))
  );

  try {
    await rawClient.query('BEGIN');
    const result = await fn(client);
    await rawClient.query('COMMIT');
    return result;
  } catch (error) {
    await rawClient.query('ROLLBACK');
    throw error;
  } finally {
    rawClient.release();
  }
}

// Normalize params: flatten nested arrays
const normalizeParams = (params: any[]): any[] => {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
};

interface SqliteRunResult {
  lastID: number;
  changes: number;
}

const createDatabase = () => {
  const executeQuery = async (sql: string, params: any[] = []) => {
    return pool.query(sql, normalizeParams(params));
  };

  const query = async (sql: string, params: any[] = []): Promise<any[]> => {
    const result = await executeQuery(convertPlaceholders(sql), params);
    return result.rows;
  };

  const queryOne = async (sql: string, params: any[] = []): Promise<any> => {
    const rows = await query(sql, params);
    return rows[0] || null;
  };

  const run = async (sql: string, ...params: any[]): Promise<SqliteRunResult> => {
    const normalized = normalizeParams(params);
    const result = await pool.query(convertPlaceholders(sql), normalized);
    const lastID = result.rows[0]?.id || 0;
    const changes = result.rowCount || 0;
    return { lastID, changes };
  };

  const get = async (sql: string, ...params: any[]): Promise<any> => {
    return queryOne(sql, params);
  };

  const all = async (sql: string, ...params: any[]): Promise<any[]> => {
    return query(sql, params);
  };

  const exec = async (sql: string): Promise<void> => {
    await pool.query(sql);
  };

  const transaction = (fn: (client: PoolClient) => Promise<any>) => {
    return withTransaction(fn);
  };

  const helpers = attachExecutorHelpers(executeQuery);

  const db: any = {
    run,
    get,
    all,
    exec,
    query,
    queryOne,
    withTransaction,
    transaction,
    prepare: helpers.prepare,
    pool,
  };

  return db;
};

const db = createDatabase();

export default db as any;
