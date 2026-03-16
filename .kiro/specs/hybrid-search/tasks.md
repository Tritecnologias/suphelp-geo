# Implementation Plan: Busca Híbrida (Local + Google Places API)

## Overview

Este plano implementa a funcionalidade de busca híbrida que prioriza o banco de dados local PostgreSQL + PostGIS e complementa com Google Places API apenas quando necessário. A implementação será feita em JavaScript (Node.js) para manter consistência com o backend existente.

A estratégia de implementação segue uma abordagem incremental: primeiro criamos os componentes base (parser, serviços), depois integramos com o banco de dados (cache, logging), e finalmente conectamos tudo através da rota híbrida e frontend.

## Tasks

- [x] 1. Preparar infraestrutura do banco de dados
  - Adicionar coluna `google_place_id` na tabela `places` com índice único
  - Criar tabela `search_cache` para logging de chamadas à API
  - Executar migration no banco de dados
  - _Requirements: 3.3, 5.1, 5.2_

- [ ] 2. Implementar Google Places Parser
  - [x] 2.1 Criar módulo `googlePlacesParser.js` com função de conversão
    - Implementar função `parse(googlePlace)` que converte um lugar do Google para formato local
    - Implementar função `parseMany(googlePlaces)` para conversão em lote
    - Implementar função `mapCategory(googleType)` para mapear tipos do Google para categorias locais
    - Tratar campos opcionais (phone, website, rating) com valores null quando ausentes
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [ ]* 2.2 Escrever teste de propriedade para conversão round-trip
    - **Property 8: Conversão de Dados Round-Trip**
    - **Validates: Requirements 3.2, 11.10**

  - [ ]* 2.3 Escrever testes unitários para parser
    - Testar conversão de todos os campos obrigatórios
    - Testar tratamento de campos opcionais ausentes
    - Testar mapeamento de categorias conhecidas e desconhecidas
    - _Requirements: 11.1-11.9_

- [ ] 3. Implementar Google Places Service
  - [x] 3.1 Criar módulo `googlePlacesService.js` com integração à API
    - Implementar classe `GooglePlacesService` com método `nearbySearch(params)`
    - Configurar timeout de 5 segundos para requisições
    - Implementar limitação de raio baseada em `GOOGLE_SEARCH_RADIUS_LIMIT`
    - Tratar diferentes status de resposta da API (OK, ZERO_RESULTS, erros)
    - _Requirements: 2.2, 7.1, 7.2, 7.3, 8.3_

  - [ ]* 3.2 Escrever teste de propriedade para preservação de parâmetros
    - **Property 5: Preservação de Parâmetros na Chamada à API**
    - **Validates: Requirements 2.2, 7.3**

  - [ ]* 3.3 Escrever testes unitários para Google Places Service
    - Testar chamada bem-sucedida à API
    - Testar timeout após 5 segundos
    - Testar limitação de raio
    - Testar tratamento de diferentes status de erro
    - _Requirements: 2.2, 7.3, 8.3_

- [x] 4. Checkpoint - Validar componentes base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implementar Cache Writer
  - [x] 5.1 Criar módulo `cacheWriter.js` para salvar resultados no banco
    - Implementar classe `CacheWriter` com método `cacheResults(places)`
    - Implementar método `cacheSingle(place)` com INSERT ... ON CONFLICT
    - Usar `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` para coordenadas PostGIS
    - Executar cache em background usando `setImmediate` sem bloquear resposta
    - Atualizar apenas campos vazios em caso de duplicata (enriquecimento)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.2 Escrever teste de propriedade para cache automático
    - **Property 7: Cache Automático de Resultados**
    - **Validates: Requirements 3.1**

  - [ ]* 5.3 Escrever teste de propriedade para formato PostGIS
    - **Property 10: Formato de Coordenadas PostGIS**
    - **Validates: Requirements 3.5**

  - [ ]* 5.4 Escrever teste de propriedade para prevenção de duplicatas
    - **Property 9: Prevenção de Duplicatas no Cache**
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 5.5 Escrever testes unitários para Cache Writer
    - Testar inserção de novo lugar
    - Testar atualização de lugar existente (enriquecimento)
    - Testar conversão de coordenadas PostGIS
    - Testar execução em background
    - _Requirements: 3.1-3.6_

- [ ] 6. Implementar API Call Logger
  - [x] 6.1 Criar módulo `apiLogger.js` para registrar chamadas à API
    - Implementar classe `APICallLogger` com método `logCall(params)`
    - Implementar método `logError(params, error)` para registrar falhas
    - Implementar método `calculateCost(resultsCount)` para estimar custos
    - Salvar logs na tabela `search_cache` com status "completed" ou "failed"
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Escrever teste de propriedade para logging completo
    - **Property 12: Logging Completo de Chamadas à API**
    - **Validates: Requirements 5.1, 5.4, 5.5**

  - [ ]* 6.3 Escrever teste de propriedade para status de log
    - **Property 13: Status de Log Correto**
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 6.4 Escrever testes unitários para API Logger
    - Testar log de chamada bem-sucedida
    - Testar log de chamada com erro
    - Testar cálculo de custo estimado
    - _Requirements: 5.1-5.5_

