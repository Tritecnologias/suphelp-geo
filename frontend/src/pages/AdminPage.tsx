// Página de administração - Versão completa com todas as funcionalidades
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Users, User, MapPin, Upload, Settings, LogOut, Plus, Edit, Trash2,
  BarChart3, Database, Shield, Key, UserPlus, CheckCircle, AlertCircle,
  Search, Download, FileText, Phone, Star, Eye, Save, RefreshCw, Palette
} from 'lucide-react';
import { adminService } from '../services/admin';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import CMSEditor from '../components/CMSEditor';

interface Place {
  id: number;
  name: string;
  address: string;
  category: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  lat: number;
  lng: number;
  distance_km?: string;
}

interface Admin {
  id: number;
  nome: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
}

interface Stats {
  total: number;
  withPhone: number;
  withRating: number;
  categories: number;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { config: globalConfig } = useSiteConfig();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estados para diferentes seções
  const [stats, setStats] = useState<Stats>({ total: 0, withPhone: 0, withRating: 0, categories: 0 });
  const [places, setPlaces] = useState<Place[]>([]);

  // Estados para configurações do site
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'SupHelp Geo',
    slogan: 'Geolocalização Inteligente',
    description: 'Encontre estabelecimentos próximos com precisão e facilidade',
    email: 'contato@suphelp.com.br',
    phone: '(11) 9999-9999',
    logo: null as File | null
  });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', role: 'admin', status: 'active', senha: '' });
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', plano: 'demo' });
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserForm, setEditUserForm] = useState({ nome: '', email: '', plano: 'demo', status: 'active', searches_limit: 999999, senha: '' });
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);
  const [searchResults, setSearchResults] = useState<Place[]>([]);

  // Estados para formulários
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '', address: '', category: '', lat: '', lng: '', 
    phone: '', website: '', rating: ''
  });
  const [newAdmin, setNewAdmin] = useState({
    nome: '', email: '', senha: '', role: 'admin'
  });
  
  // Estados para busca e filtros
  const [searchAddress, setSearchAddress] = useState('Jundiaí, SP');
  const [searchRadius, setSearchRadius] = useState('5000');
  const [searchCoords, setSearchCoords] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Estados para importação
  const [importCity, setImportCity] = useState('Jundiaí, SP');
  const [importKeywords, setImportKeywords] = useState('farmácia, padaria, mercado');
  const [importMax, setImportMax] = useState('20');
  const [enrichLimit, setEnrichLimit] = useState('10');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  useEffect(() => {
    loadDashboard();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  // Função para carregar dashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/places?limit=1000');
      const data = await response.json();
      
      if (data.data) {
        const placesData = data.data;
        setRecentPlaces(placesData.slice(0, 10));
        
        // Calcular estatísticas
        const total = placesData.length;
        const withPhone = placesData.filter((p: Place) => p.phone).length;
        const withRating = placesData.filter((p: Place) => p.rating).length;
        const uniqueCategories = [...new Set(placesData.map((p: Place) => p.category).filter(c => c))];
        
        setStats({ total, withPhone, withRating, categories: uniqueCategories.length });
        setCategories(uniqueCategories);
      }
      await loadUsers();
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      showMessage('Erro ao carregar dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };
  // Função para carregar lugares
  const loadPlaces = async (page = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      let url = `/api/places?limit=${limit}&offset=${offset}`;
      
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data) {
        let filteredPlaces = data.data;
        
        if (filterName) {
          filteredPlaces = filteredPlaces.filter((p: Place) => 
            p.name.toLowerCase().includes(filterName.toLowerCase())
          );
        }
        
        setPlaces(filteredPlaces);
        setCurrentPage(page);
        setTotalPages(Math.ceil(data.pagination.total / limit));
      }
    } catch (error) {
      console.error('Erro ao carregar lugares:', error);
      showMessage('Erro ao carregar lugares', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar lugar
  const createPlace = async () => {
    try {
      if (!newPlace.name || !newPlace.lat || !newPlace.lng) {
        showMessage('Nome, latitude e longitude são obrigatórios', 'error');
        return;
      }

      setLoading(true);
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlace.name,
          address: newPlace.address,
          category: newPlace.category,
          lat: parseFloat(newPlace.lat),
          lng: parseFloat(newPlace.lng),
          phone: newPlace.phone || null,
          website: newPlace.website || null,
          rating: newPlace.rating ? parseFloat(newPlace.rating) : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Lugar criado com sucesso!');
        setShowAddPlace(false);
        setNewPlace({ name: '', address: '', category: '', lat: '', lng: '', phone: '', website: '', rating: '' });
        if (activeSection === 'places') loadPlaces(currentPage);
        if (activeSection === 'dashboard') loadDashboard();
      } else {
        showMessage(data.error || 'Erro ao criar lugar', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar lugar:', error);
      showMessage('Erro ao criar lugar', 'error');
    } finally {
      setLoading(false);
    }
  };
  // Função para deletar lugar
  const deletePlace = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${name}"?`)) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/places/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        showMessage(`Lugar "${name}" deletado com sucesso!`);
        if (activeSection === 'places') loadPlaces(currentPage);
        if (activeSection === 'dashboard') loadDashboard();
      } else {
        showMessage(data.error || 'Erro ao deletar lugar', 'error');
      }
    } catch (error) {
      console.error('Erro ao deletar lugar:', error);
      showMessage('Erro ao deletar lugar', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para busca por raio
  const searchNearby = async () => {
    try {
      setLoading(true);
      
      const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(searchAddress)}`);
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.success) {
        showMessage('Endereço não encontrado', 'error');
        return;
      }
      
      const { lat, lng, formatted_address } = geocodeData.data;
      setSearchCoords(`${lat}, ${lng} - ${formatted_address}`);
      
      const searchResponse = await fetch(`/api/places/nearby?lat=${lat}&lng=${lng}&radius=${searchRadius}&limit=100`);
      const searchData = await searchResponse.json();
      
      if (searchData.data) {
        setSearchResults(searchData.data);
        showMessage(`${searchData.data.length} lugares encontrados!`);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      showMessage('Erro na busca por raio', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para importar via Google Places API
  const importPlaces = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import-places-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: importCity,
          keywords: importKeywords,
          maxResults: parseInt(importMax)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Importação concluída com sucesso!');
        if (activeSection === 'dashboard') loadDashboard();
      } else {
        showMessage(data.message || 'Erro na importação', 'error');
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      showMessage('Erro na importação', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para importar CSV
  const handleCSVUpload = async (file: File) => {
    try {
      setLoading(true);
      showMessage('⏳ Processando arquivo CSV...', 'info');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import-csv-upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        const imported = data.imported || 0;
        const duplicates = data.duplicates || 0;
        const errors = data.errors || 0;
        const total = data.total || 0;
        
        if (imported === 0 && duplicates > 0) {
          showMessage(`⚠️ Nenhum lugar novo importado. ${duplicates} já existiam no banco. (${total} linhas processadas)`, 'info');
        } else if (imported === 0 && errors > 0) {
          showMessage(`❌ Nenhum lugar importado. ${errors} linhas com erro. Verifique o formato do CSV.`, 'error');
        } else {
          let msg = `✅ ${imported} ${imported === 1 ? 'lugar importado' : 'lugares importados'} com sucesso!`;
          if (duplicates > 0) msg += ` ${duplicates} duplicados ignorados.`;
          if (errors > 0) msg += ` ${errors} erros.`;
          msg += ` (${total} linhas processadas)`;
          showMessage(msg);
        }
        if (activeSection === 'dashboard') loadDashboard();
      } else {
        showMessage(`❌ ${data.message || 'Erro ao importar CSV'}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      showMessage('❌ Erro ao importar CSV. Verifique o formato do arquivo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para enriquecer contatos
  const enrichContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enrich-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeIds: 'all', limit: parseInt(enrichLimit) })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Enriquecimento concluído com sucesso!');
        if (activeSection === 'dashboard') loadDashboard();
      } else {
        showMessage(data.message || 'Erro no enriquecimento', 'error');
      }
    } catch (error) {
      console.error('Erro no enriquecimento:', error);
      showMessage('Erro no enriquecimento', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar administradores
  const loadAdmins = async () => {
    try {
      setLoading(true);

      const adminsList = await adminService.listAdmins();
      setAdmins(adminsList);

      // Identificar o admin logado pela lista (usando email do token)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('[AdminPage] Token payload:', payload);
          // Buscar na lista de admins pelo email para pegar o role correto
          const me = adminsList.find(a => a.email === payload.email);
          if (me) {
            setCurrentAdmin(me);
          } else {
            setCurrentAdmin({ id: payload.id, nome: '', email: payload.email || '', role: payload.role || 'admin', status: 'active', created_at: '' });
          }
        } catch (e) {
          console.error('Erro ao decodificar token:', e);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar admins:', error);
      showMessage('Erro ao carregar administradores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para editar administrador
  const startEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditForm({ nome: admin.nome, email: admin.email, role: admin.role, status: admin.status, senha: '' });
  };

  const saveEditAdmin = async () => {
    if (!editingAdmin) return;
    try {
      setLoading(true);
      await adminService.updateAdmin(editingAdmin.id, editForm);
      showMessage('Administrador atualizado com sucesso!');
      setEditingAdmin(null);
      loadAdmins();
    } catch (error: any) {
      showMessage(error.message || 'Erro ao atualizar administrador', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir administrador
  const deleteAdmin = async (admin: Admin) => {
    if (!confirm(`Excluir o administrador "${admin.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setLoading(true);
      await adminService.deleteAdmin(admin.id);
      showMessage('Administrador excluído com sucesso!');
      loadAdmins();
    } catch (error: any) {
      showMessage(error.message || 'Erro ao excluir administrador', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar administrador
  const createAdmin = async () => {
    try {
      if (!newAdmin.nome || !newAdmin.email || !newAdmin.senha) {
        showMessage('Preencha todos os campos obrigatórios', 'error');
        return;
      }

      setLoading(true);
      await adminService.createAdmin(newAdmin);
      
      showMessage('Administrador criado com sucesso!');
      setShowCreateAdmin(false);
      setNewAdmin({ nome: '', email: '', senha: '', role: 'admin' });
      loadAdmins();
    } catch (error: any) {
      console.error('Erro ao criar admin:', error);
      showMessage(error.message || 'Erro ao criar administrador', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar usuários
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUsers(data.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const startEditUser = (u: any) => {
    setEditingUser(u);
    setEditUserForm({ nome: u.nome, email: u.email, plano: u.plano, status: u.status, searches_limit: u.searches_limit, senha: '' });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editUserForm)
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Usuário atualizado com sucesso!');
        setEditingUser(null);
        loadUsers();
      } else {
        showMessage(data.error || 'Erro ao atualizar usuário', 'error');
      }
    } catch (error: any) {
      showMessage(error.message || 'Erro ao atualizar usuário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (u: any) => {
    if (!confirm(`Excluir o usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        showMessage('Usuário excluído com sucesso!');
        loadUsers();
      } else {
        showMessage(data.error || 'Erro ao excluir usuário', 'error');
      }
    } catch (error: any) {
      showMessage(error.message || 'Erro ao excluir usuário', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar usuário
  const createUser = async () => {
    try {
      if (!newUser.nome || !newUser.email || !newUser.senha) {
        showMessage('Preencha todos os campos obrigatórios', 'error');
        return;
      }
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newUser.nome, email: newUser.email, senha: newUser.senha, plano: newUser.plano })
      });
      const data = await response.json();
      if (data.success) {
        showMessage(`Usuário criado com sucesso! (plano: ${newUser.plano})`);
        setShowCreateUser(false);
        setNewUser({ nome: '', email: '', senha: '', plano: 'demo' });
        loadUsers();
      } else {
        showMessage(data.error || 'Erro ao criar usuário', 'error');
      }
    } catch (error: any) {
      showMessage(error.message || 'Erro ao criar usuário', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar para Excel
  const exportToExcel = (data: Place[], filename: string) => {
    const csvContent = [
      ['ID', 'Nome', 'Endereço', 'Categoria', 'Telefone', 'Rating', 'Distância (km)'],
      ...data.map(place => [
        place.id, place.name, place.address || '', place.category || '',
        place.phone || '', place.rating || '', place.distance_km || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Função para salvar configurações do site
  // Função para salvar configurações do site
  const handleSaveSiteConfig = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Preparar dados para salvar no formato do backend
      const configs = [
        { section: 'header', key: 'site_name', value: siteConfig.siteName, type: 'text' },
        { section: 'header', key: 'slogan', value: siteConfig.slogan, type: 'text' },
        { section: 'hero', key: 'description', value: siteConfig.description, type: 'text' },
        { section: 'footer', key: 'contact_email', value: siteConfig.email, type: 'text' },
        { section: 'footer', key: 'contact_phone', value: siteConfig.phone, type: 'text' }
      ];

      // Se houver logo (arquivo), fazer upload primeiro
      if (siteConfig.logo) {
        const formData = new FormData();
        formData.append('logo', siteConfig.logo);

        try {
          const uploadResponse = await fetch('/api/upload/logo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          const uploadData = await uploadResponse.json();
          
          if (uploadData.success && uploadData.url) {
            // Adicionar URL do logo às configurações
            configs.push({ 
              section: 'header', 
              key: 'logo_url', 
              value: uploadData.url, 
              type: 'text' 
            });
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload do logo:', uploadError);
          setMessage('⚠️ Configurações salvas, mas erro ao fazer upload do logo');
        }
      }

      await adminService.saveSiteConfig(configs);

      setMessage('✅ Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erro ao salvar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar configurações do site ao montar o componente
  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const response = await adminService.getSiteConfig();
        
        console.log('Configurações carregadas:', response);
        
        // A resposta vem em response.data (não response diretamente)
        const config = response.data || response;
        
        // Extrair valores do formato do backend (cada campo tem .value)
        if (config.header) {
          setSiteConfig(prev => ({
            ...prev,
            siteName: config.header.site_name?.value || prev.siteName,
            slogan: config.header.slogan?.value || prev.slogan
          }));
        }
        
        if (config.hero) {
          setSiteConfig(prev => ({
            ...prev,
            description: config.hero.description?.value || prev.description
          }));
        }
        
        if (config.footer) {
          setSiteConfig(prev => ({
            ...prev,
            email: config.footer.contact_email?.value || prev.email,
            phone: config.footer.contact_phone?.value || prev.phone
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    if (activeSection === 'settings') {
      loadSiteConfig();
    }
  }, [activeSection]);

  // Função para mudar seção ativa
  const changeSection = (section: string) => {
    setActiveSection(section);
    
    switch (section) {
      case 'dashboard': loadDashboard(); break;
      case 'places': loadPlaces(); break;
      case 'admins': loadAdmins(); break;
      case 'users': loadUsers(); break;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="hidden lg:block lg:w-64 bg-gradient-to-b from-blue-600 to-purple-700 text-white p-6">
        <div className="mb-8 flex items-center gap-3">
          {globalConfig.logoUrl ? (
            <img src={globalConfig.logoUrl} alt={globalConfig.siteName} className="w-10 h-10 object-contain" />
          ) : (
            <span className="text-3xl">🗺️</span>
          )}
          <div>
            <h1 className="text-xl font-bold">{globalConfig.siteName}</h1>
            <p className="text-blue-200 text-xs">Painel Administrativo</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'places', icon: MapPin, label: 'Lugares' },
            { id: 'search', icon: Search, label: 'Buscar' },
            { id: 'import', icon: Upload, label: 'Importar' },
            { id: 'enrich', icon: Phone, label: 'Enriquecer' },
            { id: 'admins', icon: Users, label: 'Administradores' },
            { id: 'users', icon: User, label: 'Usuários' },
            { id: 'settings', icon: Settings, label: 'Configurações' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => changeSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-blue-200 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {globalConfig.logoUrl ? (
              <img src={globalConfig.logoUrl} alt={globalConfig.siteName} className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-2xl">🗺️</span>
            )}
            <div>
              <h1 className="text-lg font-bold">{globalConfig.siteName}</h1>
              <p className="text-blue-200 text-xs">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'places', icon: MapPin, label: 'Lugares' },
            { id: 'search', icon: Search, label: 'Buscar' },
            { id: 'import', icon: Upload, label: 'Importar' },
            { id: 'enrich', icon: Phone, label: 'Enriquecer' },
            { id: 'admins', icon: Users, label: 'Admins' },
            { id: 'users', icon: User, label: 'Usuários' },
            { id: 'settings', icon: Settings, label: 'Config' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => changeSection(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-colors ${
                activeSection === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/15'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'places' && 'Gerenciar Lugares'}
                {activeSection === 'search' && 'Buscar por Raio'}
                {activeSection === 'import' && 'Importar Dados'}
                {activeSection === 'enrich' && 'Enriquecer Contatos'}
                {activeSection === 'admins' && 'Administradores'}
                {activeSection === 'users' && 'Usuários'}
                {activeSection === 'settings' && 'Configurações'}
              </h2>
            </div>
          </div>
          
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Lugares</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <MapPin className="text-blue-600" size={32} />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Com Telefone</p>
                    <p className="text-3xl font-bold text-green-600">{stats.withPhone}</p>
                  </div>
                  <Phone className="text-green-600" size={32} />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Com Rating</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.withRating}</p>
                  </div>
                  <Star className="text-yellow-600" size={32} />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Categorias</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.categories}</p>
                  </div>
                  <Database className="text-purple-600" size={32} />
                </div>
              </div>
            </div>

            {/* Recent Places */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Últimos Lugares Adicionados</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Categoria</th>
                      <th className="text-left py-3 px-4">Telefone</th>
                      <th className="text-left py-3 px-4">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPlaces.map(place => (
                      <tr key={place.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{place.id}</td>
                        <td className="py-3 px-4 font-medium">{place.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {place.category || 'Sem categoria'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{place.phone || '-'}</td>
                        <td className="py-3 px-4">
                          {place.rating ? `${place.rating} ⭐` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">👤 Usuários Cadastrados</h3>
                <span className="text-sm text-gray-500">{users.length} usuário(s)</span>
              </div>
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Nenhum usuário cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nome</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Plano</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Buscas</th>
                        <th className="text-left py-3 px-4">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{u.nome}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.plano === 'demo' ? 'bg-orange-100 text-orange-800' :
                              u.plano === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                              u.plano === 'profissional' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {u.plano}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {u.searches_used} / {u.searches_limit === 999999 ? '∞' : u.searches_limit}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(u.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Places Section */}
        {activeSection === 'places' && (
          <div className="space-y-6">
            {/* Filters and Add Button */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas categorias</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadPlaces()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Search size={16} className="inline mr-2" />
                    Filtrar
                  </button>
                </div>
                <button
                  onClick={() => setShowAddPlace(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus size={16} className="inline mr-2" />
                  Adicionar
                </button>
              </div>
            </div>

            {/* Add Place Form */}
            {showAddPlace && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Adicionar Novo Lugar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nome *"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Categoria"
                    value={newPlace.category}
                    onChange={(e) => setNewPlace({...newPlace, category: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Endereço"
                    value={newPlace.address}
                    onChange={(e) => setNewPlace({...newPlace, address: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude *"
                    value={newPlace.lat}
                    onChange={(e) => setNewPlace({...newPlace, lat: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude *"
                    value={newPlace.lng}
                    onChange={(e) => setNewPlace({...newPlace, lng: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Telefone"
                    value={newPlace.phone}
                    onChange={(e) => setNewPlace({...newPlace, phone: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="url"
                    placeholder="Website"
                    value={newPlace.website}
                    onChange={(e) => setNewPlace({...newPlace, website: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={createPlace}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save size={16} className="inline mr-2" />
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowAddPlace(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {/* Places Table */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Endereço</th>
                      <th className="text-left py-3 px-4">Categoria</th>
                      <th className="text-left py-3 px-4">Telefone</th>
                      <th className="text-left py-3 px-4">Rating</th>
                      <th className="text-left py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {places.map(place => (
                      <tr key={place.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{place.id}</td>
                        <td className="py-3 px-4 font-medium">{place.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{place.address}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {place.category || 'Sem categoria'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{place.phone || '-'}</td>
                        <td className="py-3 px-4">
                          {place.rating ? `${place.rating} ⭐` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => deletePlace(place.id, place.name)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => loadPlaces(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => loadPlaces(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Search Section */}
        {activeSection === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Busca por Raio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Endereço"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Raio (metros)"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={searchNearby}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Search size={16} className="inline mr-2" />
                Buscar Próximos
              </button>
              {searchCoords && (
                <p className="mt-2 text-sm text-gray-600">{searchCoords}</p>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    📍 {searchResults.length} lugares encontrados
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToExcel(searchResults, 'busca-por-raio')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Download size={16} className="inline mr-2" />
                      Excel
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">#</th>
                        <th className="text-left py-3 px-4">Nome</th>
                        <th className="text-left py-3 px-4">Endereço</th>
                        <th className="text-left py-3 px-4">Categoria</th>
                        <th className="text-left py-3 px-4">Telefone</th>
                        <th className="text-left py-3 px-4">Distância</th>
                        <th className="text-left py-3 px-4">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((place, index) => (
                        <tr key={place.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{index + 1}</td>
                          <td className="py-3 px-4 font-medium">{place.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{place.address}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {place.category || 'Sem categoria'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{place.phone || '-'}</td>
                          <td className="py-3 px-4">{place.distance_km} km</td>
                          <td className="py-3 px-4">
                            {place.rating ? `${place.rating} ⭐` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Import Section */}
        {activeSection === 'import' && (
          <div className="space-y-6">
            {/* Mensagem de Feedback */}
            {message && (
              <div className={`rounded-xl shadow-sm p-6 border-2 ${
                message.includes('Erro') || message.includes('❌')
                  ? 'bg-red-50 border-red-200' 
                  : message.includes('Processando')
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {message.includes('Erro') || message.includes('❌') ? (
                      <AlertCircle className="text-red-600" size={24} />
                    ) : message.includes('Processando') ? (
                      <RefreshCw className="text-blue-600 animate-spin" size={24} />
                    ) : (
                      <CheckCircle className="text-green-600" size={24} />
                    )}
                    <p className={`text-lg font-semibold ${
                      message.includes('Erro') || message.includes('❌')
                        ? 'text-red-800' 
                        : message.includes('Processando')
                        ? 'text-blue-800'
                        : 'text-green-800'
                    }`}>
                      {message}
                    </p>
                  </div>
                  {message.includes('✅') && (
                    <button
                      onClick={() => changeSection('places')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Ver Lugares
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Importar via Google Places API */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Importar via Google Places API</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Cidade"
                  value={importCity}
                  onChange={(e) => setImportCity(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Máximo de Resultados"
                  value={importMax}
                  onChange={(e) => setImportMax(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <input
                type="text"
                placeholder="Keywords (separadas por vírgula)"
                value={importKeywords}
                onChange={(e) => setImportKeywords(e.target.value)}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={importPlaces}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload size={16} className="inline mr-2" />
                Importar via API
              </button>
            </div>

            {/* Importar via CSV */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Importar via Planilha CSV</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Formatos aceitos:
                </p>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs space-y-1">
                  <div className="text-gray-700 font-semibold">Formato simples:</div>
                  <div className="text-gray-500">name,address,category,lat,lon</div>
                  <div className="text-gray-700 font-semibold mt-2">Formato completo:</div>
                  <div className="text-gray-500">Número,Nome,Endereço,Categoria,Telefone,Distância,Rating,Latitude,Longitude</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  O sistema detecta automaticamente as colunas. Aceita nomes em português ou inglês.
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                <label className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Processando arquivo...
                      </span>
                    ) : (
                      <>
                        <span className="text-green-600 font-semibold">Clique para escolher arquivo</span>
                        {' '}ou arraste aqui
                      </>
                    )}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    disabled={loading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleCSVUpload(file);
                        // Limpar input para permitir upload do mesmo arquivo novamente
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Arquivo CSV com colunas: name, address, category, lat, lon
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enrich Section */}
        {activeSection === 'enrich' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Enriquecer Contatos</h3>
              <p className="text-gray-600 mb-4">
                Adiciona telefone, website e rating aos lugares usando Google Places API
              </p>
              <input
                type="number"
                placeholder="Limite de Lugares"
                value={enrichLimit}
                onChange={(e) => setEnrichLimit(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={enrichContacts}
                disabled={loading}
                className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Phone size={16} className="inline mr-2" />
                Enriquecer
              </button>
            </div>
          </div>
        )}
        {/* Admins Section */}
        {activeSection === 'admins' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">👥 Administradores do Sistema</h3>
                <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus size={16} className="inline mr-2" />
                  Novo Administrador
                </button>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <UserPlus size={16} className="inline mr-2" />
                  Criar Usuário
                </button>
              </div>
              </div>

              {/* Create User Form */}
              {showCreateUser && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium mb-4">Criar Novo Usuário</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={newUser.nome}
                      onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={newUser.senha}
                      onChange={(e) => setNewUser({...newUser, senha: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <select
                      value={newUser.plano}
                      onChange={(e) => setNewUser({...newUser, plano: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="demo">Demo (buscas ilimitadas, sem exportação)</option>
                      <option value="basico">Básico (100 buscas)</option>
                      <option value="profissional">Profissional (1000 buscas)</option>
                      <option value="enterprise">Enterprise (ilimitado)</option>
                    </select>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={createUser}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => setShowCreateUser(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Create Admin Form */}
              {showCreateAdmin && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium mb-4">Criar Novo Administrador</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={newAdmin.nome}
                      onChange={(e) => setNewAdmin({...newAdmin, nome: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={newAdmin.senha}
                      onChange={(e) => setNewAdmin({...newAdmin, senha: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="admin">Administrador</option>
                      <option value="super_admin">Super Administrador</option>
                    </select>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={createAdmin}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => setShowCreateAdmin(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Admin Modal */}
              {editingAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                    <h4 className="font-semibold text-lg mb-4">Editar Administrador</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nome completo"
                        value={editForm.nome}
                        onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="password"
                        placeholder="Nova senha (deixe vazio para não alterar)"
                        value={editForm.senha}
                        onChange={(e) => setEditForm({...editForm, senha: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">Administrador</option>
                        <option value="super_admin">Super Administrador</option>
                      </select>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={saveEditAdmin}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingAdmin(null)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Admins Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Último Login</th>
                      <th className="text-left py-3 px-4">Criado em</th>
                      {currentAdmin?.role === 'super_admin' && (
                        <th className="text-left py-3 px-4">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{admin.id}</td>
                        <td className="py-3 px-4 font-medium">{admin.nome}</td>
                        <td className="py-3 px-4">{admin.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            admin.role === 'super_admin' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {admin.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            admin.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {admin.last_login ? new Date(admin.last_login).toLocaleString('pt-BR') : 'Nunca'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(admin.created_at).toLocaleString('pt-BR')}
                        </td>
                        {currentAdmin?.role === 'super_admin' && (
                          <td className="py-3 px-4">
                            {admin.id !== currentAdmin.id && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditAdmin(admin)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={15} />
                                </button>
                                <button
                                  onClick={() => deleteAdmin(admin)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                  <h4 className="font-semibold text-lg mb-4">Editar Usuário</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={editUserForm.nome}
                      onChange={(e) => setEditUserForm({...editUserForm, nome: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Nova senha (deixe vazio para não alterar)"
                      value={editUserForm.senha}
                      onChange={(e) => setEditUserForm({...editUserForm, senha: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={editUserForm.plano}
                      onChange={(e) => setEditUserForm({...editUserForm, plano: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="demo">Demo (sem exportação)</option>
                      <option value="basico">Básico (100 buscas)</option>
                      <option value="profissional">Profissional (1000 buscas)</option>
                      <option value="enterprise">Enterprise (ilimitado)</option>
                    </select>
                    <select
                      value={editUserForm.status}
                      onChange={(e) => setEditUserForm({...editUserForm, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={saveEditUser}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">👤 Usuários Cadastrados</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{users.length} usuário(s)</span>
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <UserPlus size={14} className="inline mr-1" />
                    Novo Usuário
                  </button>
                </div>
              </div>

              {showCreateUser && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium mb-4">Criar Novo Usuário</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Nome completo" value={newUser.nome}
                      onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                    <input type="email" placeholder="Email" value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                    <input type="password" placeholder="Senha" value={newUser.senha}
                      onChange={(e) => setNewUser({...newUser, senha: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                    <select value={newUser.plano} onChange={(e) => setNewUser({...newUser, plano: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      <option value="demo">Demo (sem exportação)</option>
                      <option value="basico">Básico (100 buscas)</option>
                      <option value="profissional">Profissional (1000 buscas)</option>
                      <option value="enterprise">Enterprise (ilimitado)</option>
                    </select>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button onClick={createUser} disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Criar</button>
                    <button onClick={() => setShowCreateUser(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cancelar</button>
                  </div>
                </div>
              )}

              {users.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Nenhum usuário cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nome</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Plano</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Buscas</th>
                        <th className="text-left py-3 px-4">Criado em</th>
                        <th className="text-left py-3 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{u.nome}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.plano === 'demo' ? 'bg-orange-100 text-orange-800' :
                              u.plano === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                              u.plano === 'profissional' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>{u.plano}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>{u.status}</span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {u.searches_used} / {u.searches_limit >= 999999 ? '∞' : u.searches_limit}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(u.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => startEditUser(u)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                <Edit size={15} />
                              </button>
                              <button onClick={() => deleteUser(u)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                <Trash2 size={15} />
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
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            {/* Editor CMS Completo */}
            <CMSEditor onSave={() => {
              // Recarregar configurações do contexto global
              window.dispatchEvent(new Event('cms-config-updated'));
              setMessage('✅ Configurações salvas! As mudanças já estão visíveis.');
              setTimeout(() => setMessage(''), 5000);
            }} />

            {/* Upload de Logo Separado */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload size={20} />
                Upload de Logotipo
              </h3>
              
              <div className="flex items-center gap-4">
                {globalConfig.logoUrl ? (
                  <img src={globalConfig.logoUrl} alt="Logo atual" className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-2" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white">
                    <Globe size={32} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSiteConfig({...siteConfig, logo: e.target.files?.[0] || null})}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG ou SVG (máx. 2MB)</p>
                </div>
                <button 
                  onClick={handleSaveSiteConfig}
                  disabled={loading || !siteConfig.logo}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                  Upload
                </button>
              </div>
              
              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}
            </div>

            {/* Informações do Sistema */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Sistema</h3>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <strong>✅ API Online</strong><br />
                Servidor funcionando corretamente
              </div>
              <div className="space-y-2">
                <p><strong>Versão:</strong> 1.0.0</p>
                <p><strong>Banco de Dados:</strong> PostgreSQL + PostGIS</p>
                <p><strong>API:</strong> Node.js + Express</p>
                <p><strong>Frontend:</strong> React + TypeScript</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;