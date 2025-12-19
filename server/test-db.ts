import { db } from './db';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();