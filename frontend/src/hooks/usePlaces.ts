// Hook para gerenciar lugares
import { useState, useCallback } from 'react';
import { placesService } from '../services/places';
import { Place, SearchParams, GeocodeResponse } from '../types';

export const usePlaces = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5000);

  const clearError = () => setError(null);

  // Geocoding
  const geocodeAddress = useCallback(async (address: string): Promise<GeocodeResponse | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = await placesService.geocode(address);
      
      if (response.success) {
        setSearchCenter({
          lat: response.data.lat,
          lng: response.data.lng
        });
        return response;
      } else {
        throw new Error('Endereço não encontrado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao geocodificar endereço';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar lugares próximos
  const searchNearby = useCallback(async (params: SearchParams) => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = await placesService.searchNearby(params);
      setPlaces(response.data);
      setSearchCenter(response.center);
      setSearchRadius(response.radius_meters);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar lugares';
      setError(errorMessage);
      setPlaces([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar por endereço e raio
  const searchByAddress = useCallback(async (address: string, radius: number = 5000) => {
    try {
      // Primeiro geocodifica o endereço
      const geocodeResult = await geocodeAddress(address);
      
      if (geocodeResult) {
        // Depois busca lugares próximos
        return await searchNearby({
          lat: geocodeResult.data.lat,
          lng: geocodeResult.data.lng,
          radius
        });
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na busca';
      setError(errorMessage);
      return null;
    }
  }, [geocodeAddress, searchNearby]);

  // Busca avançada
  const searchAdvanced = useCallback(async (params: SearchParams & {
    q?: string;
    city?: string;
    minRating?: number;
    hasPhone?: boolean;
    offset?: number;
  }) => {
    try {
      setIsLoading(true);
      clearError();
      
      const response = await placesService.search(params);
      setPlaces(response.data);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na busca avançada';
      setError(errorMessage);
      setPlaces([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Limpar resultados
  const clearResults = useCallback(() => {
    setPlaces([]);
    setSearchCenter(null);
    setError(null);
  }, []);

  // Exportar dados (simulado - implementar conforme necessário)
  const exportToExcel = useCallback(async () => {
    try {
      // Implementar exportação para Excel
      console.log('Exportando para Excel...', places);
      // Aqui você pode implementar a lógica de exportação
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar';
      setError(errorMessage);
    }
  }, [places]);

  const exportToPDF = useCallback(async () => {
    try {
      // Implementar exportação para PDF
      console.log('Exportando para PDF...', places);
      // Aqui você pode implementar a lógica de exportação
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar';
      setError(errorMessage);
    }
  }, [places]);

  return {
    // Estado
    places,
    isLoading,
    error,
    searchCenter,
    searchRadius,
    
    // Ações
    geocodeAddress,
    searchNearby,
    searchByAddress,
    searchAdvanced,
    clearResults,
    clearError,
    exportToExcel,
    exportToPDF,
    
    // Dados computados
    hasResults: places.length > 0,
    totalResults: places.length,
  };
};