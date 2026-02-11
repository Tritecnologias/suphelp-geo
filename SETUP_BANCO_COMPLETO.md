# 🗄️ CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS

Execute estes comandos no servidor para configurar todas as tabelas necessárias:

## 📋 **1. Executar script de configuração**

```bash
# No servidor (ssh dev@76.13.173.70)
cd ~/suphelp-geo

# Executar script SQL completo
docker exec -i suphelp_db psql -U admin -d suphelp_geo < backend/src/setup_complete_db.sql
```

## 🔍 **2. Verificar se tudo foi criado**

```bash
# Verificar tabelas
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\dt"

# Verificar dados
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'admins' as tabela, COUNT(*) as registros FROM admins
UNION ALL
SELECT 'places' as tabela, COUNT(*) as registros FROM places
UNION ALL
SELECT 'site_config' as tabela, COUNT(*) as registros FROM site_config;
"
```

## 🧪 **3. Testar APIs após configuração**

```bash
# Testar login admin
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@suphelp.com.br","senha":"password"}'

# Testar CMS
ADMIN_TOKEN="SEU_TOKEN_AQUI"
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:5000/api/cms/config"

# Testar criação de lugar
curl -X POST http://localhost:5000/api/places \
-H "Content-Type: application/json" \
-d '{"name":"Teste Local","address":"Rua Teste, 123","category":"Restaurante","lat":-23.5505,"lng":-46.6333}'
```

## ✅ **4. Resultado esperado**

Após executar, você deve ter:
- ✅ Tabela `users` com colunas completas
- ✅ Tabela `admins` para gestão de administradores  
- ✅ Tabela `places` com PostGIS para geolocalização
- ✅ Tabela `site_config` para CMS
- ✅ Admin padrão: admin@suphelp.com.br / password
- ✅ Configurações padrão do CMS
- ✅ Índices para performance

**Execute este setup primeiro, depois vou implementar todas as funcionalidades no React!**