# Requirements Document - Busca Híbrida (Local + Google Places API)

## Introduction

O sistema SupHelp Geo atualmente possui dados de lugares apenas da cidade de Jundiaí importados no banco de dados local. Quando usuários buscam por lugares em outras cidades ou regiões, não obtêm resultados. A funcionalidade de busca híbrida resolve este problema implementando uma estratégia inteligente de cache que prioriza o banco local (grátis) e complementa com Google Places API (pago) apenas quando necessário, salvando automaticamente os novos resultados para futuras consultas.

Esta abordagem reduz custos da API do Google enquanto expande a cobertura geográfica do sistema de forma incremental e sob demanda.

## Glossary

- **Local_Database**: Banco de dados PostgreSQL + PostGIS com lugares já importados
- **Google_Places_API**: API externa do Google para buscar informações de lugares
- **Hybrid_Search_Service**: Serviço que orquestra a busca híbrida entre banco local e Google Places
- **Search_Cache**: Tabela opcional para rastrear buscas realizadas e evitar duplicatas
- **Result_Threshold**: Número mínimo de resultados do banco local antes de acionar Google Places
- **Search_Request**: Requisição de busca contendo coordenadas, raio e filtros
- **Place_Record**: Registro de um lugar no banco de dados
- **API_Call_Logger**: Componente que registra chamadas à API do Google para monitoramento
- **Cache_Writer**: Componente que salva resultados do Google no banco local

## Requirements

### Requirement 1: Busca Prioritária no Banco Local

**User Story:** Como desenvolvedor do sistema, eu quero que todas as buscas consultem primeiro o banco local, para que possamos economizar custos da API do Google.

#### Acceptance Criteria

1. WHEN uma Search_Request é recebida, THE Hybrid_Search_Service SHALL executar busca no Local_Database primeiro
2. THE Hybrid_Search_Service SHALL aplicar todos os filtros da requisição (raio, categorias, rating mínimo) na busca local
3. THE Hybrid_Search_Service SHALL retornar resultados do Local_Database em menos de 500ms
4. THE Hybrid_Search_Service SHALL marcar cada resultado com origem "local" no campo metadata

### Requirement 2: Fallback Inteligente para Google Places

**User Story:** Como usuário do sistema, eu quero que o sistema busque automaticamente no Google Places quando não houver resultados suficientes localmente, para que eu sempre obtenha informações relevantes.

#### Acceptance Criteria

1. WHEN resultados do Local_Database são menores que Result_Threshold, THE Hybrid_Search_Service SHALL executar busca no Google_Places_API
2. THE Hybrid_Search_Service SHALL usar os mesmos parâmetros de busca (coordenadas, raio, categorias) na chamada ao Google_Places_API
3. IF Google_Places_API retornar erro, THEN THE Hybrid_Search_Service SHALL retornar apenas resultados locais com mensagem de aviso
4. THE Hybrid_Search_Service SHALL marcar cada resultado do Google com origem "google" no campo metadata
5. THE Hybrid_Search_Service SHALL combinar resultados locais e do Google removendo duplicatas baseado em google_place_id

### Requirement 3: Cache Automático de Resultados

**User Story:** Como administrador do sistema, eu quero que resultados do Google Places sejam salvos automaticamente no banco local, para que futuras buscas na mesma região não precisem chamar a API novamente.

#### Acceptance Criteria

1. WHEN Google_Places_API retorna resultados, THE Cache_Writer SHALL salvar cada Place_Record no Local_Database
2. THE Cache_Writer SHALL converter dados do formato Google Places para o schema do banco local
3. THE Cache_Writer SHALL verificar duplicatas usando google_place_id antes de inserir
4. IF um Place_Record já existe com mesmo google_place_id, THEN THE Cache_Writer SHALL atualizar apenas campos vazios (enriquecimento)
5. THE Cache_Writer SHALL salvar coordenadas como geometria PostGIS usando ST_SetSRID(ST_MakePoint(lng, lat), 4326)
6. THE Cache_Writer SHALL completar operação de cache em background sem bloquear resposta ao usuário

