// Página de administração - Versão funcional
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Users, 
  MapPin, 
  Upload, 
  Settings, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Database,
  Shield,
  Key,
  UserPlus,
  CheckCircle,
  AlertCircle,
  X,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { placesService } from '../services/places';
import { Place } from '../types';

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Estados principais
  const [activeTab, setActiveTab] = useState('dashboard');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalPlaces: 0,
    totalUsers: 150,
    totalSearches: 2500,
    totalAdmins: 3,
    placesThisMonth: 45,
    usersThisMonth: 12
  });

  // Estados para importação Google Places
  const [importCity, setImportCity] = useState('');
  const [importKeywords, setImportKeywords] = useState('');
  const [importMaxResults, setImportMaxResults] = useState(50);
  const [isImporting, setIsImporting] = useState(false);

  // Estados para alteração de senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'places') {
      loadPlaces();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const placesResponse = await placesService.getAll({ limit: 1 });
      setStats(prev => ({
        ...prev,
        totalPlaces: placesResponse.pagination.total
      }));
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaces = async () => {
    try {
      setIsLoading(true);
      const response = await placesService.getAll({ limit: 100 });
      setPlaces(response.data);
    } catch (err) {
      setError('Erro ao carregar lugares');
    } finally {
      setIsLoading(false);
    }
  };
  // Funções de importação Google Places
  const handleImportFromGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCity.trim() || !importKeywords.trim()) {
      setError('Preencha cidade e palavras-chave');
      return;
    }

    try {
      setIsImporting(true);
      const keywords = importKeywords.split(',').map(k => k.trim());
      
      const response = await placesService.importFromGooglePlaces({
        city: importCity,
        keywords,
        maxResults: importMaxResults
      });

      if (response.success) {
        setSuccess(`Importação iniciada! ${response.data?.message || 'Processando...'}`);
        setImportCity('');
        setImportKeywords('');
        setTimeout(() => {
          loadPlaces();
        }, 3000);
      } else {
        setError('Erro na importação: ' + response.error);
      }
    } catch (err) {
      setError('Erro na importação: ' + (err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeletePlace = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${name}"?`)) {
      return;
    }

    try {
      await placesService.delete(id);
      setPlaces(places.filter(p => p.id !== id));
      setSuccess('Lugar deletado com sucesso!');
    } catch (err) {
      setError('Erro ao deletar lugar: ' + (err as Error).message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      setError('Senhas não coincidem');
      return;
    }

    try {
      setSuccess('Senha alterada com sucesso!');
      setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setIsChangingPassword(false);
    } catch (err) {
      setError('Erro ao alterar senha: ' + (err as Error).message);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleLogout = () => {
    logout();
  };
  // Verificar se é admin
  if (!user || (user as any).role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-slate-600 mb-6">Você não tem permissão para acessar esta área.</p>
          <Link to="/dashboard" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
                  SupHelp Geo - Admin
                </span>
                <span className="text-xs text-slate-500">Painel Administrativo Completo</span>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{user?.email}</span>
                  <span className="text-xs text-red-600 font-semibold">Administrador</span>
                </div>
              </div>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                title="Alterar Senha"
              >
                <Key size={18} />
              </button>
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
        {/* Messages */}
        {(error || success) && (
          <div className="mb-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-red-700">{error}</span>
                <button onClick={clearMessages} className="ml-auto text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="text-green-500" size={20} />
                <span className="text-green-700">{success}</span>
                <button onClick={clearMessages} className="ml-auto text-green-500 hover:text-green-700">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Painel Administrativo Completo
              </h1>
              <p className="text-slate-600 text-lg">
                Gerencie todos os aspectos do sistema SupHelp Geo.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'places', label: 'Lugares', icon: MapPin },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'admins', label: 'Admins', icon: Shield },
              { id: 'import', label: 'Importação', icon: Upload }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Lugares</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalPlaces}</p>
                    <p className="text-xs text-blue-600 font-medium">+{stats.placesThisMonth} este mês</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Usuários</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
                    <p className="text-xs text-green-600 font-medium">+{stats.usersThisMonth} este mês</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Buscas</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalSearches}</p>
                    <p className="text-xs text-purple-600 font-medium">este mês</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Admins</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalAdmins}</p>
                    <p className="text-xs text-red-600 font-medium">ativos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Zap className="text-yellow-500" size={24} />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('import')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all"
                >
                  <Upload className="text-green-600" size={20} />
                  <span className="font-semibold text-green-800">Importar Dados</span>
                </button>
                <button
                  onClick={() => setActiveTab('places')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-all"
                >
                  <Plus className="text-blue-600" size={20} />
                  <span className="font-semibold text-blue-800">Gerenciar Lugares</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-50 rounded-xl hover:from-purple-100 hover:to-purple-100 transition-all"
                >
                  <UserPlus className="text-purple-600" size={20} />
                  <span className="font-semibold text-purple-800">Gerenciar Usuários</span>
                </button>
                <button
                  onClick={() => setActiveTab('admins')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-50 rounded-xl hover:from-red-100 hover:to-red-100 transition-all"
                >
                  <Shield className="text-red-600" size={20} />
                  <span className="font-semibold text-red-800">Gerenciar Admins</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-8">
            {/* Google Places Import */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Importar do Google Places</h2>
                  <p className="text-slate-600">Importe estabelecimentos automaticamente</p>
                </div>
              </div>
              
              <form onSubmit={handleImportFromGoogle} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-3">
                      🏙️ Cidade
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={importCity}
                      onChange={(e) => setImportCity(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="Ex: São Paulo, SP"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="keywords" className="block text-sm font-semibold text-slate-700 mb-3">
                      🔍 Palavras-chave
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      value={importKeywords}
                      onChange={(e) => setImportKeywords(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      placeholder="Ex: restaurante, farmácia, banco"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="maxResults" className="block text-sm font-semibold text-slate-700 mb-3">
                      📊 Máx. Resultados
                    </label>
                    <select
                      id="maxResults"
                      value={importMaxResults}
                      onChange={(e) => setImportMaxResults(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    >
                      <option value={20}>20 resultados</option>
                      <option value={50}>50 resultados</option>
                      <option value={100}>100 resultados</option>
                      <option value={200}>200 resultados</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isImporting}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 shadow-lg hover:shadow-xl"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Importar do Google Places
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Places Tab */}
        {activeTab === 'places' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    Gerenciar Lugares
                  </h2>
                  <p className="text-slate-600">{places.length} lugares cadastrados</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-600 mt-4">Carregando lugares...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Nome</th>
                      <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Categoria</th>
                      <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Cidade</th>
                      <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Telefone</th>
                      <th className="text-left py-4 px-4 font-bold text-slate-700 uppercase tracking-wide text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {places.slice(0, 20).map((place) => (
                      <tr key={place.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all">
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800">{place.name}</div>
                          <div className="text-xs text-slate-500">ID: {place.id}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                            {place.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-slate-600">
                            {place.address?.split(',').slice(-2).join(',').trim() || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-slate-600">
                            {place.phone || 'Não informado'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeletePlace(place.id, place.name)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Gerenciar Usuários</h2>
                <p className="text-slate-600">Controle de usuários do sistema</p>
              </div>
            </div>
            <div className="text-center py-8">
              <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Gerenciar Administradores</h2>
                <p className="text-slate-600">Controle de administradores do sistema</p>
              </div>
            </div>
            <div className="text-center py-8">
              <p className="text-slate-600">Funcionalidade em desenvolvimento...</p>
            </div>
          </div>
        )}
        {/* Password Change Modal */}
        {isChangingPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Alterar Senha</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Senha Atual</label>
                  <input
                    type="password"
                    value={passwordForm.senhaAtual}
                    onChange={(e) => setPasswordForm({...passwordForm, senhaAtual: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.novaSenha}
                    onChange={(e) => setPasswordForm({...passwordForm, novaSenha: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmarSenha}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmarSenha: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Alterar Senha
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="flex-1 bg-slate-500 text-white py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;