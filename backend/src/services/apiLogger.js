/**
 * API Call Logger
 * 
 * Registra todas as chamadas à Google Places API na tabela search_cache
 * para monitoramento de custos e otimização.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

const pool = require('../db');

/**
 * Classe para registrar chamadas à API do Google Places
 */
class APICallLogger {
  /**
   * @param {Object} dbPool - Pool de conexões do PostgreSQL
   */
  constructor(dbPool = pool) {
    this.pool = dbPool;
  }
  
  /**
   * Registra uma chamada bem-sucedida à API
   * 
   * @param {Object} params - Parâmetros da chamada
   * @param {number} params.lat - Latitude da busca
   * @param {number} params.lng - Longitude da busca
   * @param {number} params.radius - Raio de busca em metros
   * @param {number} params.results_count - Número de resultados retornados
   * @param {number} params.response_time_ms - Tempo de resposta em milissegundos
   * @returns {Promise<void>}
   */
  async logCall(params) {
    const { lat, lng, radius, results_count, response_time_ms } = params;
    
    // Calcular custo estimado (Requirement 5.5)
    const estimatedCost = this.calculateCost(results_count);
    
    const query = `
      INSERT INTO search_cache (
        lat, lng, radius, results_count, 
        response_time_ms, estimated_cost, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'completed')
    `;
    
    try {
      await this.pool.query(query, [
        lat,
        lng,
        radius,
        results_count,
        response_time_ms,
        estimatedCost
      ]);
    } catch (err) {
      // Não bloquear a aplicação se o log falhar
      console.error('[APICallLogger] Erro ao salvar log de chamada:', err.message);
    }
  }
  
  /**
   * Registra uma chamada com erro à API
   * 
   * @param {Object} params - Parâmetros da chamada
   * @param {number} params.lat - Latitude da busca
   * @param {number} params.lng - Longitude da busca
   * @param {number} params.radius - Raio de busca em metros
   * @param {Error} error - Erro ocorrido
   * @returns {Promise<void>}
   */
  async logError(params, error) {
    const { lat, lng, radius } = params;
    
    const query = `
      INSERT INTO search_cache (
        lat, lng, radius, error_message, status
      )
      VALUES ($1, $2, $3, $4, 'failed')
    `;
    
    try {
      await this.pool.query(query, [
        lat,
        lng,
        radius,
        error.message || 'Unknown error'
      ]);
    } catch (err) {
      // Não bloquear a aplicação se o log falhar
      console.error('[APICallLogger] Erro ao salvar log de erro:', err.message);
    }
  }
  
  /**
   * Calcula o custo estimado de uma chamada à API
   * 
   * Google Places API Pricing (2024):
   * - Nearby Search: $0.032 por requisição
   * - Place Details: $0.017 por requisição (não usado nesta implementação)
   * 
   * @param {number} resultsCount - Número de resultados retornados
   * @returns {number} Custo estimado em USD
   */
  calculateCost(resultsCount) {
    // Custo base do Nearby Search
    const nearbySearchCost = 0.032;
    
    // Nesta implementação, não estamos chamando Place Details
    // então o custo é apenas do Nearby Search
    return nearbySearchCost;
  }
}

module.exports = APICallLogger;
