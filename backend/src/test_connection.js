// Script de teste de conexão com o banco remoto
require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com PostgreSQL...');
    console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`📦 Database: ${process.env.DB_NAME}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    
    // Teste 1: Conexão básica
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log(`⏰ Hora do servidor: ${result.rows[0].current_time}`);
    console.log(`🐘 Versão PostgreSQL: ${result.rows[0].pg_version}`);
    
    // Teste 2: Verificar PostGIS
    const postgisCheck = await pool.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
      ) as postgis_installed
    `);
    
    if (postgisCheck.rows[0].postgis_installed) {
      const postgisVersion = await pool.query('SELECT PostGIS_Version() as version');
      console.log(`🗺️  PostGIS instalado: ${postgisVersion.rows[0].version}`);
    } else {
      console.log('⚠️  PostGIS NÃO está instalado. Execute setup_db.js para instalar.');
    }
    
    // Teste 3: Listar tabelas existentes
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    if (tables.rows.length > 0) {
      console.log(`📋 Tabelas encontradas (${tables.rows.length}):`);
      tables.rows.forEach(row => console.log(`   - ${row.tablename}`));
    } else {
      console.log('📋 Nenhuma tabela encontrada. Execute setup_db.js para criar.');
    }
    
    await pool.end();
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Erro na conexão:', err.message);
    console.error('\n🔧 Verifique:');
    console.error('   1. Se o IP 76.13.173.70 está acessível');
    console.error('   2. Se a porta 5432 está aberta no firewall');
    console.error('   3. Se as credenciais no .env estão corretas');
    console.error('   4. Se o PostgreSQL está rodando no Docker');
    process.exit(1);
  }
}

testConnection();
