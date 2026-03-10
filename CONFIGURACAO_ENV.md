# Configuração do Ambiente (.env)

## 📋 Variáveis Configuradas

### Banco de Dados PostgreSQL
```env
DB_HOST=seu_host_aqui
DB_USER=seu_usuario_aqui
DB_PASS=sua_senha_aqui
DB_NAME=nome_do_banco
DB_PORT=5432
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

### Aplicação
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=seu_dominio.com.br
```

### Autenticação
```env
JWT_SECRET=sua_chave_jwt_secreta_aqui
```

### Google APIs
```env
GOOGLE_PLACES_API_KEY=sua_chave_google_places_aqui
GOOGLE_MAPS_API_KEY=sua_chave_google_maps_aqui
```

### Busca Híbrida (Local + Google Places)
```env
# Número mínimo de resultados locais antes de acionar Google Places API
MIN_RESULTS_THRESHOLD=10

# Raio máximo (em metros) para buscas no Google Places API
GOOGLE_SEARCH_RADIUS_LIMIT=5000
```

**Descrição das variáveis:**
- `MIN_RESULTS_THRESHOLD`: Define quantos resultados locais são necessários antes de buscar no Google Places. Valor padrão: 10. Use 0 para sempre buscar no Google (modo sempre híbrido).
- `GOOGLE_SEARCH_RADIUS_LIMIT`: Limita o raio máximo de busca no Google Places para controlar custos. Valor padrão: 5000 metros (5 km).

## 🔐 Segurança

⚠️ **IMPORTANTE:** 
- O arquivo `.env` está no `.gitignore` e NÃO deve ser commitado
- Use `.env.example` como template (sem valores reais)
- Mantenha as chaves de API seguras
- **NUNCA** commite credenciais reais no Git

## 🚀 Uso

### Desenvolvimento Local
```bash
# Copie o .env.example
cp .env.example .env

# Edite com suas credenciais
nano .env
```

### Produção (VPS)
```bash
# Na VPS, crie o .env no diretório do projeto
nano .env

# Cole as variáveis de ambiente
# Reinicie o PM2
pm2 restart suphelp-backend
```

## 📝 Notas

### Configurações Importantes:
1. ✅ PORT padrão: 5000
2. ✅ NODE_ENV: production (em produção)
3. ✅ Todas as credenciais devem estar no `.env` (não commitado)
4. ✅ Use `.env.example` como referência

### Google Places API
- A mesma chave serve para Places API e Maps API
- Certifique-se de que as seguintes APIs estão habilitadas no Google Cloud Console:
  - Places API (New)
  - Distance Matrix API
  - Geocoding API

### Busca Híbrida
A funcionalidade de busca híbrida prioriza o banco de dados local (grátis) e complementa com Google Places API (pago) apenas quando necessário:

1. **MIN_RESULTS_THRESHOLD**: Controla quando acionar o Google Places
   - Valor padrão: 10 resultados
   - Se a busca local retornar menos resultados que o threshold, o sistema busca no Google
   - Use 0 para sempre buscar no Google (modo sempre híbrido)
   - Use valores maiores (ex: 20) para economizar mais na API

2. **GOOGLE_SEARCH_RADIUS_LIMIT**: Limita o raio de busca no Google
   - Valor padrão: 5000 metros (5 km)
   - Buscas com raio maior que o limite usarão o limite configurado
   - Ajuda a controlar custos evitando buscas muito amplas
   - Recomendado: manter entre 3000-10000 metros

**Estratégia de Cache:**
- Resultados do Google são salvos automaticamente no banco local
- Futuras buscas na mesma região usam dados locais (sem custo)
- Sistema evita chamadas duplicadas em 24 horas para a mesma região

### Limites da API Google
- **Places API:** $0.017 por requisição (Text Search)
- **Distance Matrix API:** $0.005 por elemento
- **Crédito mensal gratuito:** $200

**Recomendação:** Monitore o uso no Google Cloud Console para evitar custos inesperados.

## 🔒 Boas Práticas de Segurança

1. **Nunca** commite o arquivo `.env`
2. Use `.env.example` com placeholders
3. Troque credenciais regularmente
4. Use senhas fortes e únicas
5. Limite permissões de API keys
6. Monitore logs de acesso
