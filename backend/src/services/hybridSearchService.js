/**
 * Hybrid Search Service
 * 
 * Orquestra a busca híbrida entre banco de dados local e Google Places API.
 * Implementa estratégia inteligente de cache que prioriza o banco local (grátis)
 * e complementa com Google Places API (pago) apenas quando necessário.
 * 
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.5, 4.1, 4.2, 9.1, 9.2
 */

const pool = require('../db');
const GooglePlacesService = require('./googlePlacesService');
const { parseMany } = require('./googlePlacesParser');
const CacheWriter = require('./cacheWriter');
const APICallLogger = require('./apiLogger');

/**
 * Classe principal do serviço de busca híbrida
 */
class HybridSearchService {
  /**
   * @param {Object} config - Configuração do serviço
   * @param {Pool} config.pool - Pool de conexões do PostgreSQL
   * @param {string} config.googleApiKey - Chave da API do Google Places
   */
  constructor(config = {}) {
    this.pool = config.pool || pool;
    this.googleApiKey = config.googleApiKey || process.env.GOOGLE_PLACES_API_KEY;
    
    // Inicializar componentes
    this.googlePlacesService = new GooglePlacesService(this.googleApiKey);
    this.cacheWriter = new CacheWriter(this.pool);
    this.apiLogger = new APICallLogger(this.pool);
    
    // Configurações
    this.threshold = parseInt(process.env.MIN_RESULTS_THRESHOLD) || 10;
    this.maxRadius = parseInt(process.env.GOOGLE_SEARCH_RADIUS_LIMIT) || 5000;
  }
  
