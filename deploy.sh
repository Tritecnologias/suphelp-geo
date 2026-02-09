#!/bin/bash
# Script de deploy para SupHelp Geo

echo "🚀 Iniciando deploy do SupHelp Geo..."

# Navega para o diretório
cd ~/suphelp-geo/backend || exit

# Atualiza código
echo "📥 Baixando atualizações do Git..."
git pull origin main

# Instala dependências (se houver novas)
echo "📦 Verificando dependências..."
npm install --production

# Reinicia com PM2
echo "🔄 Reiniciando servidor..."
pm2 restart suphelp-geo

# Mostra status
echo "✅ Deploy concluído!"
pm2 status
pm2 logs suphelp-geo --lines 20
