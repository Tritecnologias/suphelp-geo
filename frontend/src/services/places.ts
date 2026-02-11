// Serviço de lugares
import { apiClient } from '../config/api';
import { Place, SearchParams, GeocodeResponse, PlacesResponse, ApiResponse } from '../types';

export class PlacesService {
  // Geocoding - converter endereço em coordenadas
  async geocode(address: string): Promise<GeocodeResponse> {
    return apiClient.get<GeocodeResponse>(`/geocode?address=${encodeURIComponent(address)}`);
  }

  // Buscar lugares próximos
  async searchNearby(params: SearchParams): Promise<PlacesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.lat) queryParams.append('lat', params.lat.toString());
    if (params.lng) queryParams.append('lng', params.lng.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    return apiClient.get<PlacesResponse>(`/places/nearby?${queryParams.toString()}`);
  }

  // Busca avançada com filtros
  async search(params: SearchParams & { 
    q?: string; 
    city?: string; 
    minRating?: number; 
    hasPhone?: boolean;
    offset?: number;
  }): Promise<{
    filters: any;
    data: Place[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiClient.get(`/places/search?${queryParams.toString()}`);
  }

  // Listar todos os lugares
  async getAll(params: {
    limit?: number;
    offset?: number;
    category?: string;
    city?: string;
  } = {}): Promise<{
    data: Place[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiClient.get(`/places?${queryParams.toString()}`);
  }

  // Obter lugar por ID
  async getById(id: number): Promise<Place> {
    return apiClient.get<Place>(`/places/${id}`);
  }

  // Criar novo lugar
  async create(place: Omit<Place, 'id' | 'created_at'>): Promise<ApiResponse<Place>> {
    return apiClient.post<ApiResponse<Place>>('/places', place);
  }

  // Atualizar lugar
  async update(id: number, place: Partial<Place>): Promise<ApiResponse<Place>> {
    return apiClient.put<ApiResponse<Place>>(`/places/${id}`, place);
  }

  // Deletar lugar
  async delete(id: number): Promise<ApiResponse<{ id: number; name: string }>> {
    return apiClient.delete<ApiResponse<{ id: number; name: string }>>(`/places/${id}`);
  }

  // Importar via Google Places API
  async importFromGooglePlaces(params: {
    city: string;
    keywords: string[];
    maxResults: number;
  }): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/import-places-api', {
      city: params.city,
      keywords: params.keywords,
      maxResults: params.maxResults
    });
  }

  // Enriquecer contatos
  async enrichContacts(params: {
    placeIds?: number[];
    limit: number;
  }): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/enrich-contacts', params);
  }

  // Importar CSV
  async importCsv(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post<ApiResponse<any>>('/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Exportar dados
  async exportData(format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const response = await fetch(`${apiClient.baseURL}/places/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Erro ao exportar dados');
    }
    
    return response.blob();
  }
}

export const placesService = new PlacesService();