### Requirement 4: Configuração de Threshold

**User Story:** Como administrador do sistema, eu quero configurar o número mínimo de resultados antes de acionar o Google Places, para que eu possa controlar o equilíbrio entre cobertura e custos.

#### Acceptance Criteria

1. THE Hybrid_Search_Service SHALL ler Result_Threshold da variável de ambiente MIN_RESULTS_THRESHOLD
2. WHERE MIN_RESULTS_THRESHOLD não está definido, THE Hybrid_Search_Service SHALL usar valor padrão de 10
3. THE Hybrid_Search_Service SHALL permitir valores de Result_Threshold entre 0 e 100
4. WHEN Result_Threshold é 0, THE Hybrid_Search_Service SHALL sempre buscar no Google_Places_API (modo sempre híbrido)

### Requirement 5: Logging de Chamadas à API

**User Story:** Como administrador do sistema, eu quero registrar todas as chamadas ao Google Places API, para que eu possa monitorar custos e uso da API.

#### Acceptance Criteria

1. WHEN Hybrid_Search_Service chama Google_Places_API, THE API_Call_Logger SHALL registrar timestamp, coordenadas, raio e número de resultados
2. THE API_Call_Logger SHALL salvar logs na tabela Search_Cache com status "completed"
3. IF Google_Places_API retornar erro, THEN THE API_Call_Logger SHALL registrar erro com status "failed"
4. THE API_Call_Logger SHALL incluir tempo de resposta da API em milissegundos
5. THE API_Call_Logger SHALL registrar custo estimado baseado no número de Place Details chamados

### Requirement 6: Indicador Visual de Origem dos Dados

**User Story:** Como usuário do sistema, eu quero ver de onde vieram os resultados da busca, para que eu saiba se são dados locais ou em tempo real do Google.

#### Acceptance Criteria

1. THE Hybrid_Search_Service SHALL incluir campo "source" em cada resultado com valores "local" ou "google"
2. THE Hybrid_Search_Service SHALL incluir campo "cached_at" para resultados locais indicando quando foram salvos
3. THE Hybrid_Search_Service SHALL incluir resumo no response indicando total de resultados por origem
4. THE Frontend SHALL exibir badge visual diferenciando resultados locais (cache) de resultados do Google (tempo real)

### Requirement 7: Limite de Raio para Google Places

**User Story:** Como administrador do sistema, eu quero limitar o raio máximo de busca no Google Places, para que eu possa controlar custos evitando buscas muito amplas.

#### Acceptance Criteria

1. THE Hybrid_Search_Service SHALL ler limite de raio da variável GOOGLE_SEARCH_RADIUS_LIMIT
2. WHERE GOOGLE_SEARCH_RADIUS_LIMIT não está definido, THE Hybrid_Search_Service SHALL usar valor padrão de 5000 metros
3. WHEN raio da Search_Request excede GOOGLE_SEARCH_RADIUS_LIMIT, THE Hybrid_Search_Service SHALL usar GOOGLE_SEARCH_RADIUS_LIMIT para chamada ao Google_Places_API
4. THE Hybrid_Search_Service SHALL informar no response quando raio foi limitado

### Requirement 8: Tratamento de Erros da API

**User Story:** Como usuário do sistema, eu quero que o sistema continue funcionando mesmo quando a API do Google falhar, para que eu sempre receba algum resultado útil.

#### Acceptance Criteria

1. IF Google_Places_API retornar erro de autenticação, THEN THE Hybrid_Search_Service SHALL retornar resultados locais com mensagem "API key inválida"
2. IF Google_Places_API retornar erro de quota excedida, THEN THE Hybrid_Search_Service SHALL retornar resultados locais com mensagem "Limite de API atingido"
3. IF Google_Places_API não responder em 5 segundos, THEN THE Hybrid_Search_Service SHALL cancelar requisição e retornar apenas resultados locais
4. THE Hybrid_Search_Service SHALL registrar todos os erros da API no console com nível ERROR
5. THE Hybrid_Search_Service SHALL retornar status HTTP 200 mesmo com erro da API, incluindo resultados locais

