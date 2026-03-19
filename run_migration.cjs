const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'db.pxkwrlqxgvzcmacmndqp.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Wall99696332$',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const migrationPath = 'c:\\Users\\Pichau\\Downloads\\consultoria-shape-insano-main\\supabase\\migrations\\20260318210000_financial_management.sql';
const sql = fs.readFileSync(migrationPath, 'utf8');

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
