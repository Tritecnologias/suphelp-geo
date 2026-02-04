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
