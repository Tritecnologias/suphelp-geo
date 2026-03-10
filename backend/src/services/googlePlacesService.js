/**
 * Google Places Service
 * 
 * Integração com Google Places API (New) Nearby Search endpoint.
 * Implementa timeout de 5 segundos, limitação de raio e tratamento de erros.
 * 
 * Validates: Requirements 2.2, 7.1, 7.2, 7.3, 8.3
 */

const https = require('https');

/**
 * Classe para integração com Google Places API (New)
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
    this.timeout = 5000; // 5 segundos (Requirement 8.3)
    this.maxRadius = parseInt(process.env.GOOGLE_SEARCH_RADIUS_LIMIT) || 5000; // Requirement 7.1, 7.2
  }
  
  /**
   * Busca lugares próximos usando Google Places API (New) Nearby Search
   */
  async nearbySearch(params) {
    const { location, radius, type, keyword } = params;
    
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new Error('INVALID_REQUEST: location with lat and lng is required');
    }
    
    if (!radius || typeof radius !== 'number' || radius <= 0) {
      throw new Error('INVALID_REQUEST: radius must be a positive number');
    }
    
    // Limitar raio se necessário (Requirement 7.3)
    const limitedRadius = Math.min(radius, this.maxRadius);
    
    // Executar requisição com a API New
    return this.executeNewApiRequest(location, limitedRadius, type, keyword);
  }

  /**
   * Executa requisição na Places API (New) com timeout de 5 segundos
   */
  executeNewApiRequest(location, radius, type, keyword) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, this.timeout);

      // Construir body da requisição
      const body = {
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        },
        maxResultCount: 20
      };

      // Adicionar tipo se fornecido
      if (type) {
        body.includedTypes = [type];
      }

      // Adicionar keyword como textQuery se fornecido
      if (keyword) {
        body.languageCode = 'pt-BR';
      }

      const postData = JSON.stringify(body);

      const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.types',
        'places.rating',
        'places.userRatingCount',
        'places.nationalPhoneNumber',
        'places.websiteUri'
      ].join(',');

      const options = {
        hostname: 'places.googleapis.com',
        path: '/v1/places:searchNearby',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': fieldMask,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const request = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => { data += chunk; });
        
        res.on('end', () => {
          clearTimeout(timeoutId);
          
          try {
            const json = JSON.parse(data);
            
            if (json.error) {
              const status = json.error.status || 'UNKNOWN_ERROR';
              reject(new Error(status));
              return;
            }
            
            // Converter formato da API New para formato legado
            const results = (json.places || []).map(place => ({
              place_id: place.id,
              name: place.displayName?.text || '',
              formatted_address: place.formattedAddress || '',
              geometry: {
                location: {
                  lat: place.location?.latitude,
                  lng: place.location?.longitude
                }
              },
              types: place.types || [],
              rating: place.rating,
              user_ratings_total: place.userRatingCount,
              formatted_phone_number: place.nationalPhoneNumber,
              website: place.websiteUri
            }));
            
            resolve(results);
          } catch (err) {
            reject(new Error('PARSE_ERROR'));
          }
        });
      });

      request.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });

      request.write(postData);
      request.end();
    });
  }
  
  getMaxRadius() {
    return this.maxRadius;
  }
  
  isRadiusLimited(requestedRadius) {
    return requestedRadius > this.maxRadius;
  }
}

module.exports = GooglePlacesService;
