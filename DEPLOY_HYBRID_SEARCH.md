# 🚀 Deploy - Busca Híbrida (Produção)

## 📋 Pré-requisitos

Antes de começar, certifique-se de que:
- [ ] Todos os testes locais passaram (`npm test` no backend)
- [ ] Você testou localmente com `test-hybrid-search.html`
- [ ] O arquivo `.env` está configurado corretamente
- [ ] Você tem acesso SSH ao servidor de produção

---

## 🔧 PARTE 1: Preparar e Subir para o Git (Local)

Execute estes comandos **na sua máquina local**:

```bash
# 1. Verificar status atual
git status

# 2. Criar nova branch para a feature
git checkout -b feature/hybrid-search

# 3. Adicionar todos os arquivos novos e modificados
git add .

# 4. Verificar o que será commitado
git status

# 5. Fazer commit com mensagem descritiva
git commit -m "feat: implementar busca híbrida (local + Google Places API)

Implementação completa da funcionalidade de busca híbrida que prioriza
o banco de dados local e complementa com Google Places API quando necessário.

Backend:
- Adicionar coluna google_place_id na tabela places
- Criar tabela search_cache para logging de API calls
- Implementar Google Places Service (timeout 5s, limitação de raio)
- Implementar Google Places Parser (conversão de dados)
- Implementar Cache Writer (salvamento automático em background)
- Implementar API Call Logger (monitoramento de custos)
- Implementar Hybrid Search Service (orquestração completa)
- Adicionar rota GET /api/places/hybrid-search

Frontend:
- Adicionar função hybridSearch() no places service
- Atualizar DashboardPage com badges de origem (local/google)
- Adicionar painel de resumo de resultados
- Adicionar avisos de erro da API
- Adicionar indicadores de raio limitado e cache

Configuração:
- Adicionar MIN_RESULTS_THRESHOLD (padrão: 10)
- Adicionar GOOGLE_SEARCH_RADIUS_LIMIT (padrão: 5000m)

Testes:
- 84 testes automatizados (100% passando)
- 18 propriedades de correção validadas
- Todos os 12 requisitos implementados

Performance:
- Busca local: < 500ms
- Busca híbrida: < 3s"

# 6. Subir branch para o repositório remoto
git push origin feature/hybrid-search

# 7. (Opcional) Criar Pull Request no GitHub/GitLab
# Acesse a interface web do seu repositório e crie um PR
```

---

## 🖥️ PARTE 2: Deploy no Servidor de Produção

Conecte-se ao servidor via SSH e execute:

```bash
# 1. Conectar ao servidor
ssh root@76.13.173.70
# ou
ssh seu_usuario@76.13.173.70

# 2. Navegar para o diretório do projeto
cd /root/suphelp-geo
# ou
cd /home/seu_usuario/suphelp-geo

# 3. Verificar branch atual
git branch

# 4. Fazer backup do estado atual (IMPORTANTE!)
git stash
# ou criar uma tag de backup
git tag backup-antes-hybrid-search-$(date +%Y%m%d-%H%M%S)

# 5. Buscar atualizações do repositório
git fetch origin

# 6. Mudar para a nova branch
git checkout feature/hybrid-search

# 7. Puxar as últimas alterações
git pull origin feature/hybrid-search

# 8. Verificar se todos os arquivos foram baixados
ls -la backend/src/services/
# Deve mostrar: googlePlacesParser.js, googlePlacesService.js, 
#               hybridSearchService.js, cacheWriter.js, apiLogger.js

ls -la backend/src/migrations/
# Deve mostrar: 001_hybrid_search_infrastructure.sql, run_migration.js, verify_migration.js
```

---

## 🗄️ PARTE 3: Executar Migration no Banco de Dados

**⚠️ ATENÇÃO: Esta etapa modifica o banco de dados!**

