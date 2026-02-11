# 🚀 Comandos para Deploy no Servidor Linux

## 📋 Pré-requisitos
Certifique-se de que o servidor tem:
- Node.js (v18+)
- npm
- PM2 (`npm install -g pm2`)
- Git
- PostgreSQL rodando

## 🔧 Comandos para Executar no Servidor

### 1. Conectar no servidor
```bash
ssh dev@76.13.173.70
```

### 2. Navegar para o diretório do projeto
```bash
cd ~/suphelp-geo
```

### 3. Verificar status atual
```bash
pm2 list
git status
```

### 4. Executar o deploy
```bash
# Dar permissão de execução ao script
chmod +x deploy-servidor-linux.sh

# Executar o deploy
./deploy-servidor-linux.sh
```

## 🔍 Verificações Pós-Deploy

### Verificar se está rodando
```bash
# Ver processos PM2
pm2 list

# Ver logs em tempo real
pm2 logs suphelp-geo

# Testar API
curl http://localhost:5000/api/places

# Testar frontend
curl -I http://localhost:5000/
```

### Verificar URLs
- **Site React**: http://76.13.173.70:5000/
- **Login**: http://76.13.173.70:5000/login  
- **Dashboard**: http://76.13.173.70:5000/dashboard
- **Admin antigo**: http://76.13.173.70:5000/admin.html

## 🔧 Comandos Úteis

### PM2
```bash
# Ver status
pm2 list

# Ver logs
pm2 logs suphelp-geo

# Reiniciar
pm2 restart suphelp-geo

# Parar
pm2 stop suphelp-geo

# Monitorar
pm2 monit
```

### Nginx (se necessário)
```bash
# Verificar status
sudo systemctl status nginx

# Recarregar configuração
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### Banco de dados
```bash
# Conectar no PostgreSQL
docker exec -it suphelp_db psql -U admin -d suphelp_geo

# Ver tabelas
\dt

# Ver usuários
SELECT * FROM users;
```

## 🆘 Troubleshooting

### Se o build falhar
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Se o PM2 não iniciar
```bash
cd backend
pm2 delete suphelp-geo
pm2 start src/server.js --name suphelp-geo
```

### Se o banco não conectar
```bash
# Verificar se Docker está rodando
docker ps

# Verificar .env
cat backend/.env
```

### Rollback (se necessário)
```bash
# Voltar para commit anterior
git log --oneline -5
git reset --hard <commit-hash>
./deploy-servidor-linux.sh
```

## 📝 Credenciais de Teste

### Usuário comum
- **Email**: teste@suphelp.com.br
- **Senha**: password

### Admin
- **Email**: admin@suphelp.com.br  
- **Senha**: password

## 🎯 Checklist Final

- [ ] PM2 rodando sem erros
- [ ] Site carregando em http://76.13.173.70:5000/
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] Busca por endereço funcionando
- [ ] Exportação Excel/PDF funcionando
- [ ] Admin panel acessível

## 📞 Suporte

Se algo der errado, execute:
```bash
pm2 logs suphelp-geo --lines 50
```

E envie os logs para análise.