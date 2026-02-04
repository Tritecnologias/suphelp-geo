# API Documentation - SupHelp Geo

## 🌐 Base URL
```
http://localhost:5000
```

## 📡 Endpoints

### 1. Health Check
Verifica se a API está funcionando.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "SupHelp Geo API - Sistema Operacional 🚀"
}
```

---

### 2. Listar Lugares
Retorna os últimos 50 lugares cadastrados.

**Endpoint:** `GET /api/places`

**Response:**
```json
[
  {
    "id": 24,
    "name": "Mercadão Vila Arens",
    "category": "padaria, mercado",
    "address": "R. Prof. João Luiz de Campos, 210 - Jardim Sao Bento, Jundiaí - SP",
    "geojson": "{\"type\":\"Point\",\"coordinates\":[-46.880739899999995,-23.1975119]}"
  }
]
```

---

### 3. Importar Teste (Python Worker)
Insere dados de teste no banco (Marco Zero - Praça da Sé).

**Endpoint:** `POST /api/import-test`

**Response:**
```json
{
  "success": true,
  "message": "Teste de importação concluído."
}
```

---

### 4. Importar CSV
Importa lugares de um arquivo CSV.

**Endpoint:** `POST /api/import-csv`

**Request Body:**
```json
{
  "fileName": "import.csv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Importação de CSV finalizada com sucesso."
}
```

---

### 5. Importar via Google Places API ⭐ NOVO
Busca lugares via Google Places API e salva no banco.

**Endpoint:** `POST /api/import-places-api`

**Request Body:**
```json
{
  "city": "Jundiaí, SP",
  "keywords": ["farmácia", "mercado", "condomínio"],
  "maxResults": 50
}
```

**Parâmetros:**
- `city` (string, obrigatório): Cidade para buscar
- `keywords` (array ou string, obrigatório): Palavras-chave para busca
- `maxResults` (number, opcional): Máximo de resultados por keyword (padrão: 50)

**Response:**
```json
{
  "success": true,
  "message": "Importação via Places API concluída",
  "stats": {
    "success": 20,
    "duplicates": 0,
    "errors": 0,
    "api_calls": 2
  }
}
```

**Estatísticas:**
- `success`: Novos lugares inseridos
- `duplicates`: Lugares atualizados (já existiam)
- `errors`: Erros durante a importação
- `api_calls`: Número de chamadas à API do Google

---

## 🔐 Autenticação

⚠️ **Em desenvolvimento:** Autenticação JWT será implementada em breve.

---

## 🧪 Exemplos de Uso

### cURL

#### Health Check
```bash
curl http://localhost:5000/
```

#### Listar Lugares
```bash
curl http://localhost:5000/api/places
```

#### Importar via Places API
```bash
curl -X POST http://localhost:5000/api/import-places-api \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Jundiaí, SP",
    "keywords": ["farmácia", "mercado"],
    "maxResults": 20
  }'
```

### PowerShell

#### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get
```

