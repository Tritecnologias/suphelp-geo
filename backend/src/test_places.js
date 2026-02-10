// Script para testar os lugares cadastrados
require('dotenv').config();
const pool = require('./db');

async function testPlaces() {
  try {
    console.log('🔍 Consultando lugares cadastrados...\n');
    
    // Total de lugares
    const countResult = await pool.query('SELECT COUNT(*) as total FROM places');
    const total = countResult.rows[0].total;
    console.log(`📊 Total de lugares no banco: ${total}\n`);
    
    // Últimos 10 lugares
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        category, 
        address,
        ST_X(location) as lng,
        ST_Y(location) as lat
      FROM places 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log('📋 Últimos 10 lugares cadastrados:\n');
    result.rows.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.name}`);
      console.log(`   Categoria: ${place.category}`);
      console.log(`   Endereço: ${place.address}`);
      console.log(`   Coordenadas: ${place.lat}, ${place.lng}`);
      console.log('');
    });
    
    // Lugares por categoria
    const catResult = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM places 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    console.log('📊 Lugares por categoria:\n');
    catResult.rows.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count}`);
    });
    
    await pool.end();
    console.log('\n✅ Teste concluído!');
    
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

testPlaces();
