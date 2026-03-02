// Nova interface de busca de condomínios
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Search, 
  MapPin, 
  LogOut,
  Settings,
  Building2,
  Building,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Hospital,
  ShoppingCart,
  Store
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlaces } from '../hooks/usePlaces';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    places, 
    isLoading, 
    error, 
    geocodeAddress,
    searchNearby,
    clearResults,
    hasResults,
    totalResults 
  } = usePlaces();

  // Estados do formulário
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro1, setBairro1] = useState('');
  const [bairro2, setBairro2] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000); // 5km padrão
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Condomínio']);
  const [concorrentes, setConcorrentes] = useState<string[]>([]);

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

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleConcorrente = (concorrenteId: string) => {
    setConcorrentes(prev =>
      prev.includes(concorrenteId)
        ? prev.filter(c => c !== concorrenteId)
        : [...prev, concorrenteId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Montar endereço completo
    let fullAddress = '';
    if (cidade) fullAddress += cidade;
    if (estado) fullAddress += (fullAddress ? ', ' : '') + estado;
    if (bairro1) fullAddress += (fullAddress ? ', ' : '') + bairro1;
    
    if (!fullAddress.trim()) {
      alert('Digite pelo menos a cidade para buscar');
      return;
    }

    // Geocodificar o endereço
    const geocodeResult = await geocodeAddress(fullAddress);
    
    if (!geocodeResult || !geocodeResult.success) {
      return;
    }

    // Buscar lugares próximos com filtros
    const searchParams: any = {
      lat: geocodeResult.data.lat,
      lng: geocodeResult.data.lng,
      radius: searchRadius,
      limit: 100
    };

    // Adicionar categorias selecionadas
    if (selectedCategories.length > 0) {
      searchParams.category = selectedCategories.join(',');
    }

    await searchNearby(searchParams);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Globe size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  SupHelp Geo
                </h1>
                <p className="text-xs text-slate-500">Geolocalização Inteligente</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all text-sm"
                >
                  <Settings size={14} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-full">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-700">{user?.email}</span>
                  <span className="text-xs text-cyan-600 font-semibold">{user?.plano || 'Básico'}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Filtre condomínios com potencial para implantação de lojas.
          </h2>
        </div>

        {/* Card de Busca */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Localização</h3>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            {/* Estado */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
              >
                <option value="">Selecione o estado</option>
                {estados.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Selecione a cidade"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Bairros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={bairro1}
                  onChange={(e) => setBairro1(e.target.value)}
                  placeholder="Ex: Centro..."
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={bairro2}
                  onChange={(e) => setBairro2(e.target.value)}
                  placeholder="Ex: Selva o bairro"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Categoria
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categorias.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{cat.label}</span>
                      {isSelected && <span className="ml-auto">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Raio de Busca */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Raio de Busca
                </label>
                <span className="text-blue-600 font-bold text-lg">{searchRadius / 1000} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="20000"
                step="1000"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
                <label className="block text-sm font-semibold text-slate-700">
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
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
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search size={20} />
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-red-800">Erro</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {hasResults && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              📍 {totalResults} {totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {places.map((place, index) => (
                <div
                  key={place.id}
                  className="p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-all border border-slate-200 hover:border-blue-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{place.name}</h4>
                      <p className="text-sm text-slate-600">{place.address}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
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
      </div>
    </div>
  );
};

export default DashboardPage;
