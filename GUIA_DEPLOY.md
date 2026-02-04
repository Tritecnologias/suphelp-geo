# 🚀 Guia de Deploy - Servidor 76.13.173.70

## 📋 Pré-requisitos no Servidor

O servidor já possui:
- ✅ Linux (Debian)
- ✅ Nginx
- ✅ Node.js + npm
- ✅ PM2
- ✅ Python 3 + virtualenv
- ✅ PostgreSQL (Docker no mesmo IP)

---

## 🔧 Passo 1: Preparar o Código para Deploy

### 1.1. Atualizar .gitignore
```bash
# Verificar se .gitignore está correto
cat .gitignore
```

### 1.2. Commit e Push
```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: Fase 1 Concluída - CRUD + Filtros Geoespaciais"

# Push para o repositório
git push origin main
```

---

## 🌐 Passo 2: Deploy no Servidor

### 2.1. Conectar no Servidor
```bash
ssh root@76.13.173.70
# ou
ssh diego@76.13.173.70
```

### 2.2. Navegar para o Diretório
```bash
cd /var/www/suphelp-geo-online/backend
```

### 2.3. Atualizar o Código
```bash
# Fazer backup do .env atual
cp .env .env.backup

# Puxar código atualizado
git pull origin main

# Restaurar .env se necessário
cp .env.backup .env
```

### 2.4. Instalar Dependências
```bash
# Node.js
npm install

# Python (se necessário)
pip install -r requirements.txt
```

### 2.5. Testar Conexão com Banco
```bash
npm run test-connection
```

### 2.6. Reiniciar Serviço PM2
```bash
# Reiniciar backend
pm2 restart suphelp-backend

# Verificar status
pm2 status

# Ver logs
pm2 logs suphelp-backend --lines 50
```

---

## 🔍 Passo 3: Verificar se Está Funcionando

### 3.1. Testar Localmente no Servidor
```bash
# Health check
curl http://localhost:5000/

# Listar lugares
curl http://localhost:5000/api/places?limit=5
```

### 3.2. Testar Externamente

#### Via Navegador (Interface Web) ⭐ RECOMENDADO
```
http://76.13.173.70:5000/
```

A interface web permite testar todos os endpoints sem usar comandos!

#### Via cURL (Linha de Comando)
```bash
# Do seu computador local
curl http://76.13.173.70:5000/

# Listar lugares
curl http://76.13.173.70:5000/api/places?limit=5
```

### 3.3. Compartilhar com Diego
Envie este link para o Diego testar:
```
http://76.13.173.70:5000/
```

Ele poderá testar todos os endpoints diretamente no navegador, sem precisar entrar via SSH!

---

## 🌍 Passo 4: Configurar Nginx (se necessário)

### 4.1. Verificar Configuração Atual
```bash
cat /etc/nginx/sites-available/suphelp-geo
```

### 4.2. Configuração Recomendada
```nginx
server {
    listen 80;
    server_name suphelp.com.br www.suphelp.com.br;

    # Frontend (React - Fase 2)
    location / {
        root /var/www/suphelp-geo-online/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4.3. Aplicar Configuração
```bash
# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🧪 Passo 5: Testes em Produção

### 5.1. Testar Endpoints Principais
```bash
# Health check
curl http://76.13.173.70:5000/

# Listar lugares
curl http://76.13.173.70:5000/api/places?limit=5

# Buscar por ID
curl http://76.13.173.70:5000/api/places/1

# Busca por raio
curl "http://76.13.173.70:5000/api/places/nearby?lat=-23.1865&lng=-46.8917&radius=5000&limit=5"
```

### 5.2. Importar Dados de Teste
```bash
curl -X POST http://76.13.173.70:5000/api/import-places-api \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Jundiaí, SP",
    "keywords": ["farmácia"],
    "maxResults": 5
  }'
```

---

## 🔒 Passo 6: Segurança (Opcional)

### 6.1. Firewall
```bash
# Verificar portas abertas
sudo ufw status

# Permitir porta 5000 (se necessário)
sudo ufw allow 5000/tcp

# Ou apenas via Nginx (porta 80/443)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 6.2. SSL/HTTPS (Recomendado)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d suphelp.com.br -d www.suphelp.com.br
```

---

## 📊 Passo 7: Monitoramento

### 7.1. PM2 Monitoring
```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs suphelp-backend

# Ver métricas
pm2 monit

# Salvar configuração PM2
pm2 save
```

### 7.2. Logs do Sistema
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do PM2
pm2 logs suphelp-backend --lines 100
```

---

## 🐛 Troubleshooting

### Problema: Porta 5000 já em uso
```bash
# Verificar o que está usando a porta
sudo lsof -i :5000

# Matar processo se necessário
sudo kill -9 <PID>

# Reiniciar PM2
pm2 restart suphelp-backend
```

### Problema: Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
npm run test-connection

# Verificar .env
cat .env | grep DB_
```

### Problema: Módulos não encontrados
```bash
# Reinstalar dependências
rm -rf node_modules
npm install

# Python
pip install -r requirements.txt
```

### Problema: PM2 não inicia
```bash
# Ver erro detalhado
pm2 logs suphelp-backend --err

# Reiniciar PM2
pm2 delete suphelp-backend
pm2 start src/server.js --name suphelp-backend
pm2 save
```

---

## ✅ Checklist de Deploy

- [ ] Código commitado e pushed
- [ ] Conectado no servidor via SSH
- [ ] Código atualizado (git pull)
- [ ] Dependências instaladas (npm install)
- [ ] .env configurado corretamente
- [ ] Teste de conexão com banco OK
- [ ] PM2 reiniciado
- [ ] Health check funcionando
- [ ] Endpoints testados
- [ ] Nginx configurado (se necessário)
- [ ] Logs verificados
- [ ] Documentação atualizada

---

## 📞 Comandos Úteis

```bash
# Status geral
pm2 status
pm2 logs suphelp-backend --lines 50
curl http://localhost:5000/

# Reiniciar tudo
pm2 restart suphelp-backend
sudo systemctl reload nginx

# Ver uso de recursos
pm2 monit
htop

# Backup do banco (opcional)
pg_dump -h 76.13.173.70 -U admin suphelp_geo > backup.sql
```

---

## 🎯 Próximos Passos Após Deploy

1. ✅ Validar que tudo está funcionando
2. ✅ Testar com Diego
3. ✅ Configurar SSL (se domínio estiver apontado)
4. ✅ Configurar monitoramento (opcional)
5. ✅ Documentar para o Diego como testar

---

**Tempo estimado de deploy:** 15-30 minutos

**Dificuldade:** Fácil (servidor já configurado)

**Suporte:** Disponível para ajudar no deploy
