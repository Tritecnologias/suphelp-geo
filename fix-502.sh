#!/bin/bash

echo "🔧 Iniciando correção do erro 502..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar status atual
echo "📊 Verificando status do PM2..."
pm2 status

echo ""
echo "📋 Últimos logs do backend:"
pm2 logs suphelp-geo --lines 20 --nostream

echo ""
echo "🔍 Testando backend na porta 5000..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend respondendo na porta 5000${NC}"
else
    echo -e "${RED}❌ Backend NÃO está respondendo${NC}"
fi

echo ""
echo "🛑 Parando PM2..."
pm2 stop suphelp-geo
pm2 delete suphelp-geo

echo ""
echo "📂 Navegando para diretório do projeto..."
cd ~/suphelp-geo

echo ""
echo "🔄 Puxando últimas mudanças do Git..."
git pull origin main

echo ""
echo "📦 Verificando dependências do backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado, instalando...${NC}"
    npm install
else
    echo -e "${GREEN}✅ node_modules existe${NC}"
fi

echo ""
echo "🔐 Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env não encontrado, copiando do diretório raiz...${NC}"
    cp ../.env .env
else
    echo -e "${GREEN}✅ .env existe${NC}"
fi

echo ""
echo "🚀 Iniciando backend com PM2..."
pm2 start src/server.js --name suphelp-geo

echo ""
echo "💾 Salvando configuração do PM2..."
pm2 save

echo ""
echo "⏳ Aguardando 3 segundos para o backend inicializar..."
sleep 3

echo ""
echo "🧪 Testando backend..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend está funcionando!${NC}"
    
    echo ""
    echo "🔄 Recarregando nginx..."
    sudo systemctl reload nginx
    
    echo ""
    echo -e "${GREEN}✅ Correção concluída com sucesso!${NC}"
    echo ""
    echo "📊 Status final:"
    pm2 status
    
    echo ""
    echo "🌐 Teste externo:"
    echo "   curl http://76.13.173.70/api/health"
    echo ""
    echo "🎯 Acesse o admin em:"
    echo "   http://76.13.173.70/admin"
else
    echo -e "${RED}❌ Backend ainda não está respondendo${NC}"
    echo ""
    echo "📋 Logs de erro:"
    pm2 logs suphelp-geo --err --lines 30
fi

echo ""
echo "📝 Para ver logs em tempo real:"
echo "   pm2 logs suphelp-geo"
