// Dashboard do usuário
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Search, 
  MapPin, 
  Download, 
  FileText, 
  Settings, 
  LogOut,
  User,
  BarChart3,
  Clock,
  Target,
  Phone,
  Star,
  TrendingUp,
  Activity,
  Zap,
  Filter,
  Loader,
  Building2,
  Building,
  Briefcase,
  Hospital,
  GraduationCap,
  Dumbbell,
  ShoppingCart,
  Store
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlaces } from '../hooks/usePlaces';
import { authService } from '../services/auth';
import { authService } from '../services/auth';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    places, 
    isLoading, 
    error, 
    geocodeAddress,
    searchNearby,
    searchByAddress, 
    searchAdvanced,
    clearResults,
    hasResults,
    totalResults 
  } = usePlaces();
  const [searchAddress, setSearchAddress] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchNeighborhood, setSearchNeighborhood] = useState('');
  const [searchNeighborhood2, setSearchNeighborhood2] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [concorrentes, setConcorrentes] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    hasPhone: false
  });

  const categorias = [
    { id: 'Condomínio', label: 'Condomínio', icon: Building2 },
    { id: 'Prédio Corporativo', label: 'Prédio Corporativo', icon: Building },
    { id: 'Empresa', label: 'Empresa', icon: Briefcase },
    { id: 'Hospital', label: 'Hospital', icon: Hospital },
    { id: 'Universidade', label: 'Universidade', icon: GraduationCap },
    { id: 'Academia', label: 'Academia', icon: Dumbbell }
  ];

  const concorrentesOptions = [
    { id: 'Supermercado', label: 'Supermercado', icon: ShoppingCart },
    { id: 'Atacadão', label: 'Atacadão', icon: Store }
  ];
  
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  const [userStats, setUserStats] = useState({
    searches_used: 0,
    searches_limit: 100,
    status: 'active'
  });

  // Estados para o mapa
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Carregar estatísticas reais do usuário
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const profile = await authService.getProfile();
        setUserStats({
          searches_used: profile.searches_used || 0,
          searches_limit: profile.searches_limit || 100,
          status: profile.status || 'active'
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    loadUserStats();
  }, []);

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

  // Atualizar marcadores no mapa quando places mudar
  useEffect(() => {
    if (!googleMapRef.current || !googleMapsLoaded || places.length === 0) return;

    // Limpar marcadores antigos
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Adicionar novos marcadores
    places.forEach(place => {
      if (!place.lat || !place.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: googleMapRef.current!,
        title: place.name,
        icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
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

    // Ajustar zoom para mostrar todos os marcadores
    if (places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      places.forEach(place => {
        if (place.lat && place.lng) {
          bounds.extend({ lat: place.lat, lng: place.lng });
        }
      });
      googleMapRef.current.fitBounds(bounds);
    }
  }, [places, googleMapsLoaded]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Montar endereço completo
    let fullAddress = '';
    if (searchCity) fullAddress += searchCity;
    if (searchState) fullAddress += (fullAddress ? ', ' : '') + searchState;
    if (searchNeighborhood) fullAddress += (fullAddress ? ', ' : '') + searchNeighborhood;
    if (searchKeyword) fullAddress += (fullAddress ? ', ' : '') + searchKeyword;
    
    if (!fullAddress.trim()) {
      alert('Digite pelo menos a cidade para buscar');
      return;
    }

    // SEMPRE fazer busca por raio (geocode + nearby)
    // Primeiro geocodifica o endereço
    const geocodeResult = await geocodeAddress(fullAddress);
    
    if (!geocodeResult || !geocodeResult.success) {
      return; // Erro já foi tratado pelo hook
    }

    // Depois busca lugares próximos com filtros
    const searchParams: any = {
      lat: geocodeResult.data.lat,
      lng: geocodeResult.data.lng,
      radius: searchRadius,
      limit: 100
    };

    // Adicionar filtros se houver
    if (selectedCategories.length > 0) {
      searchParams.category = selectedCategories.join(',');
    } else if (filters.category) {
      searchParams.category = filters.category;
    }

    if (filters.minRating) {
      searchParams.minRating = Number(filters.minRating);
    }

    if (filters.hasPhone) {
      searchParams.hasPhone = true;
    }

    await searchNearby(searchParams);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleConcorrente = (concorrenteId: string) => {
    setConcorrentes(prev =>
      prev.includes(concorrenteId)
        ? prev.filter(c => c !== concorrenteId)
        : [...prev, concorrenteId]
    );
  };

  const handleLogout = () => {
    logout();
  };

  const handleExportExcel = async () => {
    if (places.length === 0) {
      alert('Nenhum resultado para exportar');
      return;
    }
    
    try {
      // Create CSV content with UTF-8 BOM for proper Excel encoding
      let csv = '\uFEFF';
      csv += 'Número;Nome;Endereço;Categoria;Telefone;Distância;Rating;Latitude;Longitude\n';
      
      places.forEach((place, index) => {
        csv += `${index + 1};${place.name || 'Sem nome'};${place.address || 'Sem endereço'};${place.category || 'Sem categoria'};${place.phone || 'Não informado'};${place.distance_km || '-'} km;${place.rating ? place.rating + ' ⭐' : 'Sem avaliação'};${place.lat || ''};${place.lng || ''}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `busca_suphelp_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Erro ao exportar para Excel: ' + error.message);
    }
  };

  const handleExportPDF = () => {
    if (places.length === 0) {
      alert('Nenhum resultado para exportar');
      return;
    }
    
    try {
      const printWindow = window.open('', '', 'height=600,width=800');
      
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Busca - SupHelp Geo</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0891b2; margin-bottom: 20px; }
            .header-info { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0891b2; color: white; padding: 12px; text-align: left; font-weight: bold; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            tr:hover { background: #e0f2fe; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <h1>🗺️ SupHelp Geo - Relatório de Busca</h1>
          <div class="header-info">
            <p><strong>Endereço de Busca:</strong> ${searchAddress}</p>
            <p><strong>Raio:</strong> ${searchRadius} metros</p>
            <p><strong>Total de Resultados:</strong> ${places.length} estabelecimentos</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Endereço</th>
                <th>Telefone</th>
                <th>Distância</th>
                <th>Avaliação</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      places.forEach((place, index) => {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${place.name || 'Sem nome'}</strong></td>
            <td>${place.category || 'Sem categoria'}</td>
            <td>${place.address || 'Sem endereço'}</td>
            <td>${place.phone || 'Não informado'}</td>
            <td><strong>${place.distance_km || '-'} km</strong></td>
            <td>${place.rating ? place.rating + ' ⭐' : 'Sem avaliação'}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
          <div class="footer">
            <p>Relatório gerado pelo SupHelp Geo - Sistema de Geolocalização Inteligente</p>
            <p>© ${new Date().getFullYear()} SupHelp Geo. Todos os direitos reservados.</p>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.print();
      };
    } catch (error) {
      alert('Erro ao gerar PDF: ' + error.message);
    }
  };

  const handlePlaceClick = (place: any) => {
    if (googleMapRef.current && place.lat && place.lng) {
      googleMapRef.current.setCenter({ lat: place.lat, lng: place.lng });
      googleMapRef.current.setZoom(16);
      
      // Encontrar e abrir o InfoWindow do marcador
      const marker = markersRef.current.find(m => 
        m.getPosition()?.lat() === place.lat && m.getPosition()?.lng() === place.lng
      );
      if (marker) {
        google.maps.event.trigger(marker, 'click');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 py-2">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Globe size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent truncate">
                  SupHelp Geo
                </span>
                <span className="text-xs text-slate-500 truncate">Geolocalização</span>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium text-xs sm:text-sm"
                >
                  <Settings size={14} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-full">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{user?.email}</span>
                  <span className="text-xs text-cyan-600 font-semibold">{user?.plano || 'Básico'}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-red-600 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-red-50"
                title="Sair"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline font-medium text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Layout: Sidebar + Mapa */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar Esquerda */}
        <div className="w-full lg:w-[500px] bg-white shadow-lg overflow-y-auto flex-shrink-0 max-h-[calc(100vh-4rem)]">
          <div className="p-6 space-y-6 pb-20">
            {/* Título */}
            <div>
              <h2 className="text-lg text-slate-600 font-normal">
                Filtre condomínios com potencial para implantação de lojas.
              </h2>
            </div>

            {/* Card de Localização */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              {/* Header da Seção */}
              <div className="flex items-center gap-2 mb-5">
                <Filter className="text-blue-600" size={20} />
                <h3 className="text-base font-bold text-slate-800">Localização</h3>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Estado */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Estado
                  </label>
                  <select
                    value={searchState}
                    onChange={(e) => setSearchState(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-600"
                  >
                    <option value="">Selecione o estado</option>
                    {estados.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                {/* Cidade */}
                <div>
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Selecione a cidade"
                  />
                </div>

                {/* Bairro */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    Bairro
                  </label>
                  <select
                    value={searchNeighborhood2}
                    onChange={(e) => setSearchNeighborhood2(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-600"
                  >
                    <option value="">Selecione o bairro</option>
                    <option value="Centro">Centro</option>
                    <option value="Jardim">Jardim</option>
                    <option value="Vila">Vila</option>
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">
                    Categoria
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categorias.map(cat => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg font-medium text-xs transition-all ${
                            isSelected
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <Icon size={24} />
                          <span className="text-center leading-tight">{cat.label}</span>
                          {isSelected && <span className="text-lg">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Raio de Busca */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-slate-800">
                      Raio de Busca
                    </label>
                    <span className="text-blue-600 font-bold text-base">{searchRadius / 1000} km</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="1000"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0 km</span>
                    <span>20 km</span>
                  </div>
                </div>

                {/* Concorrentes Próximos */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="text-blue-600" size={18} />
                    <label className="block text-sm font-bold text-slate-800">
                      Concorrentes próximos
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {concorrentesOptions.map(conc => {
                      const Icon = conc.icon;
                      const isSelected = concorrentes.includes(conc.id);
                      return (
                        <button
                          key={conc.id}
                          type="button"
                          onClick={() => toggleConcorrente(conc.id)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all bg-white border border-slate-200 hover:border-blue-300 text-slate-700"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <Icon size={18} />
                          <span>{conc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Botão Buscar */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
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
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800 text-sm">Erro</h3>
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              </div>
            )}

            {/* Export Buttons */}
            {hasResults && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all"
                >
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span>Excel</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all"
                >
                  <FileText size={14} className="sm:w-4 sm:h-4" />
                  <span>PDF</span>
                </button>
              </div>
            )}

            {/* Results List */}
            {hasResults && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    📍 {totalResults} Resultados
                  </h3>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {places.map((place, index) => (
                    <div
                      key={place.id}
                      onClick={() => handlePlaceClick(place)}
                      className="p-3 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-all border border-slate-200 hover:border-blue-300"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{place.name}</h4>
                          <p className="text-xs text-slate-600 truncate">{place.address}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {place.category}
                            </span>
                            {place.distance_km && (
                              <span className="text-xs text-green-600 font-semibold">
                                📍 {place.distance_km} km
                              </span>
                            )}
                            {place.rating && (
                              <span className="text-xs text-yellow-600">
                                ⭐ {place.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasResults && !isLoading && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin size={24} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma busca</h3>
                <p className="text-slate-500 text-sm">
                  Digite um endereço para começar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mapa Direita */}
        {/* Mapa */}
        <div className="flex-1 relative bg-gray-100 h-[400px] lg:h-auto">
          {!googleMapsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                <p className="text-gray-600">Carregando mapa...</p>
              </div>
            </div>
          )}
          
          <div ref={mapRef} className="w-full h-full" />
          
          {hasResults && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
              <p className="text-xs sm:text-sm text-gray-700 font-semibold">
                📍 {totalResults} {totalResults === 1 ? 'local encontrado' : 'locais encontrados'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;