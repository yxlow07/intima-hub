import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations completed.');

  await sql.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
