const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('DATABASE_URL 또는 SUPABASE_DB_URL 환경변수가 필요합니다.');
  process.exit(1);
}

const dataPath = process.env.DATA_JSON_PATH || path.join(__dirname, 'data.json');
const state = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE !== 'disable' ? { rejectUnauthorized: false } : undefined,
});

const tables = [
  'users',
  'posts',
  'post_images',
  'post_likes',
  'comments',
  'notifications',
  'chat_rooms',
  'messages',
  'sessions',
  'verification_codes',
];

function rows(table) {
  return Array.isArray(state[table]) ? state[table] : [];
}

function normalizeReadBy(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'number') {
        return item;
      }
      if (item && typeof item === 'object' && typeof item.id === 'number') {
        return item.id;
      }
      const parsed = Number(item);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((item) => Number.isInteger(item));
}

async function insertRows(client, table, records) {
  if (records.length === 0) {
    return;
  }

  const columns = Object.keys(records[0]);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const updates = columns
    .filter((column) => column !== 'id' && column !== 'token' && column !== 'email')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');

  const conflictTarget = table === 'sessions' ? 'token' : table === 'verification_codes' ? 'email' : 'id';
  const conflictClause = updates
    ? `on conflict (${conflictTarget}) do update set ${updates}`
    : `on conflict (${conflictTarget}) do nothing`;

  for (const record of records) {
    const values = columns.map((column) => {
      if (column === 'tags') {
        return JSON.stringify(Array.isArray(record[column]) ? record[column] : []);
      }
      if (column === 'read_by') {
        return normalizeReadBy(record[column]);
      }
      if (column === 'is_price_offer_allowed' || column === 'persisted' || column === 'verified') {
        return Boolean(record[column]);
      }
      return record[column];
    });

    await client.query(
      `insert into ${table} (${columns.join(', ')}) values (${placeholders}) ${conflictClause}`,
      values
    );
  }
}

async function resetSequences(client) {
  const sequenceTables = tables.filter((table) => table !== 'sessions' && table !== 'verification_codes');

  for (const table of sequenceTables) {
    await client.query(
      `select setval(pg_get_serial_sequence($1, 'id'), coalesce((select max(id) from ${table}), 1), true)`,
      [table]
    );
  }
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query('begin');

    if (process.argv.includes('--reset')) {
      await client.query(`truncate table ${tables.join(', ')} restart identity cascade`);
    }

    for (const table of tables) {
      await insertRows(client, table, rows(table));
      console.log(`${table}: ${rows(table).length} rows`);
    }

    await resetSequences(client);
    await client.query('commit');
    console.log('data.json migration complete');
  } catch (error) {
    await client.query('rollback');
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
