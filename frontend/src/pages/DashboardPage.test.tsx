import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import * as usePlacesHook from '../hooks/usePlaces';
import * as useAuthHook from '../hooks/useAuth';

// Mock the hooks
vi.mock('../hooks/usePlaces');
vi.mock('../hooks/useAuth');

describe('DashboardPage - Hybrid Search Integration', () => {
  const mockUsePlaces = {
    places: [],
    isLoading: false,
    error: null,
    geocodeAddress: vi.fn(),
    hybridSearch: vi.fn(),
    searchByAddress: vi.fn(),
    searchAdvanced: vi.fn(),
    clearResults: vi.fn(),
    hasResults: false,
    totalResults: 0,
    hybridSummary: null,
    apiWarning: null,
  };

  const mockUseAuth = {
    user: { email: 'test@example.com', plano: 'basico', role: 'user' },
    logout: vi.fn(),
    isAuthenticated: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(usePlacesHook, 'usePlaces').mockReturnValue(mockUsePlaces as any);
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue(mockUseAuth as any);
  });

  it('should display hybrid search summary when results are available', () => {
    const mockPlaces = [
      {
        id: 1,
        name: 'Local Place',
        address: 'Address 1',
        category: 'Condomínio',
        lat: -23.1858,
        lng: -46.8978,
        metadata: { source: 'local' as const },
      },
      {
        id: 2,
        name: 'Google Place',
        address: 'Address 2',
        category: 'Hospital',
        lat: -23.1858,
        lng: -46.8978,
        metadata: { source: 'google' as const },
      },
    ];

    const mockSummary = {
      local: 1,
      google: 1,
      from_recent_cache: false,
      radius_limited: false,
    };

    vi.spyOn(usePlacesHook, 'usePlaces').mockReturnValue({
      ...mockUsePlaces,
      places: mockPlaces,
      hasResults: true,
      totalResults: 2,
      hybridSummary: mockSummary,
    } as any);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Resumo da Busca')).toBeInTheDocument();
    expect(screen.getByText('Banco Local')).toBeInTheDocument();
    expect(screen.getByText('Google Places')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // local count
  });

  it('should display API warning when present', () => {
    vi.spyOn(usePlacesHook, 'usePlaces').mockReturnValue({
      ...mockUsePlaces,
      apiWarning: 'API key inválida - retornando apenas resultados locais',
    } as any);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Aviso')).toBeInTheDocument();
    expect(screen.getByText('API key inválida - retornando apenas resultados locais')).toBeInTheDocument();
  });

  it('should display radius limited indicator when applicable', () => {
    const mockSummary = {
      local: 5,
      google: 3,
      from_recent_cache: false,
      radius_limited: true,
    };

    vi.spyOn(usePlacesHook, 'usePlaces').mockReturnValue({
      ...mockUsePlaces,
      places: [{ id: 1, name: 'Test', metadata: { source: 'local' } }] as any,
      hasResults: true,
      totalResults: 1,
      hybridSummary: mockSummary,
    } as any);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Raio de busca foi limitado para otimizar custos')).toBeInTheDocument();
  });

  it('should display cache indicator when using recent cache', () => {
    const mockSummary = {
      local: 5,
      google: 0,
      from_recent_cache: true,
      radius_limited: false,
    };

    vi.spyOn(usePlacesHook, 'usePlaces').mockReturnValue({
      ...mockUsePlaces,
      places: [{ id: 1, name: 'Test', metadata: { source: 'local' } }] as any,
      hasResults: true,
      totalResults: 1,
      hybridSummary: mockSummary,
    } as any);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Usando cache recente (últimas 24h)')).toBeInTheDocument();
  });

  it('should display source badges for each place', () => {
    const mockPlaces = [
      {
        id: 1,
        name: 'Local Place',
        address: 'Address 1',
        category: 'Condomínio',
        lat: -23.1858,
        lng: -46.8978,
        metadata: { source: 'local' as const },
      },
      {
        id: 2,
        name: 'Google Place',
        address: 'Address 2',
        category: 'Hospital',
        lat: -23.1858,
        lng: -46.8978,
        metadata: { source: 'google' as const },
      },
    ];

    vi.spyOn(usePlacesHook, 'usePlaces').mockReturnValue({
      ...mockUsePlaces,
      places: mockPlaces,
      hasResults: true,
      totalResults: 2,
      hybridSummary: { local: 1, google: 1, from_recent_cache: false, radius_limited: false },
    } as any);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('💾 Local')).toBeInTheDocument();
    expect(screen.getByText('🌐 Google')).toBeInTheDocument();
  });
});
