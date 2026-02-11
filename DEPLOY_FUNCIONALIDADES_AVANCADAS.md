# Deploy das Funcionalidades Avançadas - Servidor Linux

## 🚀 Comandos para Deploy no Servidor

Execute estes comandos no servidor Linux (76.13.173.70):

```bash
# 1. Conectar ao servidor
ssh dev@76.13.173.70

# 2. Navegar para o diretório do projeto
cd ~/suphelp-geo

# 3. Fazer backup do .env
cp backend/.env backend/.env.backup

# 4. Parar processos PM2
pm2 stop suphelp-geo

# 5. Atualizar código do Git
git stash push -m "Deploy backup $(date)"
git pull origin main

# 6. Restaurar .env
cp backend/.env.backup backend/.env

# 7. Instalar dependências do frontend
cd frontend
npm install

# 8. Fazer build do frontend React
npm run build

# 9. Voltar para raiz e copiar build para o backend
cd ..
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/

# 10. Instalar dependências do backend
cd backend
npm install --production

# 11. Reiniciar com PM2
pm2 start src/server.js --name "suphelp-geo" --watch --ignore-watch="node_modules"
pm2 save

# 12. Verificar se está funcionando
curl -I http://localhost:5000/
pm2 logs suphelp-geo --lines 10
```

## ✨ Novas Funcionalidades Implementadas

### 🔐 **Para Usuários Regulares:**
- **Filtros Avançados**: Categoria, rating mínimo, apenas com telefone
- **Estatísticas Reais**: Dados carregados da API do usuário
- **Busca Inteligente**: Geocoding + busca por raio com filtros

### 👨‍💼 **Para Administradores:**
- **Página Admin**: http://76.13.173.70:5000/admin
- **Importação Google Places**: Interface para importar estabelecimentos
- **Gerenciamento de Lugares**: Visualizar e deletar lugares
- **Estatísticas do Sistema**: Total de lugares, usuários, buscas

### 🎯 **Detecção Automática de Role:**
- Usuários admin veem botão "Admin" no header
- Redirecionamento automático baseado em permissões
- Interface diferenciada para cada tipo de usuário

## 🔑 Credenciais de Teste

**Usuário Regular:**
- Email: teste@suphelp.com.br
- Senha: password
- Acesso: Dashboard com busca e filtros

**Administrador:**
- Email: admin@suphelp.com.br  
- Senha: password
- Acesso: Dashboard + Área Administrativa

## 📋 Verificações Pós-Deploy

1. **Testar Login Regular:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"teste@suphelp.com.br","senha":"password"}'
   ```

2. **Testar Login Admin:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"admin@suphelp.com.br","senha":"password"}'
   ```

3. **Verificar Frontend React:**
   - http://76.13.173.70:5000/ (Landing/Login)
   - http://76.13.173.70:5000/dashboard (Dashboard)
   - http://76.13.173.70:5000/admin (Área Admin)

4. **Testar APIs:**
   ```bash
   # Busca por raio
   curl "http://localhost:5000/api/places/nearby?lat=-23.5505&lng=-46.6333&radius=5000"
   
   # Busca avançada
   curl "http://localhost:5000/api/places/search?q=restaurante&city=São Paulo"
   
   # Geocoding
   curl "http://localhost:5000/api/geocode?address=Rua Augusta, São Paulo"
   ```

## 🎨 Layout Preservado

- ✅ Cards com gradientes e animações
- ✅ Header profissional com perfil do usuário  
- ✅ Tabelas modernas com hover effects
- ✅ Exportação Excel/PDF funcionando
- ✅ Design responsivo mantido
- ✅ Tailwind CSS via CDN (sem dependências locais)

## 🔧 Troubleshooting

Se houver problemas:

1. **Verificar logs:**
   ```bash
   pm2 logs suphelp-geo --lines 20
   ```

2. **Reiniciar servidor:**
   ```bash
   pm2 restart suphelp-geo
   ```

3. **Verificar build do React:**
   ```bash
   ls -la backend/public/react-build/
   ```

4. **Testar conexão com banco:**
   ```bash
   docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "SELECT COUNT(*) FROM users;"
   ```

## 🎉 Sistema Completo

O sistema agora está 100% funcional com:
- ✅ Frontend React moderno e responsivo
- ✅ Backend Node.js com 16+ APIs
- ✅ Autenticação JWT com roles
- ✅ Busca geoespacial com PostGIS
- ✅ Importação via Google Places API
- ✅ Exportação Excel/PDF
- ✅ Área administrativa completa
- ✅ Filtros avançados de busca

**Pronto para produção!** 🚀