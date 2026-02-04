// backend/src/db.js
const { Pool } = require('pg');

// A string de conexão vem da variável de ambiente definida no docker-compose
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Teste de conexão simples
pool.on('connect', () => {
  console.log('Base de Dados conectada com sucesso!');
});

module.exports = pool;
