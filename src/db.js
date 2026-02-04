// backend/src/db.js
require('dotenv').config();
const { Pool } = require('pg');

// Configuração do PostgreSQL remoto
const pool = new Pool({
  host: process.env.DB_HOST || '76.13.173.70',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'suphelp_geo',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || '***REMOVED***',
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Base de Dados conectada com sucesso!');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

module.exports = pool;
