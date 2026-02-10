// Script para testar lugares enriquecidos
require('dotenv').config();
const pool = require('./db');

async function testEnriched() {
  try {
    console.log('📞 Consultando lugares enriquecidos...\n');
    
    // Lugares com telefone
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        category,
        phone,
        website,
        rating,
        user_ratings_total
      FROM places 
      WHERE phone IS NOT NULL AND phone != ''
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum lugar enriquecido encontrado');
      await pool.end();
      return;
    }
    
    console.log(`✅ ${result.rows.length} lugares enriquecidos encontrados:\n`);
    
    result.rows.forEach((place, idx) => {
      console.log(`${idx + 1}. ${place.name}`);
      console.log(`   Categoria: ${place.category}`);
      console.log(`   📞 Telefone: ${place.phone}`);
      if (place.website) {
        console.log(`   🌐 Website: ${place.website}`);
      }
      if (place.rating) {
        console.log(`   ⭐ Rating: ${place.rating} (${place.user_ratings_total} avaliações)`);
      }
      console.log('');
    });
    
    // Estatísticas
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(phone) as com_telefone,
        COUNT(website) as com_website,
        COUNT(rating) as com_rating
      FROM places
    `);
    
    const s = stats.rows[0];
    console.log('📊 Estatísticas Gerais:\n');
    console.log(`   Total de lugares: ${s.total}`);
    console.log(`   Com telefone: ${s.com_telefone} (${(s.com_telefone/s.total*100).toFixed(1)}%)`);
    console.log(`   Com website: ${s.com_website} (${(s.com_website/s.total*100).toFixed(1)}%)`);
    console.log(`   Com rating: ${s.com_rating} (${(s.com_rating/s.total*100).toFixed(1)}%)`);
    
    await pool.end();
    console.log('\n✅ Teste concluído!');
    
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

testEnriched();
