// Migration Runner Script
// Executes SQL migration files against the database

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function runMigration(migrationFile) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔄 Running migration: ${migrationFile}`);
    
    // Read migration file
    const migrationPath = path.join(__dirname, migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error('Error:', error.message);
    throw error;
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting migration process...');
    console.log(`📍 Database: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
    
    // Get migration file from command line argument or use default
    const migrationFile = process.argv[2] || '001_hybrid_search_infrastructure.sql';
    
    await runMigration(migrationFile);
    
    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Migration process failed!');
    process.exit(1);
    
  } finally {
    await pool.end();
  }
}

// Run migrations
main();
