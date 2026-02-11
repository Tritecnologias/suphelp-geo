// Página de busca com mapa integrado - API Key segura via backend
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter, X, Loader } from 'lucide-react';

interface Place {
  id: number;
  name: string;
  address: string;
  category: string;
  phone?: string;
  rating?: number;
  lat: number;
  lng: number;
  distance_km?: string;
}

interface SearchFilters {
  city: string;
  neighborhood: string;
  categories: string[];
  radius: number;
}

const SearchPage: React.FC = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    city: '',
    neighborhood: '',
    categories: [],
    radius: 5000
  });
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const categories = [
    'Condomínio',
    'Prédio Residencial',
    'Clube',
    'Empresa',
    'Academia',
    'Farmácia',
    'Mercado',
    'Restaurante',
    'Padaria'
  ];

  // Carregar Google Maps API dinamicamente com chave do backend
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Buscar API Key do backend (seguro!)
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (!config.googleMapsApiKey) {
          console.error('Google Maps API Key não configurada no servidor');
          return;
        }

        // Verificar se já está carregado
        if (window.google && window.google.maps) {
          setGoogleMapsLoaded(true);
          return;
        }

        // Carregar script do Google Maps
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleMapsLoaded(true);
        script.onerror = () => console.error('Erro ao carregar Google Maps');
        document.head.appendChild(script);
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };

    loadGoogleMaps();
  }, []);
  // Inicializar mapa
  useEffect(() => {
    if (mapRef.current && !googleMapRef.current && googleMapsLoaded) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 12,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
      });
    }
  }, [googleMapsLoaded]);

  // Atualizar marcadores no mapa
  useEffect(() => {
    if (!googleMapRef.current || !googleMapsLoaded) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    results.forEach(place => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: googleMapRef.current!,
        title: place.name,
        icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${place.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${place.address}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              <span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                ${place.category}
              </span>
              ${place.distance_km ? `<span style="margin-left: 8px; color: #666;">${place.distance_km} km</span>` : ''}
            </p>
            ${place.phone ? `<p style="margin: 5px 0 0 0; font-size: 12px;">📞 ${place.phone}</p>` : ''}
            ${place.rating ? `<p style="margin: 5px 0 0 0; font-size: 12px;">⭐ ${place.rating}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => infoWindow.open(googleMapRef.current!, marker));
      markersRef.current.push(marker);
    });

    if (results.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      results.forEach(place => bounds.extend({ lat: place.lat, lng: place.lng }));
      googleMapRef.current.fitBounds(bounds);
    }
  }, [results, googleMapsLoaded]);

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      alert('Digite um endereço para buscar');
      return;
    }

    try {
      setLoading(true);
      const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(searchAddress)}`);
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.success) {
        alert('Endereço não encontrado');
        return;
      }

      const { lat, lng } = geocodeData.data;
      setCenterCoords({ lat, lng });

      if (googleMapRef.current) {
        googleMapRef.current.setCenter({ lat, lng });
        googleMapRef.current.setZoom(14);
      }

      const searchResponse = await fetch(`/api/places/nearby?lat=${lat}&lng=${lng}&radius=${filters.radius}&limit=100`);
      const searchData = await searchResponse.json();

      let filteredResults = searchData.data || [];

      if (filters.categories.length > 0) {
        filteredResults = filteredResults.filter((place: Place) =>
          filters.categories.some(cat => place.category?.toLowerCase().includes(cat.toLowerCase()))
        );
      }

      setResults(filteredResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao realizar busca');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };
  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${showFilters ? 'w-96' : 'w-0'} transition-all duration-300 bg-white shadow-lg overflow-hidden`}>
        <div className="h-full overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">🗺️ SupHelp Geo</h1>
            <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
            <input
              type="text"
              placeholder="Digite a cidade (ex: São Paulo)"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
            <input
              type="text"
              placeholder="Ex: Centro"
              value={filters.neighborhood}
              onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Categorias</label>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raio de Busca: {filters.radius / 1000} km
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={filters.radius}
              onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Buscando...
              </>
            ) : (
              <>
                <Search size={20} />
                Buscar
              </>
            )}
          </button>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">RESULTADOS ({results.length})</h3>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Nenhum resultado encontrado</p>
                <p className="text-gray-400 text-xs mt-1">
                  Tente ajustar seus filtros de busca ou aumentar o raio de alcance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.slice(0, 10).map(place => (
                  <div
                    key={place.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      if (googleMapRef.current) {
                        googleMapRef.current.setCenter({ lat: place.lat, lng: place.lng });
                        googleMapRef.current.setZoom(16);
                      }
                    }}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{place.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{place.address}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {place.category}
                      </span>
                      {place.distance_km && (
                        <span className="text-xs text-gray-500">📍 {place.distance_km} km</span>
                      )}
                      {place.rating && (
                        <span className="text-xs text-gray-500">⭐ {place.rating}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {!showFilters && (
          <button
            onClick={() => setShowFilters(true)}
            className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50"
          >
            <Filter size={20} />
          </button>
        )}
        
        {!googleMapsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
              <p className="text-gray-600">Carregando mapa...</p>
            </div>
          </div>
        )}
        
        <div ref={mapRef} className="w-full h-full" />
        
        {results.length > 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg">
            <p className="text-sm text-gray-700">
              📍 {results.length} {results.length === 1 ? 'local encontrado' : 'locais encontrados'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;