# Configuração do Ambiente (.env)

## 📋 Variáveis Configuradas

### Banco de Dados PostgreSQL
```env
DB_HOST=76.13.173.70
DB_USER=admin
DB_PASS=***REMOVED***
DB_NAME=suphelp_geo
DB_PORT=5432
DATABASE_URL=postgresql://admin:***REMOVED***@76.13.173.70:5432/suphelp_geo
```

### Aplicação
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=suphelp.com.br
```

### Autenticação
```env
JWT_SECRET=***REMOVED***
```

### Google APIs
```env
GOOGLE_PLACES_API_KEY=***REMOVED***
GOOGLE_MAPS_API_KEY=***REMOVED***
```

## 🔐 Segurança

⚠️ **IMPORTANTE:** 
- O arquivo `.env` está no `.gitignore` e NÃO deve ser commitado
- Use `.env.example` como template (sem valores reais)
- Mantenha as chaves de API seguras

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
# Na VPS, crie o .env em /var/www/suphelp-geo-online/backend/
nano /var/www/suphelp-geo-online/backend/.env

# Cole as variáveis de ambiente
# Reinicie o PM2
pm2 restart suphelp-backend
```

## 📝 Notas

### Mudanças em relação ao setup anterior:
1. ✅ Removidas variáveis do Supabase (não usado)
2. ✅ PORT alterada de 4000 para 5000 (padrão do Diego)
3. ✅ Adicionado NODE_ENV=production
4. ✅ Adicionado FRONTEND_URL=suphelp.com.br
5. ✅ JWT_SECRET atualizado com valor do Diego
6. ✅ Google API Keys configuradas

### Google Places API
- A mesma chave serve para Places API e Maps API
- Certifique-se de que as seguintes APIs estão habilitadas no Google Cloud Console:
  - Places API (New)
  - Distance Matrix API
  - Geocoding API

### Limites da API Google
- **Places API:** $0.017 por requisição (Text Search)
- **Distance Matrix API:** $0.005 por elemento
- **Crédito mensal gratuito:** $200

**Recomendação:** Monitore o uso no Google Cloud Console para evitar custos inesperados.
