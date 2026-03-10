// backend/src/services/cacheWriter.js

/**
 * CacheWriter - Salva resultados do Google Places no banco local
 * 
 * Responsabilidades:
 * - Salvar lugares do Google Places no banco de dados local
 * - Prevenir duplicatas usando google_place_id
 * - Enriquecer registros existentes atualizando apenas campos vazios
 * - Executar cache em background sem bloquear resposta
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

class CacheWriter {
  /**
   * @param {Pool} pool - PostgreSQL connection pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Cacheia múltiplos lugares em background
   * Executa sem bloquear a resposta ao usuário
   * 
   * @param {Array} places - Array de lugares no formato local
   * @returns {Promise<void>}
   */
  async cacheResults(places) {
    // Executar em background sem bloquear
    setImmediate(async () => {
      for (const place of places) {
        try {
          await this.cacheSingle(place);
        } catch (err) {
          console.error('Erro ao cachear lugar:', err.message, place);
        }
      }
    });
  }

  /**
   * Cacheia um único lugar no banco de dados
   * Usa INSERT ... ON CONFLICT para prevenir duplicatas
   * Atualiza apenas campos vazios em caso de duplicata (enriquecimento)
   * 
   * @param {Object} place - Lugar no formato local
   * @param {string} place.name - Nome do lugar
   * @param {string} place.address - Endereço
   * @param {string} place.category - Categoria
   * @param {number} place.lat - Latitude
   * @param {number} place.lng - Longitude
   * @param {string} place.google_place_id - ID do Google Places
   * @param {string} [place.phone] - Telefone (opcional)
   * @param {string} [place.website] - Website (opcional)
   * @param {number} [place.rating] - Rating (opcional)
   * @param {number} [place.user_ratings_total] - Total de avaliações (opcional)
   * @returns {Promise<void>}
   */
  async cacheSingle(place) {
    // Query com INSERT ... ON CONFLICT para prevenir duplicatas
    // Atualiza apenas campos vazios (COALESCE mantém valor existente se não for null)
    const query = `
      INSERT INTO places (
        name, address, category, location, google_place_id,
        phone, website, rating, user_ratings_total
      )
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10)
      ON CONFLICT (google_place_id) 
      DO UPDATE SET
        phone = COALESCE(places.phone, EXCLUDED.phone),
        website = COALESCE(places.website, EXCLUDED.website),
        rating = COALESCE(places.rating, EXCLUDED.rating),
        user_ratings_total = COALESCE(places.user_ratings_total, EXCLUDED.user_ratings_total),
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.pool.query(query, [
      place.name,
      place.address,
      place.category,
      place.lng,  // ST_MakePoint usa (longitude, latitude)
      place.lat,
      place.google_place_id,
      place.phone || null,
      place.website || null,
      place.rating || null,
      place.user_ratings_total || null
    ]);
  }
}

module.exports = CacheWriter;
