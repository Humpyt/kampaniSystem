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
        database: 'cavemo-repair',
        user: 'postgres',
        password: 'postgres123',
        max: 20,
        idleTimeoutMillis: 30000,
      }
);

// withTransaction helper
export async function withTransaction<T>(
  fn: (client: PoolClient & {
    run(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }>;
    get(sql: string, params?: any[]): Promise<any>;
    all(sql: string, params?: any[]): Promise<any[]>;
  }) => Promise<T>
): Promise<T> {
  const rawClient = await pool.connect();
  // Wrap client with .run(), .get(), .all() methods for SQLite-like compatibility
  const client = rawClient as PoolClient & {
    run(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }>;
    get(sql: string, params?: any[]): Promise<any>;
    all(sql: string, params?: any[]): Promise<any[]>;
  };
  client.run = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
    const result = await rawClient.query(sql, params);
    const lastID = result.rows[0]?.id || 0;
    const changes = result.rowCount || 0;
    return { lastID, changes };
  };
  client.get = async (sql: string, params: any[] = []): Promise<any> => {
    const result = await rawClient.query(sql, params);
    return result.rows[0] || null;
  };
  client.all = async (sql: string, params: any[] = []): Promise<any[]> => {
    const result = await rawClient.query(sql, params);
    return result.rows;
  };
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

// Normalize params: flatten arrays to match SQLite behavior
const normalizeParams = (params: any[]): any[] => {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
};

// Convert pg result to SQLite-like { lastID, changes }
interface SqliteRunResult {
  lastID: number;
  changes: number;
}

// Create the database interface
const createDatabase = () => {
  // raw query returning rows array
  const query = async (sql: string, params: any[] = []): Promise<any[]> => {
    const result = await pool.query(sql, normalizeParams(params));
    return result.rows;
  };

  // single row query
  const queryOne = async (sql: string, params: any[] = []): Promise<any> => {
    const rows = await query(sql, params);
    return rows[0] || null;
  };

  // db.run - returns { lastID, changes }
  const run = async (sql: string, ...params: any[]): Promise<SqliteRunResult> => {
    const normalized = normalizeParams(params);
    const result = await pool.query(sql, normalized);
    // PostgreSQL doesn't have lastID like SQLite, but we can get last insert id from RETURNING
    // For INSERT with RETURNING, we can get it from the result
    const lastID = result.rows[0]?.id || 0;
    const changes = result.rowCount || 0;
    return { lastID, changes };
  };

  // db.get - single row
  const get = async (sql: string, ...params: any[]): Promise<any> => {
    return queryOne(sql, params);
  };

  // db.all - array of rows
  const all = async (sql: string, ...params: any[]): Promise<any[]> => {
    return query(sql, params);
  };

  // db.exec - for DDL statements (no params, synchronous-like)
  const exec = async (sql: string): Promise<void> => {
    await pool.query(sql);
  };

  // db.prepare - returns object with run/get/all for legacy compatibility
  const prepare = (sql: string) => {
    return {
      run: (...params: any[]) => run(sql, ...params),
      get: (...params: any[]) => get(sql, ...params),
      all: (...params: any[]) => all(sql, ...params),
    };
  };

  // Legacy transaction wrapper (alias for withTransaction)
  const transaction = (fn: (client: PoolClient) => Promise<any>) => {
    return withTransaction(fn);
  };

  const db: any = {
    run,
    get,
    all,
    exec,
    query,
    queryOne,
    withTransaction,
    transaction,
    prepare,
    pool,
  };

  return db;
};

const db = createDatabase();

export default db as any;
