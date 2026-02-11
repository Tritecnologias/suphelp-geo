// Serviço de administração
import { apiClient } from '../config/api';
import { Admin, User, ApiResponse, CMSConfig } from '../types';

export class AdminService {
  // === ADMIN MANAGEMENT ===
  
  // Listar administradores
  async listAdmins(): Promise<Admin[]> {
    return apiClient.get<Admin[]>('/admin/list');
  }

  // Criar administrador
  async createAdmin(adminData: {
    nome: string;
    email: string;
    senha: string;
    role: 'admin' | 'super_admin';
  }): Promise<ApiResponse<Admin>> {
    return apiClient.post<ApiResponse<Admin>>('/admin/create', adminData);
  }

  // Alterar senha do admin
  async changePassword(passwordData: {
    senhaAtual: string;
    novaSenha: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>('/admin/change-password', passwordData);
  }

  // === USER MANAGEMENT (Mock - implementar no backend) ===
  
  // Listar usuários
  async listUsers(params: {
    limit?: number;
    offset?: number;
    search?: string;
    plano?: string;
    status?: string;
  } = {}): Promise<{
    data: User[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    // Mock data - implementar endpoint real no backend
    const mockUsers: User[] = [
      {
        id: 1,
        nome: 'João Silva',
        email: 'joao@email.com',
        telefone: '(11) 99999-9999',
        empresa: 'Empresa ABC',
        plano: 'profissional',
        status: 'active',
        searches_used: 45,
        searches_limit: 500,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        nome: 'Maria Santos',
        email: 'maria@email.com',
        telefone: '(11) 88888-8888',
        empresa: 'Empresa XYZ',
        plano: 'basico',
        status: 'active',
        searches_used: 12,
        searches_limit: 100,
        created_at: '2024-02-01T14:30:00Z'
      },
      {
        id: 3,
        nome: 'Pedro Costa',
        email: 'pedro@email.com',
        telefone: '(11) 77777-7777',
        empresa: 'Startup Tech',
        plano: 'enterprise',
        status: 'inactive',
        searches_used: 0,
        searches_limit: 1000,
        created_at: '2024-01-20T09:15:00Z'
      },
      {
        id: 4,
        nome: 'Ana Oliveira',
        email: 'ana@email.com',
        telefone: '(11) 66666-6666',
        empresa: 'Consultoria Digital',
        plano: 'profissional',
        status: 'active',
        searches_used: 234,
        searches_limit: 500,
        created_at: '2024-01-10T08:20:00Z'
      },
      {
        id: 5,
        nome: 'Carlos Mendes',
        email: 'carlos@email.com',
        telefone: '(11) 55555-5555',
        empresa: 'Tech Solutions',
        plano: 'enterprise',
        status: 'active',
        searches_used: 567,
        searches_limit: 1000,
        created_at: '2024-01-05T16:45:00Z'
      }
    ];

    // Aplicar filtros
    let filteredUsers = mockUsers;
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.nome.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.empresa?.toLowerCase().includes(search)
      );
    }
    
    if (params.plano) {
      filteredUsers = filteredUsers.filter(user => user.plano === params.plano);
    }
    
    if (params.status) {
      filteredUsers = filteredUsers.filter(user => user.status === params.status);
    }

    // Paginação
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      data: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        limit,
        offset,
        hasMore: offset + limit < filteredUsers.length
      }
    };
  }

  // Criar usuário
  async createUser(userData: {
    nome: string;
    email: string;
    telefone?: string;
    empresa?: string;
    plano: 'basico' | 'profissional' | 'enterprise';
    searches_limit: number;
  }): Promise<ApiResponse<User>> {
    // Mock - implementar endpoint real
    return {
      success: true,
      data: {
        id: Date.now(),
        ...userData,
        status: 'active',
        searches_used: 0,
        created_at: new Date().toISOString()
      } as User
    };
  }

  // Atualizar usuário
  async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    // Mock - implementar endpoint real
    return {
      success: true,
      data: { id, ...userData } as User
    };
  }

  // Deletar usuário
  async deleteUser(id: number): Promise<ApiResponse<{ id: number }>> {
    // Mock - implementar endpoint real
    return {
      success: true,
      data: { id }
    };
  }

  // === CMS MANAGEMENT ===
  
  // Obter configurações do CMS
  async getCmsConfig(section?: string): Promise<CMSConfig> {
    const params = section ? `?section=${section}` : '';
    return apiClient.get<CMSConfig>(`/cms/config${params}`);
  }

  // Atualizar configuração do CMS
  async updateCmsConfig(section: string, key: string, value: string): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>('/cms/config', {
      section,
      key,
      value
    });
  }

  // Atualizar múltiplas configurações do CMS
  async updateCmsConfigBulk(config: CMSConfig): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>('/cms/config/bulk', config);
  }

  // === STATISTICS ===
  
  // Obter estatísticas do dashboard
  async getDashboardStats(): Promise<{
    totalPlaces: number;
    totalUsers: number;
    totalSearches: number;
    totalAdmins: number;
    placesThisMonth: number;
    usersThisMonth: number;
    searchesThisMonth: number;
    recentActivity: Array<{
      id: number;
      type: 'user_registered' | 'place_created' | 'search_performed' | 'admin_login';
      description: string;
      timestamp: string;
      user?: string;
    }>;
  }> {
    // Mock data - implementar endpoint real
    return {
      totalPlaces: 1247,
      totalUsers: 156,
      totalSearches: 3420,
      totalAdmins: 3,
      placesThisMonth: 89,
      usersThisMonth: 23,
      searchesThisMonth: 567,
      recentActivity: [
        {
          id: 1,
          type: 'user_registered',
          description: 'Novo usuário cadastrado: Ana Silva',
          timestamp: '2024-02-11T10:30:00Z',
          user: 'ana.silva@email.com'
        },
        {
          id: 2,
          type: 'place_created',
          description: 'Novo lugar adicionado: Restaurante Bom Sabor',
          timestamp: '2024-02-11T09:15:00Z'
        },
        {
          id: 3,
          type: 'search_performed',
          description: '15 buscas realizadas na última hora',
          timestamp: '2024-02-11T08:45:00Z'
        },
        {
          id: 4,
          type: 'admin_login',
          description: 'Admin login: admin@suphelp.com.br',
          timestamp: '2024-02-11T08:00:00Z',
          user: 'admin@suphelp.com.br'
        }
      ]
    };
  }
}

export const adminService = new AdminService();