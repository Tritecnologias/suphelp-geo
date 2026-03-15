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
      let saved = 0;
      let errors = 0;
      for (const place of places) {
        try {
          await this.cacheSingle(place);
          saved++;
        } catch (err) {
          errors++;
          console.error('[CacheWriter] Erro ao cachear lugar:', err.message, 'place:', place?.name, 'google_place_id:', place?.google_place_id);
        }
      }
      console.log(`[CacheWriter] Cache concluído: ${saved} salvos, ${errors} erros de ${places.length} total`);
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
    if (!place.google_place_id) {
      // Sem google_place_id, inserir apenas se não existe pelo nome+endereço
      const query = `
        INSERT INTO places (
          name, address, category, location,
          phone, website, rating, user_ratings_total
        )
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `;
      await this.pool.query(query, [
        place.name, place.address, place.category,
        place.lng, place.lat,
        place.phone || null, place.website || null,
        place.rating || null, place.user_ratings_total || null
      ]);
      return;
    }

    // Com google_place_id: verificar se já existe e inserir/atualizar
    const existing = await this.pool.query(
      'SELECT id FROM places WHERE google_place_id = $1',
      [place.google_place_id]
    );

    if (existing.rows.length > 0) {
      // Atualizar campos vazios + categoria
      await this.pool.query(`
        UPDATE places SET
          phone = COALESCE(phone, $1),
          website = COALESCE(website, $2),
          rating = COALESCE(rating, $3),
          user_ratings_total = COALESCE(user_ratings_total, $4),
          category = CASE WHEN category = 'Estabelecimento' OR category IS NULL THEN $5 ELSE category END
        WHERE google_place_id = $6
      `, [
        place.phone || null, place.website || null,
        place.rating || null, place.user_ratings_total || null,
        place.category, place.google_place_id
      ]);
    } else {
      // Inserir novo
      await this.pool.query(`
        INSERT INTO places (
          name, address, category, location, google_place_id,
          phone, website, rating, user_ratings_total
        )
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10)
      `, [
        place.name, place.address, place.category,
        place.lng, place.lat, place.google_place_id,
        place.phone || null, place.website || null,
        place.rating || null, place.user_ratings_total || null
      ]);
    }
  }
}

module.exports = CacheWriter;
