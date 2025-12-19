import { db } from './db';
import { up } from './migrations/001_create_users_table';

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    await up(db);
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();