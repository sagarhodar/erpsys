import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // ✅ REQUIRED for Render PostgreSQL
  ssl: {
    rejectUnauthorized: false
  }
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getNextDocNo(
  prefix: string,
  client?: pg.PoolClient
): Promise<string> {
  const q = client || pool;
  const year = new Date().getFullYear().toString().slice(-2);

  const result = await q.query(
    `INSERT INTO doc_series (prefix, year, last_no)
     VALUES ($1, $2, 1)
     ON CONFLICT (prefix, year)
     DO UPDATE SET last_no = doc_series.last_no + 1
     RETURNING last_no`,
    [prefix, year]
  );

  return `${prefix}${year}${String(result.rows[0].last_no).padStart(5, '0')}`;
}
