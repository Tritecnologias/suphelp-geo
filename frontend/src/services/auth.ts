// Serviço de autenticação
import { apiClient } from '../config/api';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../types';

export class AuthService {
  // Login de usuário
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    if (response.success && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  // Registro de usuário
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', userData);
  }

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Verificar se está logado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Obter token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Obter perfil do usuário
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/profile');
  }

  // Verificar se token é válido
  async validateToken(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      this.logout();
      return false;
    }
  }
}

export const authService = new AuthService();