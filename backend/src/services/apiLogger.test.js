/**
 * Unit Tests for API Call Logger
 * 
 * Tests the APICallLogger class functionality including:
 * - Logging successful API calls
 * - Logging failed API calls
 * - Cost calculation
 * - Error handling
 */

const APICallLogger = require('./apiLogger');

describe('APICallLogger', () => {
  let logger;
  let mockPool;
  
  beforeEach(() => {
    // Mock do pool de conexões
    mockPool = {
      query: jest.fn()
    };
    
    logger = new APICallLogger(mockPool);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('logCall', () => {
    it('should log successful API call with all parameters', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 15,
        response_time_ms: 1250
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_cache'),
        [
          params.lat,
          params.lng,
          params.radius,
          params.results_count,
          params.response_time_ms,
          0.032 // estimated cost
        ]
      );
    });
    
    it('should save log with status "completed"', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 10,
        response_time_ms: 1000
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      const query = mockPool.query.mock.calls[0][0];
      expect(query).toContain("'completed'");
    });
    
    it('should include estimated cost in log', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 20,
        response_time_ms: 1500
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      const queryParams = mockPool.query.mock.calls[0][1];
      expect(queryParams[5]).toBe(0.032); // estimated_cost
    });
    
    it('should not throw error if database insert fails', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 10,
        response_time_ms: 1000
      };
      
      mockPool.query.mockRejectedValue(new Error('Database error'));
      
      // Não deve lançar erro
      await expect(logger.logCall(params)).resolves.not.toThrow();
    });
    
    it('should log error to console if database insert fails', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 10,
        response_time_ms: 1000
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPool.query.mockRejectedValue(new Error('Database error'));
      
      await logger.logCall(params);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[APICallLogger]'),
        expect.any(String)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('logError', () => {
    it('should log failed API call with error message', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      };
      
      const error = new Error('OVER_QUERY_LIMIT');
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logError(params, error);
      
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_cache'),
        [
          params.lat,
          params.lng,
          params.radius,
          'OVER_QUERY_LIMIT'
        ]
      );
    });
    
    it('should save log with status "failed"', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      };
      
      const error = new Error('TIMEOUT');
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logError(params, error);
      
      const query = mockPool.query.mock.calls[0][0];
      expect(query).toContain("'failed'");
    });
    
    it('should handle error without message', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      };
      
      const error = new Error();
      error.message = '';
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logError(params, error);
      
      const queryParams = mockPool.query.mock.calls[0][1];
      expect(queryParams[3]).toBe('Unknown error');
    });
    
    it('should not throw error if database insert fails', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      };
      
      const error = new Error('API_ERROR');
      
      mockPool.query.mockRejectedValue(new Error('Database error'));
      
      // Não deve lançar erro
      await expect(logger.logError(params, error)).resolves.not.toThrow();
    });
    
    it('should log error to console if database insert fails', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000
      };
      
      const error = new Error('API_ERROR');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPool.query.mockRejectedValue(new Error('Database error'));
      
      await logger.logError(params, error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[APICallLogger]'),
        expect.any(String)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('calculateCost', () => {
    it('should return $0.032 for Nearby Search', () => {
      const cost = logger.calculateCost(10);
      expect(cost).toBe(0.032);
    });
    
    it('should return same cost regardless of results count', () => {
      // Nearby Search tem custo fixo por requisição
      expect(logger.calculateCost(0)).toBe(0.032);
      expect(logger.calculateCost(5)).toBe(0.032);
      expect(logger.calculateCost(20)).toBe(0.032);
      expect(logger.calculateCost(100)).toBe(0.032);
    });
    
    it('should return cost as a number', () => {
      const cost = logger.calculateCost(15);
      expect(typeof cost).toBe('number');
    });
    
    it('should return cost with correct precision', () => {
      const cost = logger.calculateCost(10);
      expect(cost.toFixed(3)).toBe('0.032');
    });
  });
  
  describe('constructor', () => {
    it('should use provided pool', () => {
      const customPool = { query: jest.fn() };
      const customLogger = new APICallLogger(customPool);
      
      expect(customLogger.pool).toBe(customPool);
    });
    
    it('should use default pool if not provided', () => {
      const defaultLogger = new APICallLogger();
      
      expect(defaultLogger.pool).toBeDefined();
    });
  });
  
  describe('edge cases', () => {
    it('should handle zero results count', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 0,
        response_time_ms: 500
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0])
      );
    });
    
    it('should handle very large results count', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 1000,
        response_time_ms: 3000
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([1000])
      );
    });
    
    it('should handle negative coordinates', async () => {
      const params = {
        lat: -89.9999,
        lng: -179.9999,
        radius: 1000,
        results_count: 5,
        response_time_ms: 800
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([-89.9999, -179.9999])
      );
    });
    
    it('should handle very fast response times', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 10,
        response_time_ms: 50
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([50])
      );
    });
    
    it('should handle very slow response times', async () => {
      const params = {
        lat: -23.1858,
        lng: -46.8978,
        radius: 5000,
        results_count: 10,
        response_time_ms: 4999
      };
      
      mockPool.query.mockResolvedValue({ rows: [] });
      
      await logger.logCall(params);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([4999])
      );
    });
  });
});
