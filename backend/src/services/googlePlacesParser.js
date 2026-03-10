/**
 * Google Places Parser
 * 
 * Converte dados do Google Places API para o formato do banco de dados local.
 * 
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9
 */

/**
 * Mapeia tipos do Google Places para categorias locais
 * 
 * @param {string} googleType - Tipo do Google Places (ex: 'lodging', 'hospital')
 * @returns {string} Categoria local correspondente
 */
function mapCategory(googleType) {
  const categoryMap = {
    'lodging': 'Condomínio',
    'hospital': 'Hospital',
    'university': 'Universidade',
    'school': 'Escola',
    'gym': 'Academia',
    'supermarket': 'Supermercado',
    'store': 'Loja',
    'shopping_mall': 'Shopping',
    'restaurant': 'Restaurante',
    'cafe': 'Café',
    'bar': 'Bar',
    'pharmacy': 'Farmácia',
    'gas_station': 'Posto de Gasolina',
    'parking': 'Estacionamento',
    'bank': 'Banco',
    'atm': 'Caixa Eletrônico',
    'church': 'Igreja',
    'mosque': 'Mesquita',
    'synagogue': 'Sinagoga',
    'park': 'Parque',
    'stadium': 'Estádio',
    'movie_theater': 'Cinema',
    'library': 'Biblioteca',
    'post_office': 'Correios',
    'police': 'Delegacia',
    'fire_station': 'Corpo de Bombeiros',
    'courthouse': 'Fórum',
    'city_hall': 'Prefeitura',
    'embassy': 'Embaixada',
    'tourist_attraction': 'Ponto Turístico',
    'museum': 'Museu',
    'art_gallery': 'Galeria de Arte',
    'zoo': 'Zoológico',
    'aquarium': 'Aquário',
    'amusement_park': 'Parque de Diversões',
    'spa': 'Spa',
    'beauty_salon': 'Salão de Beleza',
    'hair_care': 'Cabeleireiro',
    'laundry': 'Lavanderia',
    'veterinary_care': 'Veterinário',
    'pet_store': 'Pet Shop',
    'car_dealer': 'Concessionária',
    'car_rental': 'Locadora de Veículos',
    'car_repair': 'Oficina Mecânica',
    'car_wash': 'Lava Rápido',
    'real_estate_agency': 'Imobiliária',
    'insurance_agency': 'Seguradora',
    'travel_agency': 'Agência de Viagens',
    'lawyer': 'Escritório de Advocacia',
    'accounting': 'Escritório de Contabilidade',
    'dentist': 'Dentista',
    'doctor': 'Médico',
    'physiotherapist': 'Fisioterapeuta',
    'electronics_store': 'Loja de Eletrônicos',
    'furniture_store': 'Loja de Móveis',
    'home_goods_store': 'Loja de Utilidades',
    'hardware_store': 'Loja de Ferragens',
    'clothing_store': 'Loja de Roupas',
    'shoe_store': 'Loja de Calçados',
    'jewelry_store': 'Joalheria',
    'book_store': 'Livraria',
    'florist': 'Floricultura',
    'bakery': 'Padaria',
    'meal_takeaway': 'Delivery',
    'meal_delivery': 'Delivery',
    'night_club': 'Balada',
    'casino': 'Cassino',
    'bowling_alley': 'Boliche',
    'campground': 'Camping',
    'rv_park': 'Área para Trailers',
    'transit_station': 'Estação de Transporte',
    'bus_station': 'Rodoviária',
    'train_station': 'Estação de Trem',
    'subway_station': 'Estação de Metrô',
    'taxi_stand': 'Ponto de Táxi',
    'airport': 'Aeroporto',
    'light_rail_station': 'Estação de VLT'
  };
  
  return categoryMap[googleType] || 'Estabelecimento';
}

/**
 * Converte um lugar do Google Places para o formato do banco local
 * 
 * @param {Object} googlePlace - Objeto de lugar retornado pela API do Google Places
 * @param {string} googlePlace.name - Nome do lugar
 * @param {string} googlePlace.formatted_address - Endereço formatado
 * @param {Object} googlePlace.geometry - Dados de geometria
 * @param {Object} googlePlace.geometry.location - Coordenadas
 * @param {number} googlePlace.geometry.location.lat - Latitude
 * @param {number} googlePlace.geometry.location.lng - Longitude
 * @param {string[]} googlePlace.types - Array de tipos do Google
 * @param {string} googlePlace.place_id - ID único do lugar no Google
 * @param {number} [googlePlace.rating] - Avaliação (opcional)
 * @param {number} [googlePlace.user_ratings_total] - Total de avaliações (opcional)
 * @param {string} [googlePlace.formatted_phone_number] - Telefone formatado (opcional)
 * @param {string} [googlePlace.website] - Website (opcional)
 * @returns {Object} Objeto no formato do banco local
 */
function parse(googlePlace) {
  if (!googlePlace) {
    throw new Error('googlePlace is required');
  }
  
  if (!googlePlace.name) {
    throw new Error('googlePlace.name is required');
  }
  
  if (!googlePlace.formatted_address) {
    throw new Error('googlePlace.formatted_address is required');
  }
  
  if (!googlePlace.geometry || !googlePlace.geometry.location) {
    throw new Error('googlePlace.geometry.location is required');
  }
  
  if (typeof googlePlace.geometry.location.lat !== 'number') {
    throw new Error('googlePlace.geometry.location.lat must be a number');
  }
  
  if (typeof googlePlace.geometry.location.lng !== 'number') {
    throw new Error('googlePlace.geometry.location.lng must be a number');
  }
  
  if (!googlePlace.types || !Array.isArray(googlePlace.types) || googlePlace.types.length === 0) {
    throw new Error('googlePlace.types must be a non-empty array');
  }
  
  if (!googlePlace.place_id) {
    throw new Error('googlePlace.place_id is required');
  }
  
  return {
    name: googlePlace.name,
    address: googlePlace.formatted_address,
    category: mapCategory(googlePlace.types[0]),
    lat: googlePlace.geometry.location.lat,
    lng: googlePlace.geometry.location.lng,
    google_place_id: googlePlace.place_id,
    phone: googlePlace.formatted_phone_number || null,
    website: googlePlace.website || null,
    rating: googlePlace.rating || null,
    user_ratings_total: googlePlace.user_ratings_total || null
  };
}

/**
 * Converte múltiplos lugares do Google Places para o formato do banco local
 * 
 * @param {Object[]} googlePlaces - Array de objetos de lugares do Google Places
 * @returns {Object[]} Array de objetos no formato do banco local
 */
function parseMany(googlePlaces) {
  if (!Array.isArray(googlePlaces)) {
    throw new Error('googlePlaces must be an array');
  }
  
  return googlePlaces.map(place => parse(place));
}

module.exports = {
  parse,
  parseMany,
  mapCategory
};
