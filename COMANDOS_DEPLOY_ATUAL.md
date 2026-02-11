# Comandos para Deploy no Servidor Linux

## 1. Conectar ao servidor
```bash
ssh dev@76.13.173.70
```

## 2. Navegar para o diretório do projeto
```bash
cd ~/suphelp-geo
```

## 3. Fazer backup do .env
```bash
cp backend/.env backend/.env.backup
```

## 4. Parar processos PM2
```bash
pm2 stop suphelp-geo
pm2 delete suphelp-geo
```

## 5. Atualizar código do Git
```bash
git stash push -m "Deploy backup $(date)"
git pull origin main
```

## 6. Restaurar .env
```bash
cp backend/.env.backup backend/.env
```

## 7. Instalar dependências do backend
```bash
cd backend
npm install --production
cd ..
```

## 8. Instalar dependências e fazer build do frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

## 9. Copiar build para o backend
```bash
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/
```

## 10. Iniciar com PM2
```bash
cd backend
pm2 start src/server.js --name "suphelp-geo" --watch --ignore-watch="node_modules"
pm2 save
```

## 11. Verificar se está funcionando
```bash
curl -I http://localhost:5000/
pm2 logs suphelp-geo --lines 10
```

## 12. Testar login
```bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"teste@suphelp.com.br","senha":"password"}'
```

## Comandos de Verificação

### Ver logs em tempo real
```bash
pm2 logs suphelp-geo
```

### Verificar status
```bash
pm2 list
```

### Verificar estrutura da tabela users
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "\d users"
```

### Verificar dados do usuário teste
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "SELECT id, email, password_hash FROM users WHERE email = 'teste@suphelp.com.br';"
```

## Resolução de Problemas

### Se o login ainda não funcionar, verificar:
1. Se a coluna é `password_hash` ou `senha_hash`
2. Se o hash da senha está correto
3. Se não há erros nos logs do PM2

### Recriar hash da senha se necessário:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password', 10));"
```

### Atualizar senha na base de dados:
```bash
docker exec -it suphelp_db psql -U admin -d suphelp_geo -c "UPDATE users SET password_hash = '\$2a\$10\$TXkOXUK40xjXYgaVNEhYfeJ.CweVP/czYhQH.fPP/gU18LUW73m2y' WHERE email = 'teste@suphelp.com.br';"
```