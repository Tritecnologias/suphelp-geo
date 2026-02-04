// backend/src/setup_db.js
const pool = require('./db');

const createTables = async () => {
  try {
    // 1. Garantir que a extensão PostGIS está ativa
    await pool.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("✅ Extensão PostGIS ativa.");

    // 2. Tabela de Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabela 'users' criada.");

    // 3. Tabela de Lugares (Com Geolocalização)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS places (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        google_place_id VARCHAR(255) UNIQUE,
        category VARCHAR(100),
        
        -- O SEGREDO DO POSTGIS: Coluna de Geometria (Ponto, SRID 4326 - GPS padrão)
        location GEOMETRY(Point, 4326),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar índice espacial para buscas rápidas por raio
    await pool.query(`
      CREATE INDEX IF NOT EXISTS places_location_idx 
      ON places USING GIST (location);
    `);
    console.log("✅ Tabela 'places' criada com índice espacial GIST.");

  } catch (err) {
    console.error("❌ Erro ao criar tabelas:", err);
  } finally {
    await pool.end();
  }
};

createTables();