- [x] 7. Checkpoint - Validar componentes de persistência
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implementar Hybrid Search Service
  - [x] 8.1 Criar módulo `hybridSearchService.js` com orquestração da busca
    - Implementar função `hybridSearch(params)` que orquestra todo o fluxo
    - Implementar busca local com todos os filtros (raio, categoria, rating, phone)
    - Implementar verificação de threshold usando `MIN_RESULTS_THRESHOLD` (padrão: 10)
    - Implementar verificação de cache recente (últimas 24h, ±100m)
    - Implementar chamada à API do Google quando necessário
    - Implementar merge e deduplicação de resultados por `google_place_id`
    - Implementar tratamento de erros com fallback para resultados locais
    - Adicionar metadata de origem ("local" ou "google") em cada resultado
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.5, 4.1, 4.2, 9.1, 9.2_

  - [ ]* 8.2 Escrever teste de propriedade para busca local primeiro
    - **Property 1: Busca Local Sempre Executada Primeiro**
    - **Validates: Requirements 1.1**

  - [ ]* 8.3 Escrever teste de propriedade para aplicação de filtros
    - **Property 2: Filtros Aplicados na Busca Local**
    - **Validates: Requirements 1.2**

  - [ ]* 8.4 Escrever teste de propriedade para marcação de origem
    - **Property 3: Marcação de Origem dos Resultados**
    - **Validates: Requirements 1.4, 2.4, 6.1**

  - [ ]* 8.5 Escrever teste de propriedade para fallback Google Places
    - **Property 4: Fallback para Google Places**
    - **Validates: Requirements 2.1**

  - [ ]* 8.6 Escrever teste de propriedade para remoção de duplicatas
    - **Property 6: Remoção de Duplicatas**
    - **Validates: Requirements 2.5**

  - [ ]* 8.7 Escrever teste de propriedade para validação de threshold
    - **Property 11: Validação de Threshold**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 8.8 Escrever teste de propriedade para cache temporal
    - **Property 17: Cache Temporal de Buscas**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 8.9 Escrever testes unitários para Hybrid Search Service
    - Testar busca com resultados suficientes (>= threshold)
    - Testar busca com resultados insuficientes (< threshold)
    - Testar busca com cache recente
    - Testar merge e deduplicação de resultados
    - Testar tratamento de erros da API
    - _Requirements: 1.1, 1.2, 2.1, 2.5, 4.1, 9.1_

- [ ] 9. Implementar rota `/api/places/hybrid-search`
  - [x] 9.1 Adicionar rota no `server.js` com validação de parâmetros
    - Criar endpoint GET `/api/places/hybrid-search`
    - Validar parâmetros obrigatórios (lat, lng)
    - Aceitar parâmetros opcionais (radius, category, minRating, hasPhone, limit)
    - Chamar `hybridSearchService.search(params)`
    - Formatar resposta com center, radius, total, summary e data
    - Incluir campo `warning` quando houver erro da API
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 9.2 Escrever teste de propriedade para resumo de resultados
    - **Property 14: Resumo de Resultados por Origem**
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 9.3 Escrever teste de propriedade para limitação de raio
    - **Property 15: Limitação de Raio**
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [ ]* 9.4 Escrever teste de propriedade para tratamento de erros
    - **Property 16: Tratamento de Erros da API**
    - **Validates: Requirements 2.3, 8.1, 8.2, 8.3, 8.4, 8.5**

  - [ ]* 9.5 Escrever teste de propriedade para compatibilidade de parâmetros
    - **Property 18: Compatibilidade de Parâmetros**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ]* 9.6 Escrever testes de integração para rota híbrida
    - Testar fluxo completo: busca local → API → cache → resposta
    - Testar fluxo com cache recente
    - Testar fluxo com erro da API
    - Testar compatibilidade de parâmetros com `/api/places/nearby`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 10. Checkpoint - Validar backend completo
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Atualizar frontend para usar busca híbrida
  - [x] 11.1 Adicionar função `hybridSearch()` no `frontend/src/services/places.ts`
    - Criar função que chama `/api/places/hybrid-search`
    - Manter mesma interface da função `nearbySearch()` existente
    - Retornar dados com metadata de origem
    - _Requirements: 10.1, 10.2_

  - [x] 11.2 Atualizar `DashboardPage.tsx` para usar `hybridSearch()`
    - Substituir chamada de `nearbySearch()` por `hybridSearch()`
    - Exibir badge visual diferenciando resultados locais de Google
    - Mostrar resumo de resultados por origem (local vs google)
    - Exibir mensagem de aviso quando houver erro da API
    - Mostrar indicador quando raio foi limitado
    - _Requirements: 6.1, 6.3, 6.4, 7.4_

  - [ ]* 11.3 Escrever testes unitários para componentes frontend
    - Testar chamada à API híbrida
    - Testar exibição de badges de origem
    - Testar exibição de avisos
    - _Requirements: 6.1, 6.4_

- [ ] 12. Configurar variáveis de ambiente
  - [x] 12.1 Adicionar variáveis no arquivo `.env`
    - Adicionar `GOOGLE_PLACES_API_KEY` (chave da API do Google Places)
    - Adicionar `MIN_RESULTS_THRESHOLD` (padrão: 10)
    - Adicionar `GOOGLE_SEARCH_RADIUS_LIMIT` (padrão: 5000)
    - Documentar variáveis no README ou arquivo de configuração
    - _Requirements: 4.1, 4.2, 7.1, 7.2_

- [x] 13. Checkpoint final - Validar sistema completo
  - Ensure all tests pass, ask the user if questions arise.
  - Testar fluxo end-to-end manualmente
  - Verificar logs de chamadas à API no banco
  - Verificar cache de resultados no banco
  - Validar performance (< 500ms local, < 3s híbrido)

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam correção universal
- Testes unitários validam exemplos específicos e casos extremos
- A implementação usa JavaScript (Node.js) para consistência com o backend existente
- Todos os componentes devem ser criados no diretório `backend/src/services/`
- A migration SQL deve ser criada em `backend/src/migrations/`
