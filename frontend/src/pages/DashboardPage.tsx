// Dashboard do usuário
import React, { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlaces } from '../hooks/usePlaces';
import { authService } from '../services/auth';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    places, 
    isLoading, 
    error, 
    searchByAddress, 
    searchAdvanced,
    clearResults,
    hasResults,
    totalResults 
  } = usePlaces();
  
  const [searchAddress, setSearchAddress] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    hasPhone: false
  });
  const [userStats, setUserStats] = useState({
    searches_used: 0,
    searches_limit: 100,
    status: 'active'
  });

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      // Se há filtros avançados, usar busca avançada
      if (showAdvancedFilters && (filters.category || filters.minRating || filters.hasPhone)) {
        await searchAdvanced({
          address: searchAddress,
          radius: searchRadius,
          category: filters.category || undefined,
          minRating: filters.minRating ? Number(filters.minRating) : undefined,
          hasPhone: filters.hasPhone || undefined
        });
      } else {
        await searchByAddress(searchAddress, searchRadius);
      }
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Globe size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  SupHelp Geo
                </span>
                <span className="text-xs text-slate-500">Geolocalização Inteligente</span>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{user?.email}</span>
                  <span className="text-xs text-cyan-600 font-semibold">{user?.plano || 'Básico'}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <span className="text-2xl">👋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Bem-vindo, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-slate-600 text-lg">
                Encontre estabelecimentos próximos e exporte os dados facilmente.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Search size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Buscas Usadas</p>
                <p className="text-2xl font-bold text-slate-800">{userStats.searches_used}</p>
                <p className="text-xs text-blue-600 font-medium">de {userStats.searches_limit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Limite Mensal</p>
                <p className="text-2xl font-bold text-slate-800">{userStats.searches_limit}</p>
                <p className="text-xs text-green-600 font-medium">buscas/mês</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Resultados</p>
                <p className="text-2xl font-bold text-slate-800">{totalResults}</p>
                <p className="text-xs text-purple-600 font-medium">encontrados</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Status</p>
                <p className="text-2xl font-bold text-green-600">{userStats.status === 'active' ? 'Ativo' : 'Inativo'}</p>
                <p className="text-xs text-orange-600 font-medium">conta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Buscar Estabelecimentos</h2>
              <p className="text-slate-600">Encontre lugares próximos ao seu endereço</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-3">
                  📍 Endereço de Referência
                </label>
                <input
                  type="text"
                  id="address"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-lg"
                  placeholder="Ex: Rua das Flores, 123, São Paulo - SP"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-semibold text-slate-700 mb-3">
                  🎯 Raio de Busca
                </label>
                <select
                  id="radius"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-lg"
                >
                  <option value={1000}>📏 1 km</option>
                  <option value={2000}>📏 2 km</option>
                  <option value={5000}>📏 5 km</option>
                  <option value={10000}>📏 10 km</option>
                  <option value={20000}>📏 20 km</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Buscar Agora
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Filter size={20} />
                Filtros {showAdvancedFilters ? '▲' : '▼'}
              </button>

              {hasResults && (
                <button
                  type="button"
                  onClick={clearResults}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Limpar Resultados
                </button>
              )}
            </div>

            {/* Filtros Avançados */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Filter size={20} />
                  Filtros Avançados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      🏪 Categoria
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Todas as categorias</option>
                      <option value="restaurant">Restaurante</option>
                      <option value="pharmacy">Farmácia</option>
                      <option value="bank">Banco</option>
                      <option value="hospital">Hospital</option>
                      <option value="gas_station">Posto de Gasolina</option>
                      <option value="supermarket">Supermercado</option>
                      <option value="school">Escola</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ⭐ Avaliação Mínima
                    </label>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Qualquer avaliação</option>
                      <option value="3">3+ estrelas</option>
                      <option value="4">4+ estrelas</option>
                      <option value="4.5">4.5+ estrelas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      📞 Telefone
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasPhone}
                        onChange={(e) => setFilters({...filters, hasPhone: e.target.checked})}
                        className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-slate-700">Apenas com telefone</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-red-800">Erro na Busca</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {hasResults && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Resultados Encontrados
                  </h2>
                  <p className="text-slate-600">{totalResults} estabelecimentos próximos</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Download size={18} />
                  Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <FileText size={18} />
                  PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Nome</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Categoria</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Endereço</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Telefone</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Distância</th>
                    <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((place, index) => (
                    <tr key={place.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{place.name}</div>
                            <div className="text-xs text-slate-500">ID: {place.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                          <span className="text-xs">🏪</span>
                          {place.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-slate-600 max-w-xs">
                          <div className="flex items-start gap-1">
                            <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>{place.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          <span>{place.phone || 'Não informado'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Target size={14} className="text-green-500" />
                          <span className="font-bold text-green-600">{place.distance_km || '-'} km</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500" />
                          <span className="font-medium text-slate-600">
                            {place.rating ? `${place.rating} ⭐` : 'Sem avaliação'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasResults && !isLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin size={32} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Nenhuma busca realizada</h3>
            <p className="text-slate-500 text-lg mb-6 max-w-md mx-auto">
              Digite um endereço acima para encontrar estabelecimentos próximos e começar sua análise geográfica.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Search size={16} />
                <span>Busca Inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} />
                <span>Resultados Rápidos</span>
              </div>
              <div className="flex items-center gap-2">
                <Download size={16} />
                <span>Exportação Fácil</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;