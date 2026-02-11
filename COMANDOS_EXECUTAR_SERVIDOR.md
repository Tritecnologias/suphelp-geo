# 🚀 COMANDOS PARA EXECUTAR NO SERVIDOR

Execute estes comandos em sequência no servidor Linux:

## 1️⃣ **Conectar e atualizar código**

```bash
# Conectar no servidor
ssh dev@76.13.173.70

# Navegar para o projeto
cd ~/suphelp-geo

# Fazer backup do .env
cp backend/.env backend/.env.backup

# Parar PM2
pm2 stop suphelp-geo

# Atualizar código do Git
git stash
git pull origin main

# Restaurar .env
cp backend/.env.backup backend/.env
```

## 2️⃣ **Configurar banco de dados**

```bash
# Executar script SQL completo
docker exec -i suphelp_db psql -U admin -d suphelp_geo < backend/src/setup_complete_db.sql

# Verificar se funcionou
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\dt"

# Ver dados criados
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

## 3️⃣ **Build e deploy do React**

```bash
# Instalar dependências do frontend
cd frontend
npm install

# Build de produção
npm run build

# Voltar para raiz
cd ..

# Remover build antigo
rm -rf backend/public/react-build

# Criar diretório
mkdir -p backend/public/react-build

# Copiar novo build
cp -r frontend/dist/* backend/public/react-build/

# Verificar se copiou
ls -la backend/public/react-build/
```

## 4️⃣ **Instalar dependências do backend e reiniciar**

```bash
# Instalar dependências do backend
cd backend
npm install --production

# Voltar para raiz
cd ..

# Reiniciar PM2
pm2 restart suphelp-geo

# Verificar status
pm2 status

# Ver logs
pm2 logs suphelp-geo --lines 20
```

## 5️⃣ **Testar APIs**

```bash
# Testar login
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@suphelp.com.br","senha":"password"}'

# Testar se o site carrega
curl -I http://localhost:5000/
```

## 6️⃣ **Acessar no navegador**

Abra no navegador:
- **Site**: http://76.13.173.70:5000/
- **Admin**: http://76.13.173.70:5000/admin

**Credenciais:**
- Email: `admin@suphelp.com.br`
- Senha: `password`

## ✅ **Verificar funcionalidades:**

No painel admin, teste:
- ✅ Dashboard com estatísticas
- ✅ Gerenciar lugares (adicionar, listar, deletar)
- ✅ Busca por raio
- ✅ Importação Google Places
- ✅ Enriquecimento de contatos
- ✅ Gestão de administradores
- ✅ Exportação Excel

## 🆘 **Se algo der errado:**

```bash
# Ver logs detalhados
pm2 logs suphelp-geo --lines 50

# Reiniciar tudo
pm2 restart suphelp-geo

# Verificar banco
docker ps
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "SELECT COUNT(*) FROM users;"
```

---

**Execute estes comandos em ordem e me diga o resultado!** 🚀