/**
 * Unit Tests for Google Places Service
 * 
 * Tests the integration with Google Places API including:
 * - Timeout configuration (5 seconds)
 * - Radius limiting based on GOOGLE_SEARCH_RADIUS_LIMIT
 * - Different API response statuses (OK, ZERO_RESULTS, errors)
 * 
 * Validates: Requirements 2.2, 7.1, 7.2, 7.3, 8.3
 */

const GooglePlacesService = require('./googlePlacesService');
const https = require('https');

// Mock do módulo https
jest.mock('https');

describe('GooglePlacesService', () => {
  let service;
  const mockApiKey = 'test_api_key_123';
  
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
    
    // Criar nova instância do serviço
    service = new GooglePlacesService(mockApiKey);
  });
  
  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new GooglePlacesService()).toThrow('Google Places API key is required');
      expect(() => new GooglePlacesService('')).toThrow('Google Places API key is required');
      expect(() => new GooglePlacesService(null)).toThrow('Google Places API key is required');
    });
    
    it('should initialize with correct default values', () => {
      const service = new GooglePlacesService(mockApiKey);
      
      expect(service.apiKey).toBe(mockApiKey);
      expect(service.baseUrl).toBe('https://maps.googleapis.com/maps/api/place');
      expect(service.timeout).toBe(5000); // Requirement 8.3
    });
    
    it('should use GOOGLE_SEARCH_RADIUS_LIMIT from environment', () => {
      process.env.GOOGLE_SEARCH_RADIUS_LIMIT = '10000';
      const service = new GooglePlacesService(mockApiKey);
      
      expect(service.maxRadius).toBe(10000); // Requirement 7.1
      
      delete process.env.GOOGLE_SEARCH_RADIUS_LIMIT;
    });
    
    it('should use default radius limit of 5000 when not configured', () => {
      delete process.env.GOOGLE_SEARCH_RADIUS_LIMIT;
      const service = new GooglePlacesService(mockApiKey);
      
      expect(service.maxRadius).toBe(5000); // Requirement 7.2
    });
  });
  
  describe('buildUrl', () => {
    it('should build correct URL with required parameters', () => {
      const location = { lat: -23.1858, lng: -46.8978 };
      const radius = 5000;
      
      const url = service.buildUrl(location, radius);
      
      expect(url).toContain('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      expect(url).toContain('location=-23.1858,-46.8978');
      expect(url).toContain('radius=5000');
      expect(url).toContain(`key=${mockApiKey}`);
    });
    
    it('should include type parameter when provided', () => {
      const location = { lat: -23.1858, lng: -46.8978 };
      const radius = 5000;
      const type = 'hospital';
      
      const url = service.buildUrl(location, radius, type);
      
      expect(url).toContain('type=hospital');
    });
    
    it('should include keyword parameter when provided', () => {
      const location = { lat: -23.1858, lng: -46.8978 };
      const radius = 5000;
      const type = null;
      const keyword = 'emergency';
      
      const url = service.buildUrl(location, radius, type, keyword);
      
      expect(url).toContain('keyword=emergency');
    });
    
    it('should encode special characters in parameters', () => {
      const location = { lat: -23.1858, lng: -46.8978 };
      const radius = 5000;
      const keyword = 'hospital são paulo';
      
      const url = service.buildUrl(location, radius, null, keyword);
      
      expect(url).toContain('keyword=hospital%20s%C3%A3o%20paulo');
    });
  });
  
  describe('nearbySearch', () => {
    it('should validate required location parameter', async () => {
      await expect(service.nearbySearch({ radius: 5000 }))
        .rejects.toThrow('INVALID_REQUEST: location with lat and lng is required');
    });
    
    it('should validate location.lat is a number', async () => {
      await expect(service.nearbySearch({ 
        location: { lat: '23', lng: -46.8978 }, 
        radius: 5000 
      })).rejects.toThrow('INVALID_REQUEST: location with lat and lng is required');
    });
    
    it('should validate location.lng is a number', async () => {
      await expect(service.nearbySearch({ 
        location: { lat: -23.1858, lng: '-46' }, 
        radius: 5000 
      })).rejects.toThrow('INVALID_REQUEST: location with lat and lng is required');
    });
    
    it('should validate required radius parameter', async () => {
      await expect(service.nearbySearch({ 
        location: { lat: -23.1858, lng: -46.8978 }
      })).rejects.toThrow('INVALID_REQUEST: radius must be a positive number');
    });
    
    it('should validate radius is a positive number', async () => {
      await expect(service.nearbySearch({ 
        location: { lat: -23.1858, lng: -46.8978 }, 
        radius: -1000 
      })).rejects.toThrow('INVALID_REQUEST: radius must be a positive number');
      
      await expect(service.nearbySearch({ 
        location: { lat: -23.1858, lng: -46.8978 }, 
        radius: 0 
      })).rejects.toThrow('INVALID_REQUEST: radius must be a positive number');
    });
    
    it('should limit radius to maxRadius when exceeded (Requirement 7.3)', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{ name: 'Test Place' }]
      };
      
      mockHttpsGet(mockResponse);
      
      service.maxRadius = 5000;
      await service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 10000 // Maior que maxRadius
      });
      
      // Verificar que a URL chamada usou o raio limitado
      const calledUrl = https.get.mock.calls[0][0];
      expect(calledUrl).toContain('radius=5000');
      expect(calledUrl).not.toContain('radius=10000');
    });
    
    it('should return results when API responds with OK status', async () => {
      const mockResults = [
        { name: 'Place 1', place_id: 'id1' },
        { name: 'Place 2', place_id: 'id2' }
      ];
      
      mockHttpsGet({ status: 'OK', results: mockResults });
      
      const results = await service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      });
      
      expect(results).toEqual(mockResults);
    });
    
    it('should return empty array when API responds with ZERO_RESULTS', async () => {
      mockHttpsGet({ status: 'ZERO_RESULTS' });
      
      const results = await service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      });
      
      expect(results).toEqual([]);
    });
    
    it('should throw error when API responds with INVALID_REQUEST', async () => {
      mockHttpsGet({ status: 'INVALID_REQUEST' });
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('INVALID_REQUEST');
    });
    
    it('should throw error when API responds with OVER_QUERY_LIMIT', async () => {
      mockHttpsGet({ status: 'OVER_QUERY_LIMIT' });
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('OVER_QUERY_LIMIT');
    });
    
    it('should throw error when API responds with REQUEST_DENIED', async () => {
      mockHttpsGet({ status: 'REQUEST_DENIED' });
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('REQUEST_DENIED');
    });
    
    it('should throw error when API responds with UNKNOWN_ERROR', async () => {
      mockHttpsGet({ status: 'UNKNOWN_ERROR' });
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('UNKNOWN_ERROR');
    });
    
    it('should throw TIMEOUT error after 5 seconds (Requirement 8.3)', async () => {
      // Mock de requisição que nunca responde
      mockHttpsGetWithDelay(10000); // 10 segundos
      
      const startTime = Date.now();
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('TIMEOUT');
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(6000); // Deve falhar antes de 6 segundos
      expect(elapsed).toBeGreaterThanOrEqual(5000); // Mas depois de 5 segundos
    }, 7000); // Timeout do Jest maior que o timeout do serviço
    
    it('should handle network errors', async () => {
      mockHttpsGetWithError(new Error('Network error'));
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('Network error');
    });
    
    it('should handle JSON parse errors', async () => {
      mockHttpsGetWithInvalidJson();
      
      await expect(service.nearbySearch({
        location: { lat: -23.1858, lng: -46.8978 },
        radius: 5000
      })).rejects.toThrow('PARSE_ERROR');
    });
  });
  
  describe('getMaxRadius', () => {
    it('should return configured max radius', () => {
      service.maxRadius = 8000;
      expect(service.getMaxRadius()).toBe(8000);
    });
  });
  
  describe('isRadiusLimited', () => {
    it('should return true when requested radius exceeds max', () => {
      service.maxRadius = 5000;
      expect(service.isRadiusLimited(10000)).toBe(true);
      expect(service.isRadiusLimited(5001)).toBe(true);
    });
    
    it('should return false when requested radius is within limit', () => {
      service.maxRadius = 5000;
      expect(service.isRadiusLimited(5000)).toBe(false);
      expect(service.isRadiusLimited(4999)).toBe(false);
      expect(service.isRadiusLimited(1000)).toBe(false);
    });
  });
});

