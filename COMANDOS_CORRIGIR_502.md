# Comandos para Corrigir Erro 502

## Problema Atual
- ❌ GET http://76.13.173.70/admin retorna 502 (Bad Gateway)
- Isso significa que o backend Node.js (PM2) não está respondendo

## Solução Rápida (Execute no Servidor)

### 1. Conectar no servidor
```bash
ssh root@76.13.173.70
```

### 2. Executar script de correção automática
```bash
cd ~/suphelp-geo
git pull origin main
chmod +x fix-502.sh
./fix-502.sh
```

## OU Solução Manual (Passo a Passo)

### 1. Verificar status do PM2
```bash
pm2 status
pm2 logs suphelp-geo --lines 30
```

### 2. Reiniciar backend
```bash
cd ~/suphelp-geo/backend
pm2 restart suphelp-geo
```

### 3. Se não funcionar, deletar e recriar
```bash
pm2 stop suphelp-geo
pm2 delete suphelp-geo
cd ~/suphelp-geo/backend
pm2 start src/server.js --name suphelp-geo
pm2 save
```

### 4. Verificar se está funcionando
```bash
curl http://localhost:5000/api/health
```

Deve retornar:
```json
{"message":"SupHelp Geo API - Sistema Operacional 🚀"}
```

### 5. Recarregar nginx
```bash
sudo systemctl reload nginx
```

### 6. Testar externamente
```bash
curl http://76.13.173.70/api/health
```

## Deploy Completo (Se houver mudanças no código)

```bash
cd ~/suphelp-geo && \
git pull origin main && \
cd backend && \
npm install && \
cd ../frontend && \
npm run build && \
cd .. && \
rm -rf backend/public/react-build && \
mkdir -p backend/public/react-build && \
cp -r frontend/dist/* backend/public/react-build/ && \
pm2 restart suphelp-geo && \
sudo systemctl reload nginx && \
echo "✅ Deploy concluído!" && \
pm2 logs suphelp-geo --lines 20
```

## Verificar Logs em Tempo Real

```bash
pm2 logs suphelp-geo
```

Para sair: `Ctrl + C`

## Instalar Dependências Python (Para Upload CSV)

```bash
pip3 install pandas psycopg2-binary googlemaps python-dotenv --break-system-packages
```

## Testar Upload CSV

Após corrigir o 502:

1. Acesse: http://76.13.173.70/admin
2. Faça login
3. Vá em "Importar"
4. Na seção "Importar via Planilha CSV", faça upload de um arquivo .csv

Formato do CSV:
```csv
name,address,category,lat,lon
Padaria Central,Rua Principal 123,Padaria,-23.1858,-46.8978
Mercado Bom Preço,Av Comercial 456,Mercado,-23.1900,-46.9000
```

## Troubleshooting

### Backend não inicia
```bash
cd ~/suphelp-geo/backend
node src/server.js
# Verificar erros de sintaxe
```

### Porta 5000 ocupada
```bash
lsof -i :5000
kill -9 <PID>
```

### Arquivo .env não encontrado
```bash
cd ~/suphelp-geo/backend
cp ../.env .env
```

### Dependências faltando
```bash
cd ~/suphelp-geo/backend
npm install
```

## Status Esperado

Após executar os comandos, você deve ver:

```
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ suphelp-geo      │ fork        │ 0       │ online  │ 0%       │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

E ao acessar http://76.13.173.70/admin deve carregar a página normalmente.
