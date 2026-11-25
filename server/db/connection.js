import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

let pool = null;

if (env.DATABASE_URL && env.DATABASE_URL.startsWith('postgres')) {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Could not initialize PostgreSQL pool');
    pool = null;
  }
}

export const getPool = () => pool;

export const query = async (text, params) => {
  if (!pool) return null;
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ text, duration, rows: res.rowCount }, 'Executed PostgreSQL query');
  return res;
};

export const getClient = async () => {
  if (!pool) return null;
  return await pool.connect();
};

export default { getPool, query, getClient };