```bash
# 1. Navegar para o diretório backend
cd backend

# 2. Verificar variáveis de ambiente
cat .env | grep -E "DB_|GOOGLE_|MIN_RESULTS|RADIUS"

# Deve mostrar:
# DB_HOST=76.13.173.70
# DB_USER=admin
# DB_PASS=suphelp_secret_pass
# DB_NAME=suphelp_geo
# GOOGLE_PLACES_API_KEY=AIzaSyDq2V4A_RmdQmxfO6jPkGHe0jXdfxDHV_Y
# MIN_RESULTS_THRESHOLD=10
# GOOGLE_SEARCH_RADIUS_LIMIT=5000

# 3. Executar a migration
node src/migrations/run_migration.js

# Você deve ver:
# 🚀 Starting migration process...
# 📍 Database: suphelp_geo at 76.13.173.70
# 🔄 Running migration: 001_hybrid_search_infrastructure.sql
# ✅ Migration completed successfully: 001_hybrid_search_infrastructure.sql
# ✨ All migrations completed successfully!

# 4. Verificar se a migration funcionou
node src/migrations/verify_migration.js

# Você deve ver:
# ✅ Column google_place_id exists in places table
# ✅ Unique index on google_place_id exists
# ✅ Table search_cache exists
# ✅ All required columns exist in search_cache
# ✅ All indexes exist on search_cache
# ✅ Migration verification completed successfully!
```

---

## 📦 PARTE 4: Instalar Dependências e Rebuild

```bash
# 1. Instalar novas dependências do backend (se houver)
cd /root/suphelp-geo/backend
npm install

# 2. Rodar testes (opcional, mas recomendado)
npm test

# Deve mostrar:
# Test Suites: 4 passed, 4 total
# Tests:       84 passed, 84 total

# 3. Navegar para o frontend
cd /root/suphelp-geo/frontend

# 4. Instalar dependências do frontend (se houver)
npm install

# 5. Fazer build do frontend
npm run build

# Aguarde o build completar...
# Deve criar/atualizar a pasta 'dist'
```

---

## 🔄 PARTE 5: Reiniciar Serviços

```bash
# 1. Verificar processos PM2 ativos
pm2 list

# 2. Reiniciar o backend
pm2 restart suphelp-backend

# 3. Verificar logs do backend
pm2 logs suphelp-backend --lines 50

# Procure por:
# - Servidor iniciado na porta 5000
# - Conexão com banco de dados estabelecida
# - Sem erros de módulos não encontrados

# 4. Se houver erros, verificar:
pm2 logs suphelp-backend --err --lines 100

# 5. Copiar build do frontend para o backend/public
cd /root/suphelp-geo
cp -r frontend/dist/* backend/public/

# 6. Reiniciar nginx (se necessário)
sudo systemctl restart nginx

# 7. Verificar status do nginx
sudo systemctl status nginx
```

---

## ✅ PARTE 6: Validação em Produção

### 6.1 Testar a API diretamente

```bash
# Teste 1: Busca em Jundiaí (deve usar apenas dados locais)
curl "http://localhost:5000/api/places/hybrid-search?lat=-23.1858&lng=-46.8978&radius=5000&limit=10"

# Teste 2: Verificar estrutura da resposta
curl -s "http://localhost:5000/api/places/hybrid-search?lat=-23.1858&lng=-46.8978&radius=5000" | jq '.summary'

# Deve retornar algo como:
# {
#   "local": 35,
#   "google": 0,
#   "from_recent_cache": false,
#   "radius_limited": false
# }
```

### 6.2 Verificar logs no banco de dados

```bash
# Conectar ao PostgreSQL
psql -h 76.13.173.70 -U admin -d suphelp_geo

# Verificar se as tabelas foram criadas
\dt

# Deve mostrar:
# places
# search_cache
# users
# ...

# Verificar estrutura da tabela places
\d places

# Deve mostrar a coluna google_place_id

# Verificar estrutura da tabela search_cache
\d search_cache

# Sair do psql
\q
```

### 6.3 Testar no navegador

```bash
# Abrir no navegador:
https://suphelp.com.br

# 1. Fazer login
# 2. Ir para o Dashboard
# 3. Fazer uma busca em Jundiaí
# 4. Verificar se aparecem os badges (💾 Local / 🌐 Google)
# 5. Verificar se aparece o painel "Resumo da Busca"
```

---

## 🔍 PARTE 7: Monitoramento Pós-Deploy

### 7.1 Verificar logs em tempo real

```bash
# Logs do backend
pm2 logs suphelp-backend --lines 100

# Logs do nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 7.2 Verificar chamadas à API do Google

```bash
# Conectar ao banco
psql -h 76.13.173.70 -U admin -d suphelp_geo

# Ver últimas chamadas à API
SELECT 
    id,
    lat,
    lng,
    radius,
    results_count,
    response_time_ms,
    estimated_cost,
    status,
    created_at
