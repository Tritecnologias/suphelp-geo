# Correção do Erro 502 Bad Gateway

## Problema
O servidor está retornando erro 502, o que significa que o nginx não consegue se comunicar com o backend Node.js (PM2).

## Diagnóstico Rápido

### 1. Verificar status do PM2
```bash
pm2 status
pm2 logs suphelp-geo --lines 50
```

### 2. Verificar se o backend está rodando
```bash
curl http://localhost:5000/api/health
```

### 3. Verificar portas em uso
```bash
netstat -tulpn | grep 5000
```

## Solução Passo a Passo

### Opção 1: Reiniciar PM2 (Mais Rápido)
```bash
cd ~/suphelp-geo/backend
pm2 restart suphelp-geo
pm2 logs suphelp-geo --lines 30
```

### Opção 2: Parar e Iniciar Novamente
```bash
cd ~/suphelp-geo/backend
pm2 stop suphelp-geo
pm2 delete suphelp-geo
pm2 start src/server.js --name suphelp-geo
pm2 save
```

### Opção 3: Deploy Completo (Se houver mudanças no código)
```bash
cd ~/suphelp-geo && \
git pull origin main && \
cd frontend && \
npm run build && \
cd .. && \
rm -rf backend/public/react-build && \
mkdir -p backend/public/react-build && \
cp -r frontend/dist/* backend/public/react-build/ && \
pm2 restart suphelp-geo && \
sudo systemctl reload nginx && \
pm2 logs suphelp-geo --lines 30
```

## Verificar Logs de Erro

### Ver logs do PM2
```bash
pm2 logs suphelp-geo --err --lines 100
```

### Ver logs do nginx
```bash
sudo tail -f /var/log/nginx/error.log
```

## Problemas Comuns

### 1. Porta 5000 já em uso
```bash
# Encontrar processo usando porta 5000
lsof -i :5000

# Matar processo (substitua PID pelo número encontrado)
kill -9 PID
```

### 2. Dependências faltando
```bash
cd ~/suphelp-geo/backend
npm install
```

### 3. Arquivo .env não encontrado
```bash
cd ~/suphelp-geo/backend
ls -la .env
# Se não existir, copiar do exemplo
cp ../.env .env
```

### 4. Erro de sintaxe no código
```bash
cd ~/suphelp-geo/backend
node src/server.js
# Verificar se há erros de sintaxe
```

## Comando de Diagnóstico Completo
```bash
#!/bin/bash
echo "=== Diagnóstico do Backend ==="
echo ""
echo "1. Status do PM2:"
pm2 status
echo ""
echo "2. Últimos logs do PM2:"
pm2 logs suphelp-geo --lines 20 --nostream
echo ""
echo "3. Testando backend diretamente:"
curl -s http://localhost:5000/api/health || echo "❌ Backend não responde"
echo ""
echo "4. Verificando porta 5000:"
netstat -tulpn | grep 5000 || echo "❌ Nada rodando na porta 5000"
echo ""
echo "5. Verificando arquivo .env:"
ls -la ~/suphelp-geo/backend/.env || echo "❌ Arquivo .env não encontrado"
echo ""
echo "6. Verificando node_modules:"
ls -la ~/suphelp-geo/backend/node_modules > /dev/null && echo "✅ node_modules existe" || echo "❌ node_modules não encontrado"
```

## Solução Definitiva (Reiniciar Tudo)
```bash
# 1. Parar tudo
pm2 stop all
pm2 delete all

# 2. Ir para o diretório
cd ~/suphelp-geo

# 3. Puxar últimas mudanças
git pull origin main

# 4. Instalar dependências
cd backend
npm install

# 5. Verificar .env
ls -la .env || cp ../.env .env

# 6. Iniciar backend
pm2 start src/server.js --name suphelp-geo

# 7. Salvar configuração PM2
pm2 save

# 8. Verificar logs
pm2 logs suphelp-geo --lines 30

# 9. Testar
curl http://localhost:5000/api/health
```

## Após Corrigir

### Verificar se está funcionando
```bash
# Teste local
curl http://localhost:5000/api/health

# Teste externo
curl http://76.13.173.70/api/health
```

### Acessar o admin
```
http://76.13.173.70/admin
```

## Se Nada Funcionar

### Verificar configuração do nginx
```bash
sudo nano /etc/nginx/sites-available/suphelp-geo
```

Deve ter:
```nginx
location /api/ {
    proxy_pass http://localhost:5000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Recarregar nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Contato de Emergência
Se o problema persistir, execute:
```bash
pm2 logs suphelp-geo --lines 100 > ~/error-log.txt
cat ~/error-log.txt
```

E envie o conteúdo do arquivo error-log.txt para análise.