#### Listar Lugares
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/places" -Method Get
```

#### Importar via Places API
```powershell
$body = @{
    city = "Jundiaí, SP"
    keywords = @("farmácia", "mercado")
    maxResults = 20
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/import-places-api" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### JavaScript (Fetch)

```javascript
// Importar via Places API
const response = await fetch('http://localhost:5000/api/import-places-api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    city: 'Jundiaí, SP',
    keywords: ['farmácia', 'mercado'],
    maxResults: 20
  })
});

const data = await response.json();
console.log(data);
```

---

## 📊 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida (parâmetros faltando) |
| 500 | Erro interno do servidor |

---

## 🗺️ Formato GeoJSON

Os lugares são armazenados com geometria PostGIS e retornados em formato GeoJSON:

```json
{
  "type": "Point",
  "coordinates": [-46.880739899999995, -23.1975119]
}
```

**Formato:** `[longitude, latitude]`

---

## 💡 Dicas

### Keywords Recomendadas
- **Condomínios:** "condomínio residencial", "condomínio clube", "residencial fechado"
- **Comércio:** "mercado", "supermercado", "atacado", "padaria", "farmácia"
- **Serviços:** "hospital", "clínica", "escola", "academia"

### Limites da API Google
- **Places API:** $0.017 por requisição (Text Search)
- **Crédito mensal gratuito:** $200 (~11.700 requisições)
- **Recomendação:** Use `maxResults` baixo para testes

### Performance
- Cada keyword gera 1 chamada à API
- Use keywords específicas para melhores resultados
- O worker remove duplicatas automaticamente

---

## 🐛 Troubleshooting

### Erro: "GOOGLE_PLACES_API_KEY não encontrada"
**Solução:** Configure a chave no arquivo `.env`:
```env
GOOGLE_PLACES_API_KEY=sua_chave_aqui
```

### Erro: "Erro ao conectar no banco"
**Solução:** Verifique se o PostgreSQL está rodando e as credenciais estão corretas no `.env`.

### Erro: "HTTP 429 - Too Many Requests"
**Solução:** Aguarde alguns segundos. O worker tem retry automático com backoff exponencial.

---

## 📝 Changelog

### v1.1.0 (2026-02-04)
- ✅ Adicionado endpoint `/api/import-places-api`
- ✅ Worker Google Places API implementado
- ✅ Suporte a múltiplas keywords
- ✅ Remoção automática de duplicatas
- ✅ Estatísticas de importação

### v1.0.0 (2026-02-03)
- ✅ Endpoints básicos (health, places, import-test, import-csv)
- ✅ Integração com PostgreSQL + PostGIS
- ✅ Workers Python

---

## 🚀 Próximas Funcionalidades

- [ ] Autenticação JWT
- [ ] Busca por raio (nearby)
- [ ] Filtros avançados (categoria, cidade, rating)
- [ ] Enriquecimento de dados (telefone, email)
- [ ] Paginação
- [ ] Documentação Swagger/OpenAPI


---

### 6. Enriquecer Lugares com Telefone/Contatos ⭐ NOVO
Enriquece lugares existentes com telefone, website e rating via Google Place Details API.

**Endpoint:** `POST /api/enrich-contacts`

**Request Body:**
```json
{
  "placeIds": "all",
  "limit": 50
}
```

**Ou com place_ids específicos:**
```json
{
  "placeIds": ["ChIJ...", "ChIJ..."],
  "limit": 10
}
```

**Parâmetros:**
- `placeIds` (string ou array, opcional): 
  - `"all"` para enriquecer todos os lugares
  - Array de place_ids específicos
  - Padrão: "all"
- `limit` (number, opcional): Máximo de lugares a enriquecer (padrão: 50)

**Response:**
```json
{
  "success": true,
  "message": "Enriquecimento concluído",
  "stats": {
    "total": 5,
    "enriched": 5,
    "not_found": 0,
    "errors": 0,
    "api_calls": 5
  }
}
```

**Estatísticas:**
- `total`: Total de lugares processados
- `enriched`: Lugares enriquecidos com sucesso
- `not_found`: Lugares não encontrados na API
- `errors`: Erros durante o enriquecimento
- `api_calls`: Número de chamadas à API do Google

**Dados Enriquecidos:**
- `phone`: Telefone formatado
- `website`: Website oficial
- `rating`: Avaliação (0-5)
- `user_ratings_total`: Total de avaliações

**Exemplo cURL:**
```bash
curl -X POST http://localhost:5000/api/enrich-contacts \
  -H "Content-Type: application/json" \
  -d '{"placeIds": "all", "limit": 10}'
```

**Exemplo PowerShell:**
```powershell
$body = @{
    placeIds = "all"
    limit = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/enrich-contacts" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 📝 Changelog

### v1.2.0 (2026-02-04) - Dia 2
- ✅ Adicionado endpoint `/api/enrich-contacts`
- ✅ Worker de Enriquecimento implementado
- ✅ Suporte a Google Place Details API (New)
- ✅ Enriquecimento com telefone, website, rating
- ✅ Criação automática de colunas no banco
- ✅ Estatísticas detalhadas de enriquecimento

### v1.1.0 (2026-02-04) - Dia 1
- ✅ Adicionado endpoint `/api/import-places-api`
- ✅ Worker Google Places API implementado
- ✅ Suporte a múltiplas keywords
- ✅ Remoção automática de duplicatas
- ✅ Estatísticas de importação


---

## 🆕 CRUD Completo + Filtros Geoespaciais (Dia 3)

### 7. Buscar Lugar por ID
Retorna detalhes completos de um lugar específico.

**Endpoint:** `GET /api/places/:id`

**Response:**
```json
{
  "id": 1,
  "name": "Padaria do Bairro",
  "category": "Padaria",
  "address": "Rua Teste, 123 - Centro, Jundiaí - SP",
  "google_place_id": "ChIJ...",
  "phone": "(11) 99999-9999",
  "website": "https://example.com",
  "rating": 4.5,
  "user_ratings_total": 100,
  "geojson": "{\"type\":\"Point\",\"coordinates\":[-46.8917,-23.1865]}",
  "lng": -46.8917,
  "lat": -23.1865,
  "created_at": "2026-02-04T10:00:00.000Z"
}
```

---

### 8. Criar Novo Lugar
Cria um novo lugar no banco de dados.

**Endpoint:** `POST /api/places`

**Request Body:**
```json
{
  "name": "Padaria do Bairro",
  "address": "Rua Teste, 123 - Centro, Jundiaí - SP",
  "category": "Padaria",
  "lat": -23.1865,
  "lng": -46.8917,
  "phone": "(11) 99999-9999",
  "website": "https://example.com",
  "rating": 4.5
}
```

**Campos Obrigatórios:**
- `name` (string): Nome do lugar
- `lat` (number): Latitude (-90 a 90)
- `lng` (number): Longitude (-180 a 180)

**Campos Opcionais:**
- `address` (string): Endereço completo
- `category` (string): Categoria (padrão: "Sem categoria")
- `phone` (string): Telefone
- `website` (string): Website
- `rating` (number): Avaliação (0-5)

**Response:**
```json
{
  "success": true,
  "message": "Lugar criado com sucesso",
  "data": {
    "id": 30,
    "name": "Padaria do Bairro",
    ...
  }
}
```

---

### 9. Atualizar Lugar
Atualiza um ou mais campos de um lugar existente.

**Endpoint:** `PUT /api/places/:id`

**Request Body:**
```json
{
  "name": "Padaria Atualizada",
  "rating": 4.8,
  "phone": "(11) 98888-8888"
}
```

**Campos Atualizáveis:**
- `name`, `address`, `category`, `phone`, `website`, `rating`, `lat`, `lng`

**Nota:** Envie apenas os campos que deseja atualizar.

**Response:**
```json
{
  "success": true,
  "message": "Lugar atualizado com sucesso",
  "data": {
    "id": 30,
    "name": "Padaria Atualizada",
    ...
  }
}
```

---

### 10. Deletar Lugar
Remove um lugar do banco de dados.

**Endpoint:** `DELETE /api/places/:id`

**Response:**
```json
{
  "success": true,
  "message": "Lugar \"Padaria do Bairro\" deletado com sucesso",
  "data": {
    "id": 30,
    "name": "Padaria do Bairro"
  }
}
```

---

### 11. Listar Lugares (com Paginação)
Lista lugares com suporte a paginação e filtros básicos.

**Endpoint:** `GET /api/places`

**Query Parameters:**
- `limit` (number, opcional): Resultados por página (padrão: 50)
- `offset` (number, opcional): Número de resultados a pular (padrão: 0)
- `category` (string, opcional): Filtrar por categoria
- `city` (string, opcional): Filtrar por cidade

**Exemplo:**
```
GET /api/places?limit=10&offset=0&category=padaria
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 12. Busca por Raio (Nearby) ⭐
Busca lugares dentro de um raio específico usando PostGIS.

**Endpoint:** `GET /api/places/nearby`

**Query Parameters:**
- `lat` (number, obrigatório): Latitude do centro
- `lng` (number, obrigatório): Longitude do centro
- `radius` (number, opcional): Raio em metros (padrão: 5000)
- `limit` (number, opcional): Máximo de resultados (padrão: 50)

**Exemplo:**
```
GET /api/places/nearby?lat=-23.1865&lng=-46.8917&radius=5000&limit=10
```

**Response:**
```json
{
  "center": { "lat": -23.1865, "lng": -46.8917 },
  "radius_meters": 5000,
  "total": 5,
  "data": [
    {
      "id": 1,
      "name": "Padaria do Bairro",
      "distance_meters": 150.5,
      "distance_km": "0.15",
      ...
    }
  ]
}
```

**Nota:** Resultados ordenados por distância (mais próximo primeiro).

---

### 13. Busca Avançada (Search) ⭐
Busca lugares com múltiplos filtros combinados.

**Endpoint:** `GET /api/places/search`

**Query Parameters:**
- `q` (string, opcional): Busca por nome ou endereço
- `category` (string, opcional): Filtrar por categoria
- `city` (string, opcional): Filtrar por cidade
- `minRating` (number, opcional): Rating mínimo (0-5)
- `hasPhone` (boolean, opcional): Apenas com telefone (true/false)
- `limit` (number, opcional): Resultados por página (padrão: 50)
- `offset` (number, opcional): Paginação (padrão: 0)

**Exemplo:**
```
GET /api/places/search?category=farmacia&hasPhone=true&minRating=4.0&limit=10
```

**Response:**
```json
{
  "filters": {
    "q": null,
    "category": "farmacia",
    "city": null,
    "minRating": "4.0",
    "hasPhone": "true"
  },
  "data": [...],
  "pagination": {
    "total": 3,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

**Nota:** Resultados ordenados por rating (melhores primeiro).

---

## 📝 Changelog

### v1.3.0 (2026-02-04) - Dia 3 ⭐ FASE 1 CONCLUÍDA
- ✅ Adicionado CRUD completo (GET, POST, PUT, DELETE)
- ✅ Adicionado busca por raio (nearby) com PostGIS
- ✅ Adicionado busca avançada (search) com múltiplos filtros
- ✅ Implementada paginação em todos os endpoints de listagem
- ✅ Validação robusta de coordenadas e dados
- ✅ Cálculo de distância real em metros/km
- ✅ Suporte a filtros combinados (categoria, cidade, rating, telefone)

### v1.2.0 (2026-02-04) - Dia 2
- ✅ Adicionado endpoint `/api/enrich-contacts`
- ✅ Worker de Enriquecimento implementado
- ✅ Suporte a Google Place Details API (New)
- ✅ Enriquecimento com telefone, website, rating
- ✅ Criação automática de colunas no banco
- ✅ Estatísticas detalhadas de enriquecimento

### v1.1.0 (2026-02-04) - Dia 1
- ✅ Adicionado endpoint `/api/import-places-api`
- ✅ Worker Google Places API implementado
- ✅ Suporte a múltiplas keywords
- ✅ Remoção automática de duplicatas
- ✅ Estatísticas de importação

### v1.0.0 (2026-02-03)
- ✅ Endpoints básicos (health, places, import-test, import-csv)
- ✅ Integração com PostgreSQL + PostGIS
- ✅ Workers Python

---

## 🎯 Resumo dos Endpoints

| # | Método | Endpoint | Descrição |
|---|--------|----------|-----------|
| 1 | GET | / | Health check |
| 2 | GET | /api/places | Listar lugares (paginado) |
| 3 | GET | /api/places/:id | Buscar por ID |
| 4 | POST | /api/places | Criar lugar |
| 5 | PUT | /api/places/:id | Atualizar lugar |
| 6 | DELETE | /api/places/:id | Deletar lugar |
| 7 | GET | /api/places/nearby | Busca por raio ⭐ |
| 8 | GET | /api/places/search | Busca avançada ⭐ |
| 9 | POST | /api/import-test | Importar teste |
| 10 | POST | /api/import-csv | Importar CSV |
| 11 | POST | /api/import-places-api | Importar Places API ⭐ |
| 12 | POST | /api/enrich-contacts | Enriquecer contatos ⭐ |

**Total:** 12 endpoints funcionais

---

## ✅ Status da Fase 1

**Progresso:** 95% Concluído

**Funcionalidades Entregues:**
- ✅ CRUD Completo
- ✅ Filtros Geoespaciais (PostGIS)
- ✅ Paginação
- ✅ Importação (CSV + Places API)
- ✅ Enriquecimento (Telefone + Website + Rating)
- ✅ Validações Robustas
- ✅ Documentação Completa

**Pendente:**
- ⏳ Autenticação JWT (Opcional - Fase 2)
- ⏳ Deploy VPS (Próximo passo)
