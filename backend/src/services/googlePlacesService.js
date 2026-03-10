/**
 * Google Places Service
 * 
 * Integração com Google Places API Nearby Search endpoint.
 * Implementa timeout de 5 segundos, limitação de raio e tratamento de erros.
 * 
 * Validates: Requirements 2.2, 7.1, 7.2, 7.3, 8.3
 */

const https = require('https');

/**
 * Classe para integração com Google Places API
 */
class GooglePlacesService {
  /**
   * @param {string} apiKey - Chave da API do Google Places
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Google Places API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.timeout = 5000; // 5 segundos (Requirement 8.3)
    this.maxRadius = parseInt(process.env.GOOGLE_SEARCH_RADIUS_LIMIT) || 5000; // Requirement 7.1, 7.2
  }
  
  /**
   * Busca lugares próximos usando Google Places API Nearby Search
   * 
   * @param {Object} params - Parâmetros de busca
   * @param {Object} params.location - Coordenadas de busca
   * @param {number} params.location.lat - Latitude
   * @param {number} params.location.lng - Longitude
   * @param {number} params.radius - Raio de busca em metros
   * @param {string} [params.type] - Tipo de lugar (opcional)
   * @param {string} [params.keyword] - Palavra-chave para busca (opcional)
   * @returns {Promise<Array>} Array de lugares encontrados
   * @throws {Error} Lança erro com status da API em caso de falha
   */
  async nearbySearch(params) {
    const { location, radius, type, keyword } = params;
    
    // Validar parâmetros obrigatórios
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new Error('INVALID_REQUEST: location with lat and lng is required');
    }
    
    if (!radius || typeof radius !== 'number' || radius <= 0) {
      throw new Error('INVALID_REQUEST: radius must be a positive number');
    }
    
    // Limitar raio se necessário (Requirement 7.3)
    const limitedRadius = Math.min(radius, this.maxRadius);
    
    // Construir URL da API
    const url = this.buildUrl(location, limitedRadius, type, keyword);
    
    // Executar requisição com timeout
    return this.executeRequest(url);
  }
  
  /**
   * Constrói a URL da API com os parâmetros fornecidos
   * 
   * @private
   * @param {Object} location - Coordenadas
   * @param {number} radius - Raio de busca
   * @param {string} [type] - Tipo de lugar
   * @param {string} [keyword] - Palavra-chave
   * @returns {string} URL completa da API
   */
  buildUrl(location, radius, type, keyword) {
    let url = `${this.baseUrl}/nearbysearch/json?` +
      `location=${location.lat},${location.lng}&` +
      `radius=${radius}&` +
      `key=${this.apiKey}`;
    
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    
    return url;
  }
  
  /**
   * Executa requisição HTTPS com timeout de 5 segundos
   * 
   * @private
   * @param {string} url - URL da API
   * @returns {Promise<Array>} Array de lugares ou array vazio
   * @throws {Error} Lança erro com status da API em caso de falha
   */
  executeRequest(url) {
    return new Promise((resolve, reject) => {
      // Configurar timeout de 5 segundos (Requirement 8.3)
      const timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, this.timeout);
      
      const request = https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          clearTimeout(timeoutId);
          
          try {
            const json = JSON.parse(data);
            
            // Tratar diferentes status de resposta (Requirement 7.3)
            if (json.status === 'OK') {
              // Sucesso - retornar resultados
              resolve(json.results || []);
            } else if (json.status === 'ZERO_RESULTS') {
              // Sem resultados - retornar array vazio
              resolve([]);
            } else if (json.status === 'INVALID_REQUEST') {
              // Erro de requisição inválida
              reject(new Error('INVALID_REQUEST'));
            } else if (json.status === 'OVER_QUERY_LIMIT') {
              // Quota excedida
              reject(new Error('OVER_QUERY_LIMIT'));
            } else if (json.status === 'REQUEST_DENIED') {
              // API key inválida ou requisição negada
              reject(new Error('REQUEST_DENIED'));
            } else if (json.status === 'UNKNOWN_ERROR') {
              // Erro desconhecido do servidor
              reject(new Error('UNKNOWN_ERROR'));
            } else {
              // Outro status não esperado
              reject(new Error(json.status || 'UNKNOWN_ERROR'));
            }
          } catch (err) {
            // Erro ao fazer parse do JSON
            reject(new Error('PARSE_ERROR'));
          }
        });
      });
      
      request.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }
  
  /**
   * Retorna o raio máximo configurado
   * 
   * @returns {number} Raio máximo em metros
   */
  getMaxRadius() {
    return this.maxRadius;
  }
  
  /**
   * Verifica se o raio foi limitado
   * 
   * @param {number} requestedRadius - Raio solicitado
   * @returns {boolean} True se o raio foi limitado
   */
  isRadiusLimited(requestedRadius) {
    return requestedRadius > this.maxRadius;
  }
}

module.exports = GooglePlacesService;
