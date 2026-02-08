# 🗺️ SupHelp Geo - Sistema de Geolocalização

## 📋 Resumo Executivo

O **SupHelp Geo** é um sistema completo de geolocalização que permite buscar estabelecimentos comerciais (farmácias, padarias, mercados, etc.) próximos a um endereço específico, com funcionalidades de visualização e exportação de dados.

---

## 🎯 Objetivo Principal

Facilitar a busca de estabelecimentos comerciais em um raio específico a partir de um endereço, permitindo que o usuário:
- Digite um endereço qualquer (não precisa saber coordenadas)
- Defina um raio de busca em metros
- Visualize todos os lugares encontrados em uma tabela organizada
- Exporte os resultados para Excel ou PDF

---

## 🚀 Funcionalidades Principais

### 1. **Busca por Endereço com Geocoding Automático**
- O usuário digita um endereço (ex: "Jundiaí, SP" ou "Rua XV de Novembro, 123")
- O sistema converte automaticamente em coordenadas geográficas
- Exibe o endereço formatado e as coordenadas encontradas

### 2. **Busca por Raio Geográfico**
- Define um raio de busca em metros (ex: 5000m = 5km)
- Utiliza cálculos geoespaciais precisos (PostGIS)
- Ordena resultados por distância (mais próximo primeiro)

### 3. **Visualização em Tabela**
- Mostra todos os lugares encontrados de forma organizada
- Exibe informações completas:
  - Nome do estabelecimento
  - Endereço completo
  - Categoria (farmácia, padaria, mercado, etc.)
  - Telefone de contato
  - Distância em km
  - Avaliação (rating)
- Design limpo e profissional

### 4. **Exportação de Dados**

#### 📊 Excel (CSV)
- Exporta todos os dados em formato CSV
- Compatível com Excel, Google Sheets, LibreOffice
- Inclui latitude e longitude para análises
- Codificação UTF-8 correta (acentos preservados)

#### 📄 PDF
- Gera relatório formatado para impressão
- Inclui cabeçalho com informações da busca
- Data e hora de geração
- Pronto para apresentações e documentação

---

## 🏗️ Arquitetura do Sistema

### Backend (Node.js + Express)
- **API REST** com múltiplos endpoints
- **Banco de dados PostgreSQL** com extensão PostGIS para geolocalização
- **Workers Python** para importação e enriquecimento de dados
- **Integração com Google Maps API** para geocoding e Places

### Frontend (HTML + JavaScript)
- Interface web responsiva e intuitiva
- Design moderno com gradientes e animações
- Feedback visual em tempo real
- Exportação client-side (sem necessidade de backend)

### Banco de Dados
- **PostgreSQL 14+** com extensão **PostGIS**
- Armazena lugares com coordenadas geográficas
- Índices espaciais para buscas rápidas
- Suporta milhares de registros

---

## 📊 Dados Armazenados

Cada lugar no banco contém:
- **ID único**
- **Nome do estabelecimento**
- **Endereço completo**
- **Categoria** (farmácia, padaria, mercado, condomínio, etc.)
- **Coordenadas geográficas** (latitude, longitude)
- **Telefone** (quando disponível)
- **Website** (quando disponível)
- **Rating** (avaliação de 0 a 5 estrelas)
- **Total de avaliações**
- **Google Place ID** (para referência)

---

## 🔧 Funcionalidades Técnicas

### API Endpoints Disponíveis

1. **GET /** - Health check
2. **POST /api/import-csv** - Importa lugares de arquivo CSV
3. **POST /api/import-places-api** - Importa via Google Places API
4. **POST /api/enrich-contacts** - Enriquece dados com telefone/website
5. **GET /api/geocode** - Converte endereço em coordenadas
6. **GET /api/places/nearby** - Busca por raio geográfico
7. **GET /api/places/search** - Busca avançada com filtros
8. **GET /api/places** - Lista todos os lugares
9. **GET /api/places/:id** - Busca lugar por ID
10. **POST /api/places** - Cria novo lugar
11. **PUT /api/places/:id** - Atualiza lugar
12. **DELETE /api/places/:id** - Remove lugar

### Workers Python

1. **worker_csv.py** - Importa dados de CSV
2. **worker_places_api.py** - Busca lugares no Google Places
3. **worker_enrich_contacts.py** - Enriquece com telefone e website

---

## 💼 Casos de Uso

### 1. **Prospecção Comercial**
- Encontrar farmácias em um bairro específico
- Listar padarias próximas a um condomínio
- Mapear concorrentes em uma região

### 2. **Análise de Mercado**
- Identificar áreas com poucos estabelecimentos
- Avaliar densidade comercial por região
- Exportar dados para análise em Excel

### 3. **Planejamento Logístico**
- Encontrar pontos de distribuição próximos
- Mapear rotas de entrega
- Identificar áreas de cobertura

### 4. **Pesquisa e Relatórios**
- Gerar relatórios de estabelecimentos por região
- Criar apresentações com dados geográficos
- Documentar análises de mercado

---

## 🌟 Diferenciais

✅ **Interface Intuitiva** - Não precisa saber coordenadas, apenas o endereço
✅ **Busca Precisa** - Usa cálculos geoespaciais reais (não aproximações)
✅ **Exportação Fácil** - Excel e PDF com um clique
✅ **Dados Enriquecidos** - Telefone, website, avaliações
✅ **Escalável** - Suporta milhares de lugares
✅ **API Completa** - Pode ser integrada com outros sistemas
✅ **Open Source** - Código disponível no GitHub

---

## 📈 Estatísticas do Sistema

O painel mostra em tempo real:
- **Total de lugares** cadastrados
- **Lugares com telefone** (enriquecidos)
- **Lugares com rating** (avaliados)

---

## 🔐 Segurança e Configuração

- Variáveis de ambiente para credenciais sensíveis
- Conexão segura com banco de dados PostgreSQL
- API Key do Google Maps protegida
- Validação de dados em todas as requisições

---

## 🚀 Deploy

Sistema rodando em:
- **Servidor:** 76.13.173.70
- **Porta:** 5000
- **Acesso:** http://76.13.173.70/

---

## 📚 Documentação Disponível

- `API_DOCUMENTATION.md` - Documentação completa da API
- `GUIA_DEPLOY.md` - Guia de deploy e configuração
- `GUIA_DEPLOY_RAPIDO.md` - Deploy rápido no servidor Linux
- `GUIA_TESTE_DIEGO.md` - Guia de testes
- `CONFIGURACAO_ENV.md` - Configuração de variáveis de ambiente

---

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js 18+
- Express.js
- PostgreSQL 14+ com PostGIS
- Python 3.x

### Frontend
- HTML5
- CSS3 (com gradientes e animações)
- JavaScript ES6+
- Fetch API

### APIs Externas
- Google Geocoding API
- Google Places API

### Ferramentas
- Git/GitHub
- Docker (opcional)
- PM2 (opcional para produção)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação em `/docs`
2. Verifique os logs do servidor: `tail -f server.log`
3. Execute os scripts de teste em `/test_*.ps1`

---

## 🎯 Roadmap Futuro

Possíveis melhorias:
- [ ] Mapa interativo com marcadores
- [ ] Filtros avançados (horário de funcionamento, etc.)
- [ ] Autenticação de usuários
- [ ] Histórico de buscas
- [ ] API de rotas (calcular distância real por ruas)
- [ ] Integração com WhatsApp para envio de relatórios
- [ ] Dashboard com gráficos e estatísticas

---

**Desenvolvido para SupHelp** 🚀