// Helper functions para mockar https.get

function mockHttpsGet(responseData) {
  const mockRequest = {
    on: jest.fn((event, callback) => {
      if (event === 'error') {
        // Não chamar callback de erro
      }
      return mockRequest;
    })
  };
  
  https.get.mockImplementation((url, callback) => {
    const mockResponse = {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          handler(JSON.stringify(responseData));
        } else if (event === 'end') {
          handler();
        }
      })
    };
    
    callback(mockResponse);
    return mockRequest;
  });
}

function mockHttpsGetWithDelay(delayMs) {
  const mockRequest = {
    on: jest.fn((event, callback) => {
      if (event === 'error') {
        // Não chamar callback de erro
      }
      return mockRequest;
    })
  };
  
  https.get.mockImplementation((url, callback) => {
    // Nunca chamar o callback - simular timeout
    return mockRequest;
  });
}

function mockHttpsGetWithError(error) {
  const mockRequest = {
    on: jest.fn((event, callback) => {
      if (event === 'error') {
        setTimeout(() => callback(error), 10);
      }
      return mockRequest;
    })
  };
  
  https.get.mockImplementation(() => mockRequest);
}

function mockHttpsGetWithInvalidJson() {
  const mockRequest = {
    on: jest.fn((event, callback) => {
      if (event === 'error') {
        // Não chamar callback de erro
      }
      return mockRequest;
    })
  };
  
  https.get.mockImplementation((url, callback) => {
    const mockResponse = {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          handler('invalid json {{{');
        } else if (event === 'end') {
          handler();
        }
      })
    };
    
    callback(mockResponse);
    return mockRequest;
  });
}