  /**
   * Executa busca híbrida com todos os filtros e otimizações
   * 
   * @param {Object} params - Parâmetros de busca
   * @param {number} params.lat - Latitude
   * @param {number} params.lng - Longitude
   * @param {number} params.radius - Raio de busca em metros
   * @param {string} [params.category] - Categoria(s) separadas por vírgula
   * @param {number} [params.minRating] - Rating mínimo
   * @param {boolean} [params.hasPhone] - Filtrar apenas lugares com telefone
   * @param {number} [params.limit] - Limite de resultados
   * @returns {Promise<Object>} Resposta com resultados combinados
   */
  async search(params) {
    const { lat, lng, radius, category, minRating, hasPhone, limit = 50 } = params;
    
    // Validar parâmetros obrigatórios
    if (!lat || !lng) {
      throw new Error('Parâmetros obrigatórios: lat, lng');
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseFloat(radius || 5000);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
      throw new Error('Coordenadas ou raio inválidos');
    }
    
    console.log(`[HybridSearch] Iniciando busca: lat=${latitude}, lng=${longitude}, radius=${radiusMeters}`);
    
    // 1. Busca local com todos os filtros (Requirement 1.1, 1.2)
    const localResults = await this.searchLocalDatabase({
      lat: latitude,
      lng: longitude,
      radius: radiusMeters,
      category,
      minRating,
      hasPhone,
      limit
    });
    
    console.log(`[HybridSearch] Resultados locais: ${localResults.length} (threshold: ${this.threshold})`);
    
    // 2. Verificar threshold (Requirement 2.1, 4.1, 4.2)
    if (localResults.length >= this.threshold) {
      return this.formatResponse({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        localResults,
        googleResults: [],
        fromRecentCache: false,
        radiusLimited: false
      });
    }
    
    // 3. Verificar cache recente (Requirement 9.1, 9.2)
    const recentCache = await this.checkRecentCache({
      lat: latitude,
      lng: longitude,
      radius: radiusMeters
    });
    
    if (recentCache) {
      console.log(`[HybridSearch] Cache recente encontrado, usando apenas resultados locais`);
      return this.formatResponse({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        localResults,
        googleResults: [],
        fromRecentCache: true,
        radiusLimited: false
      });
    }
    
    // 4. Chamar Google Places API (Requirement 2.2)
    try {
      const startTime = Date.now();
      
      const googleResults = await this.googlePlacesService.nearbySearch({
        location: { lat: latitude, lng: longitude },
        radius: radiusMeters,
        type: this.mapCategoryToGoogleType(category),
        keyword: category
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`[HybridSearch] Google Places API retornou ${googleResults.length} resultados em ${responseTime}ms`);
      
      // 5. Parse e merge (Requirement 2.5)
      // Usar a categoria buscada para os resultados do Google quando não há mapeamento
      const parsedResults = parseMany(googleResults).map(place => ({
        ...place,
        // Se a categoria ficou como 'Estabelecimento' e há uma categoria buscada, usar a categoria buscada
        category: (place.category === 'Estabelecimento' && category)
          ? category.split(',')[0].trim()
          : place.category
      }));
      const mergedResults = this.mergeAndDeduplicate(localResults, parsedResults);
      
      // 6. Log e cache (async) (Requirement 5.1)
      this.apiLogger.logCall({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        results_count: googleResults.length,
        response_time_ms: responseTime
      });
      
      this.cacheWriter.cacheResults(parsedResults);
      
      // Salvar no search_cache para evitar chamadas repetidas
      this.saveSearchCache(latitude, longitude, radiusMeters, mergedResults.length);
      
      // 7. Verificar se raio foi limitado
      const radiusLimited = this.googlePlacesService.isRadiusLimited(radiusMeters);
      
      return this.formatResponse({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        localResults,
        googleResults: parsedResults,
        fromRecentCache: false,
        radiusLimited,
        mergedResults
      });
      
    } catch (error) {
      // 8. Fallback para resultados locais (Requirement 2.3, 8.1-8.5)
      console.error(`[HybridSearch] Erro na API do Google:`, error.message);
      
      // Log do erro
      this.apiLogger.logError({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters
      }, error);
      
      return this.formatResponse({
        lat: latitude,
        lng: longitude,
        radius: radiusMeters,
        localResults,
        googleResults: [],
        fromRecentCache: false,
        radiusLimited: false,
        warning: this.getErrorMessage(error)
      });
    }
  }
  
  /**
   * Busca lugares no banco de dados local com todos os filtros
   * 
   * @private
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Array>} Array de lugares encontrados
   */
  async searchLocalDatabase(params) {
    const { lat, lng, radius, category, minRating, hasPhone, limit } = params;
    
    let query = `
      SELECT 
        id, 
        name, 
        category, 
        address,
        phone,
        website,
        rating,
        user_ratings_total,
        google_place_id,
        created_at,
        ST_X(location) as lng,
        ST_Y(location) as lat,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
      FROM places 
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;
    
    const queryParams = [lng, lat, radius];
    let paramCount = 4;
    
    // Filtro por categoria (pode ser múltiplas separadas por vírgula)
    if (category) {
      const categories = category.split(',').map(c => c.trim());
      const categoryConditions = categories.map((_, index) => {
        return `category ILIKE $${paramCount + index}`;
      });
      query += ` AND (${categoryConditions.join(' OR ')})`;
      categories.forEach(cat => queryParams.push(`%${cat}%`));
      paramCount += categories.length;
    }
    
    // Filtro por rating mínimo
    if (minRating) {
      query += ` AND rating >= $${paramCount}`;
      queryParams.push(parseFloat(minRating));
      paramCount++;
    }
    
    // Filtro por telefone
    if (hasPhone === 'true' || hasPhone === true) {
      query += ` AND phone IS NOT NULL AND phone != ''`;
    }
    
    query += ` ORDER BY distance_meters ASC LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    const result = await this.pool.query(query, queryParams);
    
    return result.rows.map(row => ({
      ...row,
      distance_km: (row.distance_meters / 1000).toFixed(2),
      metadata: {
        source: 'local',
        cached_at: row.created_at
      }
    }));
  }
  
  /**
   * Verifica se existe busca similar recente (últimas 24h, ±100m)
   * 
   * @private
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<boolean>} True se existe cache recente
   */
  async checkRecentCache(params) {
    const { lat, lng, radius } = params;
    
    const query = `
      SELECT COUNT(*) as count
      FROM search_cache
      WHERE status = 'completed'
        AND created_at > NOW() - INTERVAL '24 hours'
        AND radius = $1
        AND ABS(lat - $2) < 0.001
        AND ABS(lng - $3) < 0.001
    `;
    
    const result = await this.pool.query(query, [radius, lat, lng]);
    
    return result.rows[0].count > 0;
  }
  
  /**
   * Merge e remove duplicatas baseado em google_place_id
   * 
   * @private
   * @param {Array} localResults - Resultados locais
   * @param {Array} googleResults - Resultados do Google
   * @returns {Array} Resultados combinados sem duplicatas
   */
  mergeAndDeduplicate(localResults, googleResults) {
    const localPlaceIds = new Set(
      localResults
        .filter(r => r.google_place_id)
        .map(r => r.google_place_id)
    );
    
    // Adicionar apenas resultados do Google que não existem localmente
    const uniqueGoogleResults = googleResults
      .filter(r => !localPlaceIds.has(r.google_place_id))
      .map(r => ({
        ...r,
        metadata: {
          source: 'google'
        }
      }));
    
    return [...localResults, ...uniqueGoogleResults];
  }
  
  /**
   * Formata resposta final com metadata
   * 
   * @private
   * @param {Object} data - Dados para formatação
   * @returns {Object} Resposta formatada
   */
  formatResponse(data) {
    const { 
      lat, lng, radius, 
      localResults, googleResults, 
      fromRecentCache, radiusLimited, 
      warning, mergedResults 
    } = data;
    
    const results = mergedResults || localResults;
    
    return {
      center: { lat, lng },
      radius_meters: radius,
      total: results.length,
      summary: {
        local: localResults.length,
        google: googleResults.length,
        from_recent_cache: fromRecentCache,
        radius_limited: radiusLimited
      },
      data: results,
      warning: warning || null
    };
  }
  
  /**
   * Salva registro no search_cache após busca no Google
   * @private
   */
  async saveSearchCache(lat, lng, radius, resultCount) {
    setImmediate(async () => {
      try {
        await this.pool.query(`
          INSERT INTO search_cache (lat, lng, radius, results_count, status, created_at)
          VALUES ($1, $2, $3, $4, 'completed', NOW())
        `, [lat, lng, radius, resultCount]);
      } catch (err) {
        // Ignorar erros de cache silenciosamente
      }
    });
  }

  /**
   * Mapeia categoria local para tipo do Google Places
   * 
   * @private
   * @param {string} category - Categoria local
   * @returns {string|null} Tipo do Google Places
   */
  mapCategoryToGoogleType(category) {
    if (!category) return null;
    
    const categoryMap = {
      'Condomínio': 'lodging',
      'Hospital': 'hospital',
      'Universidade': 'university',
      'Escola': 'school',
      'Academia': 'gym',
      'Supermercado': 'supermarket',
      'Loja': 'store',
      'Shopping': 'shopping_mall',
      'Restaurante': 'restaurant'
    };
    
    return categoryMap[category] || null;
  }
  
  /**
   * Retorna mensagem de erro amigável baseada no erro da API
   * 
   * @private
   * @param {Error} error - Erro ocorrido
   * @returns {string} Mensagem de erro
   */
  getErrorMessage(error) {
    const errorMessages = {
      'INVALID_REQUEST': 'API key inválida - retornando apenas resultados locais',
      'REQUEST_DENIED': 'API key inválida - retornando apenas resultados locais',
      'OVER_QUERY_LIMIT': 'Limite de API atingido - retornando apenas resultados locais',
      'TIMEOUT': 'Timeout na API do Google - retornando apenas resultados locais',
      'UNKNOWN_ERROR': 'Erro na API do Google - retornando apenas resultados locais'
    };
    
    return errorMessages[error.message] || 'Erro de conexão com API do Google - retornando apenas resultados locais';
  }
}

module.exports = HybridSearchService;
