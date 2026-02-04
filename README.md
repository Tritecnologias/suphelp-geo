# SupHelp Geo - Sistema de Geolocalização

Sistema híbrido Node.js + Python com PostgreSQL/PostGIS para gerenciamento de dados geoespaciais.

## 🏗️ Arquitetura

- **Backend**: Node.js + Express (API REST)
- **Workers**: Python 3 (Processamento de dados)
- **Banco**: PostgreSQL + PostGIS (76.13.173.70)
- **Deploy**: VPS com Nginx + PM2

## 📋 Pré-requisitos

- Node.js 20+
- Python 3.8+
- npm
- pip

## 🚀 Instalação

### 1. Instalar dependências Node.js
```bash
npm install
```

### 2. Instalar dependências Python
```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais (ou use as fornecidas)
# O .env já está configurado com:
# - PostgreSQL remoto (76.13.173.70)
# - Google Places API Key
# - JWT Secret
# - PORT=5000
```

### 4. Testar conexão com o banco
```bash
npm run test-connection
```

### 5. Criar estrutura do banco (primeira vez)
```bash
npm run setup-db
```

## 🎯 Comandos Disponíveis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start

# Testar conexão com banco
npm run test-connection

# Criar/atualizar tabelas
npm run setup-db
```

## 🔑 Variáveis de Ambiente

Veja `CONFIGURACAO_ENV.md` para detalhes completos.

**Principais variáveis:**
- `DB_HOST`: 76.13.173.70 (PostgreSQL remoto)
- `PORT`: 5000 (API)
- `GOOGLE_PLACES_API_KEY`: Chave do Google Places
- `JWT_SECRET`: Chave de autenticação
- `FRONTEND_URL`: suphelp.com.br

## 📡 Endpoints da API

### Health Check
```
GET /
```

### Importar dados de teste (Python)
```
POST /api/import-test
```

### Importar CSV
```
POST /api/import-csv
```

### Listar lugares
```
GET /api/places
```

## 🗄️ Estrutura do Banco

### Tabela: users
- id (SERIAL)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- role (VARCHAR)
- created_at (TIMESTAMP)

### Tabela: places
- id (SERIAL)
- name (VARCHAR)
- address (TEXT)
- google_place_id (VARCHAR UNIQUE)
- category (VARCHAR)
- location (GEOMETRY Point, SRID 4326)
- created_at (TIMESTAMP)

## 🐍 Workers Python

### worker.py
Insere dados de teste no banco (Marco Zero - Praça da Sé).

### worker_csv.py
Processa importação em lote via CSV usando Pandas.

**Uso:**
```bash
python3 src/worker.py
python3 src/worker_csv.py import.csv
```

## 📦 Deploy na VPS

### Estrutura
```
/var/www/suphelp-geo-online/
├── backend/          (este projeto)
├── frontend/         (React - Fase 2)
└── .env
```

### Atualizar código
```bash
cd /var/www/suphelp-geo-online/backend
git pull
npm install
pm2 restart suphelp-backend
```

### Logs
```bash
pm2 logs suphelp-backend
```

## 🔐 Segurança

- Credenciais no `.env` (nunca commitar)
- JWT para autenticação (JWT_SECRET configurado)
- Conexão PostgreSQL com senha forte
- Google API Key com restrições recomendadas

## 📊 Google APIs Utilizadas

- **Places API (New):** Busca de estabelecimentos
- **Distance Matrix API:** Cálculo de distâncias
- **Place Details API:** Enriquecimento de dados (telefone, etc.)

**Custo estimado:** ~$0.02 por busca completa (dentro do crédito gratuito de $200/mês)

## 📝 Roadmap

### ✅ Fase 1 - Backend + Banco (R$ 1.275,00)
- [x] Configuração PostgreSQL remoto
- [x] Workers Python (teste e CSV)
- [ ] Autenticação JWT
- [ ] Worker Google Places API
- [ ] API REST completa com filtros geoespaciais

### 🔄 Fase 2 - Frontend (R$ 1.275,00)
- [ ] Interface React
- [ ] CRUD de lugares
- [ ] Importação CSV com preview
- [ ] Busca por raio/filtros
- [ ] Visualização em mapa
- [ ] Deploy Nginx

## 🤝 Contato

Projeto desenvolvido para Diego - SupHelp Geo
