import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../server/config/env.js';
import { logger } from '../server/lib/logger.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations() {
  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set. Skipping PostgreSQL migrations.');
    return { success: true, count: 0, reason: 'NO_DATABASE_URL' };
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5000
  });

  const client = await pool.connect().catch((err) => {
    logger.warn({ err: err.message }, 'Could not connect to PostgreSQL instance. Migration skipped.');
    return null;
  });

  if (!client) {
    await pool.end();
    return { success: false, reason: 'CONNECTION_FAILED' };
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    for (const file of files) {
      const alreadyApplied = await client.query(
        'SELECT id FROM schema_migrations WHERE name = $1',
        [file]
      );

      if (alreadyApplied.rows.length === 0) {
        logger.info(`Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`Applied migration: ${file}`);
        appliedCount++;
      }
    }

    logger.info({ appliedCount }, 'PostgreSQL migrations completed successfully.');
    return { success: true, count: appliedCount };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error({ err }, 'Migration execution failed.');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Direct execution CLI check
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then((res) => {
      console.log('Migration result:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
