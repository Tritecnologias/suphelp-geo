// Dashboard do usuário
import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlaces } from '../hooks/usePlaces';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    places, 
    isLoading, 
    error, 
    searchByAddress, 
    clearResults,
    hasResults,
    totalResults 
  } = usePlaces();
  
  const [searchAddress, setSearchAddress] = useState('');
  const [searchRadius, setSearchRadius] = useState(5000);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      await searchByAddress(searchAddress, searchRadius);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-lime-400 to-primary rounded-full flex items-center justify-center text-white">
                <Globe size={20} />
              </div>
              <span className="font-bold text-lg text-primary">SupHelp Geo</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={16} />
                <span>{user?.nome}</span>
                <span className="text-slate-400">|</span>
                <span className="text-primary font-medium">{user?.plano}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Bem-vindo, {user?.nome}! 👋
          </h1>
          <p className="text-slate-600">
            Encontre estabelecimentos próximos e exporte os dados facilmente.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Buscas Usadas</p>
                <p className="text-xl font-bold text-slate-800">{user?.searches_used || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Limite Mensal</p>
                <p className="text-xl font-bold text-slate-800">{user?.searches_limit || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Resultados</p>
                <p className="text-xl font-bold text-slate-800">{totalResults}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-xl font-bold text-green-600">{user?.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">🔍 Buscar Estabelecimentos</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  id="address"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Digite o endereço (ex: Rua das Flores, 123, São Paulo)"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-slate-700 mb-2">
                  Raio (metros)
                </label>
                <select
                  id="radius"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                >
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={20000}>20 km</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-lg font-semibold transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Buscar
                  </>
                )}
              </button>

              {hasResults && (
                <button
                  type="button"
                  onClick={clearResults}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {hasResults && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                📍 Resultados ({totalResults} encontrados)
              </h2>
              
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition">
                  <Download size={16} />
                  Excel
                </button>
                <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition">
                  <FileText size={16} />
                  PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Endereço</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Distância</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((place) => (
                    <tr key={place.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{place.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {place.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{place.address}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{place.phone || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{place.distance_km || '-'} km</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {place.rating ? `${place.rating} ⭐` : '-'}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
            <MapPin size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Nenhuma busca realizada</h3>
            <p className="text-slate-500">
              Digite um endereço acima para encontrar estabelecimentos próximos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;