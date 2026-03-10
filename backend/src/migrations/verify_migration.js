// Verification Script for Hybrid Search Migration
// Checks if all database changes were applied correctly

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function verifyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verifying migration changes...\n');
    
    // 1. Check google_place_id column
    console.log('1️⃣ Checking google_place_id column in places table:');
    const columnCheck = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'places' AND column_name = 'google_place_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('   ✅ Column exists:', columnCheck.rows[0]);
    } else {
      console.log('   ❌ Column NOT found!');
    }
    
    // 2. Check unique index on google_place_id
    console.log('\n2️⃣ Checking unique index on google_place_id:');
    const indexCheck = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'places' 
      AND indexname LIKE '%google_place_id%'
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log('   ✅ Index exists:');
      indexCheck.rows.forEach(row => {
        console.log(`      - ${row.indexname}`);
        console.log(`        ${row.indexdef}`);
      });
    } else {
      console.log('   ❌ Index NOT found!');
    }
    
    // 3. Check search_cache table
    console.log('\n3️⃣ Checking search_cache table:');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'search_cache'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('   ✅ Table exists');
      
      // Check columns
      const columnsCheck = await client.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'search_cache'
        ORDER BY ordinal_position
      `);
      
      console.log('   📋 Columns:');
      columnsCheck.rows.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''})`);
      });
    } else {
      console.log('   ❌ Table NOT found!');
    }
    
    // 4. Check search_cache indexes
    console.log('\n4️⃣ Checking search_cache indexes:');
    const cacheIndexCheck = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'search_cache'
      ORDER BY indexname
    `);
    
    if (cacheIndexCheck.rows.length > 0) {
      console.log('   ✅ Indexes found:');
      cacheIndexCheck.rows.forEach(row => {
        console.log(`      - ${row.indexname}`);
      });
    } else {
      console.log('   ⚠️  No indexes found (besides primary key)');
    }
    
    console.log('\n✨ Verification completed!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
    
  } finally {
    client.release();
    await pool.end();
  }
}

verifyMigration();
