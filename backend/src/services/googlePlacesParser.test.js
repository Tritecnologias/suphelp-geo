/**
 * Unit Tests for Google Places Parser
 */

const { parse, parseMany, mapCategory } = require('./googlePlacesParser');

describe('googlePlacesParser', () => {
  describe('mapCategory', () => {
    it('should map known Google types to local categories', () => {
      expect(mapCategory('lodging')).toBe('Condomínio');
      expect(mapCategory('hospital')).toBe('Hospital');
      expect(mapCategory('university')).toBe('Universidade');
      expect(mapCategory('gym')).toBe('Academia');
      expect(mapCategory('supermarket')).toBe('Supermercado');
    });
    
    it('should return default category for unknown types', () => {
      expect(mapCategory('unknown_type')).toBe('Estabelecimento');
      expect(mapCategory('random_category')).toBe('Estabelecimento');
    });
  });
  
  describe('parse', () => {
    const validGooglePlace = {
      name: 'Hospital São Paulo',
      formatted_address: 'Rua Exemplo, 123 - Jundiaí, SP',
      geometry: {
        location: {
          lat: -23.1858,
          lng: -46.8978
        }
      },
      types: ['hospital', 'health'],
      place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      rating: 4.5,
      user_ratings_total: 120,
      formatted_phone_number: '(11) 1234-5678',
      website: 'https://hospital.com'
    };
    
    it('should convert all required fields correctly', () => {
      const result = parse(validGooglePlace);
      
      expect(result.name).toBe('Hospital São Paulo');
      expect(result.address).toBe('Rua Exemplo, 123 - Jundiaí, SP');
      expect(result.category).toBe('Hospital');
      expect(result.lat).toBe(-23.1858);
      expect(result.lng).toBe(-46.8978);
      expect(result.google_place_id).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
    });
    
    it('should convert all optional fields correctly', () => {
      const result = parse(validGooglePlace);
      
      expect(result.phone).toBe('(11) 1234-5678');
      expect(result.website).toBe('https://hospital.com');
      expect(result.rating).toBe(4.5);
      expect(result.user_ratings_total).toBe(120);
    });
    
    it('should handle missing optional fields with null', () => {
      const placeWithoutOptionals = {
        name: 'Lugar Simples',
        formatted_address: 'Rua Teste, 456',
        geometry: {
          location: { lat: -23.0, lng: -46.0 }
        },
        types: ['store'],
        place_id: 'test_place_id'
      };
      
      const result = parse(placeWithoutOptionals);
      
      expect(result.phone).toBeNull();
      expect(result.website).toBeNull();
      expect(result.rating).toBeNull();
      expect(result.user_ratings_total).toBeNull();
    });
    
    it('should throw error when googlePlace is null or undefined', () => {
      expect(() => parse(null)).toThrow('googlePlace is required');
      expect(() => parse(undefined)).toThrow('googlePlace is required');
    });
    
    it('should throw error when name is missing', () => {
      const invalidPlace = { ...validGooglePlace };
      delete invalidPlace.name;
      
      expect(() => parse(invalidPlace)).toThrow('googlePlace.name is required');
    });
    
    it('should throw error when formatted_address is missing', () => {
      const invalidPlace = { ...validGooglePlace };
      delete invalidPlace.formatted_address;
      
      expect(() => parse(invalidPlace)).toThrow('googlePlace.formatted_address is required');
    });
    
    it('should throw error when geometry.location is missing', () => {
      const invalidPlace = { ...validGooglePlace, geometry: {} };
      
      expect(() => parse(invalidPlace)).toThrow('googlePlace.geometry.location is required');
    });
    
    it('should throw error when lat is not a number', () => {
      const invalidPlace = {
        ...validGooglePlace,
        geometry: { location: { lat: '23.1858', lng: -46.8978 } }
      };
      
      expect(() => parse(invalidPlace)).toThrow('googlePlace.geometry.location.lat must be a number');
    });
    
    it('should throw error when lng is not a number', () => {
      const invalidPlace = {
        ...validGooglePlace,
        geometry: { location: { lat: -23.1858, lng: '-46.8978' } }
      };
      
      expect(() => parse(invalidPlace)).toThrow('googlePlace.geometry.location.lng must be a number');
    });
    
    it('should throw error when types is missing or empty', () => {
      const invalidPlace1 = { ...validGooglePlace };
      delete invalidPlace1.types;
      
      const invalidPlace2 = { ...validGooglePlace, types: [] };
      
      expect(() => parse(invalidPlace1)).toThrow('googlePlace.types must be a non-empty array');
      expect(() => parse(invalidPlace2)).toThrow('googlePlace.types must be a non-empty array');
    });
    
    it('should throw error when place_id is missing', () => {
      const invalidPlace = { ...validGooglePlace };
      delete invalidPlace.place_id;
      
      expect(() => parse(invalidPlace)).toThrow('googlePlace.place_id is required');
    });
    
    it('should use first type for category mapping', () => {
      const place = {
        ...validGooglePlace,
        types: ['gym', 'health', 'point_of_interest']
      };
      
      const result = parse(place);
      expect(result.category).toBe('Academia');
    });
  });
  
  describe('parseMany', () => {
    const place1 = {
      name: 'Lugar 1',
      formatted_address: 'Endereço 1',
      geometry: { location: { lat: -23.0, lng: -46.0 } },
      types: ['hospital'],
      place_id: 'place_1'
    };
    
    const place2 = {
      name: 'Lugar 2',
      formatted_address: 'Endereço 2',
      geometry: { location: { lat: -23.1, lng: -46.1 } },
      types: ['gym'],
      place_id: 'place_2'
    };
    
    it('should convert multiple places correctly', () => {
      const results = parseMany([place1, place2]);
      
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Lugar 1');
      expect(results[0].category).toBe('Hospital');
      expect(results[1].name).toBe('Lugar 2');
      expect(results[1].category).toBe('Academia');
    });
    
    it('should handle empty array', () => {
      const results = parseMany([]);
      expect(results).toEqual([]);
    });
    
    it('should throw error when input is not an array', () => {
      expect(() => parseMany(null)).toThrow('googlePlaces must be an array');
      expect(() => parseMany(undefined)).toThrow('googlePlaces must be an array');
      expect(() => parseMany('not an array')).toThrow('googlePlaces must be an array');
      expect(() => parseMany({})).toThrow('googlePlaces must be an array');
    });
    
    it('should propagate errors from individual parse calls', () => {
      const invalidPlace = { name: 'Invalid' }; // missing required fields
      
      expect(() => parseMany([place1, invalidPlace])).toThrow();
    });
  });
});
