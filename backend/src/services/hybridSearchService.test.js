/**
 * Tests for Hybrid Search Service
 * 
 * Validates the orchestration of hybrid search between local database
 * and Google Places API with all filters and optimizations.
 */

const HybridSearchService = require('./hybridSearchService');
const GooglePlacesService = require('./googlePlacesService');
const { parseMany } = require('./googlePlacesParser');
const CacheWriter = require('./cacheWriter');
const APICallLogger = require('./apiLogger');

// Mock dependencies
jest.mock('./googlePlacesService');
jest.mock('./googlePlacesParser');
jest.mock('./cacheWriter');
jest.mock('./apiLogger');

describe('HybridSearchService', () => {
  let service;
  let mockPool;
  let mockGooglePlacesService;
  let mockCacheWriter;
  let mockApiLogger;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock pool
    mockPool = {
      query: jest.fn()
    };
    
    // Mock Google Places Service
    mockGooglePlacesService = {
      nearbySearch: jest.fn(),
      isRadiusLimited: jest.fn()
    };
    GooglePlacesService.mockImplementation(() => mockGooglePlacesService);
    
    // Mock Cache Writer
    mockCacheWriter = {
      cacheResults: jest.fn()
    };
    CacheWriter.mockImplementation(() => mockCacheWriter);
    
    // Mock API Logger
    mockApiLogger = {
      logCall: jest.fn(),
      logError: jest.fn()
    };
    APICallLogger.mockImplementation(() => mockApiLogger);
    
    // Mock parser
    parseMany.mockImplementation(places => places.map(p => ({
      ...p,
      name: p.name,
      address: p.formatted_address,
      category: 'Estabelecimento',
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      google_place_id: p.place_id
    })));
    
    // Create service instance
    service = new HybridSearchService({
      pool: mockPool,
      googleApiKey: 'test-api-key'
    });
  });
  
  describe('Property 1: Busca Local Sempre Executada Primeiro', () => {
    it('should always execute local search before any Google API call', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: Array(15).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Place ${i + 1}`,
          category: 'Condomínio',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }))
      });
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockGooglePlacesService.nearbySearch).not.toHaveBeenCalled();
    });
  });
  
  describe('Property 2: Filtros Aplicados na Busca Local', () => {
    it('should apply all filters to local database search', async () => {
      // Arrange
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        category: 'Hospital',
        minRating: 4.0,
        hasPhone: true,
        limit: 20
      };
      
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockGooglePlacesService.nearbySearch.mockResolvedValue([]);
      
      // Act
      await service.search(params);
      
      // Assert
      const localSearchCall = mockPool.query.mock.calls[0];
      const query = localSearchCall[0];
      const queryParams = localSearchCall[1];
      
      expect(query).toContain('ST_DWithin'); // Raio
      expect(query).toContain('category ILIKE'); // Categoria
      expect(query).toContain('rating >='); // Rating mínimo
      expect(query).toContain('phone IS NOT NULL'); // Telefone
      expect(query).toContain('LIMIT'); // Limite
      
      expect(queryParams).toContain(-46.8978); // lng
      expect(queryParams).toContain(-23.1858); // lat
      expect(queryParams).toContain(5000); // radius
      expect(queryParams).toContain('%Hospital%'); // category
      expect(queryParams).toContain(4.0); // minRating
      expect(queryParams).toContain(20); // limit
    });
    
    it('should handle multiple categories separated by comma', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      mockGooglePlacesService.nearbySearch.mockResolvedValue([]);
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        category: 'Hospital,Academia,Supermercado'
      });
      
      // Assert
      const localSearchCall = mockPool.query.mock.calls[0];
      const query = localSearchCall[0];
      const queryParams = localSearchCall[1];
      
      expect(query).toContain('category ILIKE');
      expect(query).toContain('OR');
      expect(queryParams).toContain('%Hospital%');
      expect(queryParams).toContain('%Academia%');
      expect(queryParams).toContain('%Supermercado%');
    });
  });
  
  describe('Property 3: Marcação de Origem dos Resultados', () => {
    it('should mark local results with source "local"', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: Array(15).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Local Place ${i + 1}`,
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }))
      });
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.data[0].metadata.source).toBe('local');
      expect(result.data[0].metadata.cached_at).toBeDefined();
    });
    
    it('should mark Google results with source "google"', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Local search
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Cache check
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue([{
        place_id: 'google-123',
        name: 'Google Place',
        formatted_address: 'Google Address',
        geometry: { location: { lat: -23.1858, lng: -46.8978 } },
        types: ['hospital']
      }]);
      
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      const googleResult = result.data.find(r => r.google_place_id === 'google-123');
      expect(googleResult.metadata.source).toBe('google');
      expect(googleResult.metadata.cached_at).toBeUndefined();
    });
  });
  
  describe('Property 4: Fallback para Google Places', () => {
    it('should call Google API when local results < threshold', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: Array(5).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Place ${i + 1}`,
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }))
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // No recent cache
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue([]);
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(mockGooglePlacesService.nearbySearch).toHaveBeenCalledWith({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000,
        type: null,
        keyword: undefined
      });
    });
    
    it('should NOT call Google API when local results >= threshold', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: Array(15).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Place ${i + 1}`,
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }))
      });
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(mockGooglePlacesService.nearbySearch).not.toHaveBeenCalled();
    });
  });
  
  describe('Property 6: Remoção de Duplicatas', () => {
    it('should remove duplicates based on google_place_id', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Local Place',
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          google_place_id: 'duplicate-123',
          distance_meters: 1000,
          created_at: new Date()
        }]
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue([
        {
          place_id: 'duplicate-123',
          name: 'Duplicate Place',
          formatted_address: 'Duplicate Address',
          geometry: { location: { lat: -23.1858, lng: -46.8978 } },
          types: ['hospital']
        },
        {
          place_id: 'unique-456',
          name: 'Unique Place',
          formatted_address: 'Unique Address',
          geometry: { location: { lat: -23.1858, lng: -46.8978 } },
          types: ['hospital']
        }
      ]);
      
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.total).toBe(2); // 1 local + 1 unique Google
      expect(result.data.filter(r => r.google_place_id === 'duplicate-123')).toHaveLength(1);
      expect(result.data.find(r => r.google_place_id === 'unique-456')).toBeDefined();
    });
  });
  
  describe('Property 7: Cache Automático de Resultados', () => {
    it('should cache Google results automatically', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      const googleResults = [{
        place_id: 'google-123',
        name: 'Google Place',
        formatted_address: 'Google Address',
        geometry: { location: { lat: -23.1858, lng: -46.8978 } },
        types: ['hospital']
      }];
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue(googleResults);
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(mockCacheWriter.cacheResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            google_place_id: 'google-123'
          })
        ])
      );
    });
  });
  
  describe('Property 12: Logging Completo de Chamadas à API', () => {
    it('should log successful API calls with all metadata', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue([
        { place_id: '1', name: 'Place 1', formatted_address: 'Addr 1', geometry: { location: { lat: -23.1858, lng: -46.8978 } }, types: ['hospital'] },
        { place_id: '2', name: 'Place 2', formatted_address: 'Addr 2', geometry: { location: { lat: -23.1858, lng: -46.8978 } }, types: ['hospital'] }
      ]);
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(mockApiLogger.logCall).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: -23.1858,
          lng: -46.8978,
          radius: 5000,
          results_count: 2,
          response_time_ms: expect.any(Number)
        })
      );
    });
    
    it('should log API errors', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      const error = new Error('OVER_QUERY_LIMIT');
      mockGooglePlacesService.nearbySearch.mockRejectedValue(error);
      
      // Act
      await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(mockApiLogger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: -23.1858,
          lng: -46.8978,
          radius: 5000
        }),
        error
      );
    });
  });
  
  describe('Property 14: Resumo de Resultados por Origem', () => {
    it('should include correct summary counts', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: Array(3).fill(null).map((_, i) => ({
          id: i + 1,
          name: `Local ${i + 1}`,
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }))
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue([
        { place_id: '1', name: 'Google 1', formatted_address: 'Addr 1', geometry: { location: { lat: -23.1858, lng: -46.8978 } }, types: ['hospital'] },
        { place_id: '2', name: 'Google 2', formatted_address: 'Addr 2', geometry: { location: { lat: -23.1858, lng: -46.8978 } }, types: ['hospital'] }
      ]);
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.summary.local).toBe(3);
      expect(result.summary.google).toBe(2);
      expect(result.total).toBe(5);
    });
  });
  
  describe('Property 16: Tratamento de Erros da API', () => {
    it('should return local results with warning on API error', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Local Place',
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }]
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      mockGooglePlacesService.nearbySearch.mockRejectedValue(new Error('TIMEOUT'));
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.warning).toBe('Timeout na API do Google - retornando apenas resultados locais');
      expect(result.summary.local).toBe(1);
      expect(result.summary.google).toBe(0);
    });
    
    it('should handle INVALID_REQUEST error', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      mockGooglePlacesService.nearbySearch.mockRejectedValue(new Error('INVALID_REQUEST'));
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.warning).toBe('API key inválida - retornando apenas resultados locais');
    });
    
    it('should handle OVER_QUERY_LIMIT error', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      
      mockGooglePlacesService.nearbySearch.mockRejectedValue(new Error('OVER_QUERY_LIMIT'));
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.warning).toBe('Limite de API atingido - retornando apenas resultados locais');
    });
  });
  
  describe('Property 17: Cache Temporal de Buscas', () => {
    it('should use local results when recent cache exists', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Local Place',
          category: 'Hospital',
          address: 'Test Address',
          lat: -23.1858,
          lng: -46.8978,
          distance_meters: 1000,
          created_at: new Date()
        }]
      });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }); // Recent cache exists
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.summary.from_recent_cache).toBe(true);
      expect(mockGooglePlacesService.nearbySearch).not.toHaveBeenCalled();
    });
    
    it('should call API when no recent cache exists', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: 0 }] }); // No recent cache
      
      mockGooglePlacesService.nearbySearch.mockResolvedValue([]);
      mockGooglePlacesService.isRadiusLimited.mockReturnValue(false);
      
      // Act
      const result = await service.search({
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      });
      
      // Assert
      expect(result.summary.from_recent_cache).toBe(false);
      expect(mockGooglePlacesService.nearbySearch).toHaveBeenCalled();
    });
  });
  
  describe('Validation', () => {
    it('should throw error when lat/lng missing', async () => {
      await expect(service.search({ radius: 5000 }))
        .rejects.toThrow('Parâmetros obrigatórios: lat, lng');
    });
    
    it('should throw error when coordinates are invalid', async () => {
      await expect(service.search({ lat: 'invalid', lng: 'invalid', radius: 5000 }))
        .rejects.toThrow('Coordenadas ou raio inválidos');
    });
  });
});