### Requirement 9: Evitar Chamadas Duplicadas

**User Story:** Como administrador do sistema, eu quero evitar chamadas duplicadas ao Google Places para a mesma região em curto período, para que eu possa economizar custos.

#### Acceptance Criteria

1. WHEN uma Search_Request é recebida, THE Hybrid_Search_Service SHALL verificar Search_Cache para buscas similares nos últimos 24 horas
2. WHERE existe busca similar recente (mesmas coordenadas ±100m e mesmo raio), THE Hybrid_Search_Service SHALL usar apenas resultados do Local_Database
3. THE Hybrid_Search_Service SHALL considerar buscas similares apenas se tiveram sucesso (status "completed")
4. THE Hybrid_Search_Service SHALL incluir no response indicador "from_recent_cache" quando usar esta otimização

### Requirement 10: Compatibilidade com API Existente

**User Story:** Como desenvolvedor frontend, eu quero que a nova rota de busca híbrida seja compatível com a rota atual, para que eu possa migrar gradualmente sem quebrar funcionalidades.

#### Acceptance Criteria

1. THE Hybrid_Search_Service SHALL aceitar mesmos parâmetros da rota /api/places/nearby (lat, lng, radius, category, minRating, hasPhone, limit)
2. THE Hybrid_Search_Service SHALL retornar response no mesmo formato da rota /api/places/nearby com campos adicionais de metadata
3. THE Hybrid_Search_Service SHALL manter compatibilidade com filtros de categoria múltipla (separados por vírgula)
4. THE Hybrid_Search_Service SHALL respeitar limite máximo de resultados especificado no parâmetro limit

### Requirement 11: Parser e Conversor de Dados do Google Places

**User Story:** Como desenvolvedor do sistema, eu quero converter automaticamente dados do Google Places para o formato do banco local, para que os dados sejam consistentes independente da origem.

#### Acceptance Criteria

1. THE Google_Places_Parser SHALL converter campo "name" do Google para coluna "name" do banco
2. THE Google_Places_Parser SHALL converter campo "formatted_address" do Google para coluna "address" do banco
3. THE Google_Places_Parser SHALL converter campo "types[0]" do Google para coluna "category" do banco
4. THE Google_Places_Parser SHALL converter campos "geometry.location.lat" e "geometry.location.lng" para geometria PostGIS
5. THE Google_Places_Parser SHALL converter campo "place_id" do Google para coluna "google_place_id" do banco
6. THE Google_Places_Parser SHALL converter campo "rating" do Google para coluna "rating" do banco
7. THE Google_Places_Parser SHALL converter campo "user_ratings_total" do Google para coluna "user_ratings_total" do banco
8. THE Google_Places_Parser SHALL converter campo "formatted_phone_number" do Google para coluna "phone" do banco
9. THE Google_Places_Parser SHALL converter campo "website" do Google para coluna "website" do banco
10. FOR ALL Place_Records válidos do Google, THE Google_Places_Parser SHALL produzir objeto compatível com schema do banco local (round-trip property)

### Requirement 12: Performance da Busca Híbrida

**User Story:** Como usuário do sistema, eu quero que a busca híbrida seja rápida mesmo quando consulta o Google Places, para que eu tenha boa experiência de uso.

#### Acceptance Criteria

1. WHEN apenas busca local é necessária, THE Hybrid_Search_Service SHALL responder em menos de 500ms
2. WHEN busca no Google_Places_API é necessária, THE Hybrid_Search_Service SHALL responder em menos de 3 segundos
3. THE Hybrid_Search_Service SHALL executar cache de resultados em background após enviar response ao cliente
4. THE Hybrid_Search_Service SHALL usar connection pooling para operações no Local_Database