FROM search_cache 
ORDER BY created_at DESC 
LIMIT 10;

# Ver lugares cacheados do Google
SELECT 
    id,
    name,
    address,
    google_place_id,
    created_at
FROM places 
WHERE google_place_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

### 7.3 Monitorar custos da API

```bash
# Ver total de chamadas à API hoje
SELECT 
    COUNT(*) as total_calls,
    SUM(estimated_cost) as total_cost,
    AVG(response_time_ms) as avg_response_time
FROM search_cache 
WHERE created_at >= CURRENT_DATE
AND status = 'completed';

# Ver chamadas com erro
SELECT 
    error_message,
    COUNT(*) as count
FROM search_cache 
WHERE status = 'failed'
GROUP BY error_message;
```

---

## 🔙 ROLLBACK (Se necessário)

Se algo der errado, execute:

```bash
# 1. Voltar para a branch principal
cd /root/suphelp-geo
git checkout main

# 2. Puxar última versão estável
git pull origin main

# 3. Reinstalar dependências
cd backend && npm install
cd ../frontend && npm install && npm run build

# 4. Copiar build do frontend
cd /root/suphelp-geo
cp -r frontend/dist/* backend/public/

# 5. Reiniciar serviços
pm2 restart suphelp-backend
sudo systemctl restart nginx

# 6. Reverter migration do banco (CUIDADO!)
psql -h 76.13.173.70 -U admin -d suphelp_geo

-- Remover coluna google_place_id
ALTER TABLE places DROP COLUMN IF EXISTS google_place_id;

-- Remover tabela search_cache
DROP TABLE IF EXISTS search_cache;

\q
```

---

## 📊 Checklist Final

Após o deploy, verifique:

- [ ] Backend iniciou sem erros (`pm2 logs suphelp-backend`)
- [ ] Frontend carrega corretamente (https://suphelp.com.br)
- [ ] Migration executada com sucesso (tabelas criadas)
- [ ] API `/api/places/hybrid-search` responde corretamente
- [ ] Badges de origem aparecem nos resultados
- [ ] Painel de resumo aparece no dashboard
- [ ] Logs são salvos na tabela `search_cache`
- [ ] Resultados do Google são cacheados com `google_place_id`
- [ ] Não há erros no console do navegador
- [ ] Performance está aceitável (< 3s para buscas híbridas)

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'googlePlacesService'"

```bash
cd /root/suphelp-geo/backend
ls -la src/services/
# Verificar se os arquivos existem

# Se não existirem, puxar novamente
git pull origin feature/hybrid-search
```

### Erro: "Column google_place_id does not exist"

```bash
# Executar migration novamente
cd /root/suphelp-geo/backend
node src/migrations/run_migration.js
```

### Erro: "GOOGLE_PLACES_API_KEY is not defined"

```bash
# Verificar .env
cat /root/suphelp-geo/backend/.env | grep GOOGLE_PLACES_API_KEY

# Se não existir, adicionar:
echo "GOOGLE_PLACES_API_KEY=AIzaSyDq2V4A_RmdQmxfO6jPkGHe0jXdfxDHV_Y" >> /root/suphelp-geo/backend/.env
echo "MIN_RESULTS_THRESHOLD=10" >> /root/suphelp-geo/backend/.env
echo "GOOGLE_SEARCH_RADIUS_LIMIT=5000" >> /root/suphelp-geo/backend/.env

# Reiniciar backend
pm2 restart suphelp-backend
```

### Frontend não mostra badges

```bash
# Verificar se o build foi feito
ls -la /root/suphelp-geo/frontend/dist/

# Refazer build
cd /root/suphelp-geo/frontend
npm run build

# Copiar para backend/public
cd /root/suphelp-geo
cp -r frontend/dist/* backend/public/

# Limpar cache do navegador (Ctrl+Shift+R)
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `pm2 logs suphelp-backend`
2. Verificar banco: `psql -h 76.13.173.70 -U admin -d suphelp_geo`
3. Verificar nginx: `sudo systemctl status nginx`
4. Consultar documentação: `.kiro/specs/hybrid-search/VALIDATION_SUMMARY.md`

---

**Data de Deploy**: ___/___/______
**Responsável**: _________________
**Status**: [ ] Sucesso [ ] Rollback [ ] Pendente
