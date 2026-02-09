# 🚀 Guia PM2 - SupHelp Geo

## O que é PM2?

PM2 é um gerenciador de processos para Node.js que mantém sua aplicação rodando 24/7, mesmo após fechar o SSH.

## 📦 Instalação

```bash
# Conecte ao servidor
ssh admin@76.13.173.70

# Instale PM2 globalmente
sudo npm install -g pm2
```

## 🎯 Configuração Inicial

### 1. Pare processos antigos

```bash
cd ~/suphelp-geo/backend
sudo pkill -9 node
pm2 delete all
```

### 2. Inicie com PM2

```bash
# Opção 1: Comando simples
pm2 start src/server.js --name "suphelp-geo"

# Opção 2: Usando arquivo de configuração (recomendado)
pm2 start ecosystem.config.js

# Salve a configuração
pm2 save

# Configure para iniciar no boot
pm2 startup
# Execute o comando que aparecer (começa com sudo)
```

## 📊 Comandos Principais

### Status e Monitoramento

```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs suphelp-geo

# Ver logs com filtro
pm2 logs suphelp-geo --lines 100
pm2 logs suphelp-geo --err  # Apenas erros

# Monitorar CPU e memória
pm2 monit

# Informações detalhadas
pm2 show suphelp-geo
```

### Controle do Processo

```bash
# Reiniciar
pm2 restart suphelp-geo

# Parar
pm2 stop suphelp-geo

# Iniciar
pm2 start suphelp-geo

# Deletar
pm2 delete suphelp-geo

# Reiniciar todos
pm2 restart all
```

## 🔄 Deploy de Atualizações

### Método 1: Manual

```bash
cd ~/suphelp-geo/backend
git pull origin main
pm2 restart suphelp-geo
pm2 logs suphelp-geo
```

### Método 2: Script Automático

```bash
cd ~/suphelp-geo/backend
chmod +x deploy.sh
./deploy.sh
```

### Método 3: Comando Único via SSH

```bash
ssh admin@76.13.173.70 "cd ~/suphelp-geo/backend && git pull && pm2 restart suphelp-geo"
```

## 🛠️ Troubleshooting

### Servidor não inicia

```bash
# Veja os logs de erro
pm2 logs suphelp-geo --err

# Verifique se a porta está ocupada
lsof -i :5000

# Reinicie do zero
pm2 delete suphelp-geo
pm2 start src/server.js --name "suphelp-geo"
```

### Servidor consome muita memória

```bash
# Configure limite de memória
pm2 start src/server.js --name "suphelp-geo" --max-memory-restart 500M
```

### Logs muito grandes

```bash
# Limpe os logs
pm2 flush

# Configure rotação de logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 📋 Checklist de Deploy

- [ ] Conectou ao servidor via SSH
- [ ] Instalou PM2 (`npm install -g pm2`)
- [ ] Parou processos antigos (`pkill -9 node`)
- [ ] Iniciou com PM2 (`pm2 start src/server.js --name suphelp-geo`)
- [ ] Salvou configuração (`pm2 save`)
- [ ] Configurou startup (`pm2 startup`)
- [ ] Testou no navegador (http://76.13.173.70)
- [ ] Verificou logs (`pm2 logs suphelp-geo`)
- [ ] Fechou SSH e testou novamente ✅

## 🎯 Vantagens do PM2

✅ Mantém aplicação rodando após fechar SSH
✅ Reinicia automaticamente se crashar
✅ Inicia automaticamente no boot do servidor
✅ Logs organizados e fáceis de acessar
✅ Monitoramento de CPU e memória
✅ Zero downtime em deploys
✅ Suporte a múltiplas instâncias (cluster mode)

## 📞 Comandos Rápidos

```bash
# Ver tudo
pm2 status && pm2 logs suphelp-geo --lines 20

# Deploy completo
cd ~/suphelp-geo/backend && git pull && pm2 restart suphelp-geo && pm2 logs suphelp-geo

# Reiniciar se travar
pm2 restart suphelp-geo --update-env

# Backup da configuração
pm2 save
```

## 🔗 Links Úteis

- Documentação PM2: https://pm2.keymetrics.io/
- PM2 Quick Start: https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 Cluster Mode: https://pm2.keymetrics.io/docs/usage/cluster-mode/
