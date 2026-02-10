// Tipos TypeScript para o projeto

export interface User {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  plano: 'basico' | 'profissional' | 'enterprise';
  status: 'pending' | 'active' | 'inactive';
  searches_used: number;
  searches_limit: number;
  created_at: string;
}

export interface Admin {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

export interface Place {
  id: number;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  lat: number;
  lng: number;
  distance_meters?: number;
  distance_km?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  empresa?: string;
  plano: 'basico' | 'profissional' | 'enterprise';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    nome: string;
    email: string;
    plano: string;
    status: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SearchParams {
  lat?: number;
  lng?: number;
  address?: string;
  radius?: number;
  category?: string;
  limit?: number;
}

export interface GeocodeResponse {
  success: boolean;
  data: {
    lat: number;
    lng: number;
    formatted_address: string;
  };
}

export interface PlacesResponse {
  center: {
    lat: number;
    lng: number;
  };
  radius_meters: number;
  total: number;
  data: Place[];
}

export interface CMSConfig {
  [section: string]: {
    [key: string]: {
      value: string;
      type: string;
    };
  };
}

export interface ContactInfo {
  email: string;
  button_text: string;
  email_subject: string;
  email_body: string;
}