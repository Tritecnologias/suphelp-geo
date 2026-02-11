# 🧪 TESTE COMPLETO DAS 16 APIs

Você está certo! Vou verificar se TODAS as 16 APIs estão realmente funcionando. Execute estes comandos no servidor:

## 📋 **AUTENTICAÇÃO (4 endpoints)**

### 1. POST /api/auth/login - Login unificado
```bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@suphelp.com.br","senha":"password"}'
```

### 2. POST /api/auth/register - Registro de usuários
```bash
curl -X POST http://localhost:5000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"nome":"Teste User","email":"novo@teste.com","senha":"123456","plano":"basico"}'
```

### 3. GET /api/auth/profile - Perfil do usuário
```bash
# Primeiro faça login para pegar o token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"teste@suphelp.com.br","senha":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/profile
```

### 4. PUT /api/admin/change-password - Alterar senha admin
```bash
# Login admin para pegar token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@suphelp.com.br","senha":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -X PUT http://localhost:5000/api/admin/change-password \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-H "Content-Type: application/json" \
-d '{"senhaAtual":"password","novaSenha":"password123"}'
```

## 🗺️ **LUGARES (8 endpoints)**

### 5. GET /api/places - Listar com paginação
```bash
curl "http://localhost:5000/api/places?limit=10&offset=0"
```

### 6. GET /api/places/:id - Buscar por ID
```bash
curl "http://localhost:5000/api/places/1"
```

### 7. POST /api/places - Criar lugar
```bash
curl -X POST http://localhost:5000/api/places \
-H "Content-Type: application/json" \
-d '{"name":"Teste Local","address":"Rua Teste, 123","category":"Restaurante","lat":-23.5505,"lng":-46.6333}'
```

### 8. PUT /api/places/:id - Atualizar lugar
```bash
curl -X PUT http://localhost:5000/api/places/1 \
-H "Content-Type: application/json" \
-d '{"name":"Local Atualizado","phone":"11999999999"}'
```

### 9. DELETE /api/places/:id - Deletar lugar
```bash
curl -X DELETE http://localhost:5000/api/places/999
```

### 10. GET /api/places/nearby - Busca por raio
```bash
curl "http://localhost:5000/api/places/nearby?lat=-23.5505&lng=-46.6333&radius=5000&limit=10"
```

### 11. GET /api/places/search - Busca avançada
```bash
curl "http://localhost:5000/api/places/search?q=restaurante&category=food&city=São Paulo&minRating=4&hasPhone=true"
```

### 12. GET /api/geocode - Geocoding
```bash
curl "http://localhost:5000/api/geocode?address=Rua Augusta, São Paulo"
```

## 🤖 **IMPORTAÇÃO (4 endpoints)**

### 13. POST /api/import-places-api - Google Places API
```bash
curl -X POST http://localhost:5000/api/import-places-api \
-H "Content-Type: application/json" \
-d '{"city":"São Paulo","keywords":"restaurante,padaria","maxResults":10}'
```

### 14. POST /api/enrich-contacts - Enriquecer dados
```bash
curl -X POST http://localhost:5000/api/enrich-contacts \
-H "Content-Type: application/json" \
-d '{"placeIds":"all","limit":5}'
```

### 15. POST /api/import-csv - Importar CSV
```bash
curl -X POST http://localhost:5000/api/import-csv \
-H "Content-Type: application/json" \
-d '{}'
```

### 16. POST /api/import-test - Dados de teste
```bash
curl -X POST http://localhost:5000/api/import-test
```

## 🎨 **BONUS: CMS (3 endpoints extras)**

### 17. GET /api/cms/config - Obter configurações
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:5000/api/cms/config"
```

### 18. PUT /api/cms/config - Atualizar configuração
```bash
curl -X PUT http://localhost:5000/api/cms/config \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-H "Content-Type: application/json" \
-d '{"section":"header","key":"title","value":"SupHelp Geo","type":"text"}'
```

### 19. PUT /api/cms/config/bulk - Atualizar múltiplas
```bash
curl -X PUT http://localhost:5000/api/cms/config/bulk \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-H "Content-Type: application/json" \
-d '{"configs":[{"section":"hero","key":"title","value":"Encontre Lugares"},{"section":"hero","key":"subtitle","value":"Sistema completo"}]}'
```

---

## ✅ **VERIFICAÇÕES NECESSÁRIAS:**

1. **Tabelas do banco existem?**
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\dt"
```

2. **Tabela places existe?**
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\d places"
```

3. **Tabela admins existe?**
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\d admins"
```

4. **Tabela site_config existe?**
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\d site_config"
```

---

## 🎯 **EXECUTE TODOS OS TESTES E ME DIGA:**

1. Quantas APIs retornaram sucesso?
2. Quais falharam e com que erro?
3. Quais tabelas estão faltando no banco?

**Só assim posso garantir que TODAS as 16 APIs estão funcionando!**