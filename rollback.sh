#!/bin/bash

echo "🔄 ROLLBACK SUPHELP GEO - VOLTANDO AO SISTEMA ANTIGO"
echo "===================================================="
echo ""

# Verificar se estamos na pasta backend
if [ ! -f "src/server.js" ]; then
    echo "❌ Erro: Execute este script na pasta backend/"
    echo "Pasta atual: $(pwd)"
    exit 1
fi

echo "⏹️ Parando PM2..."
pm2 stop suphelp-geo

echo "🔄 Restaurando frontend antigo..."
if [ -d "public-old" ]; then
    rm -rf public
    mv public-old public
    echo "✅ Frontend antigo restaurado!"
else
    echo "❌ Backup não encontrado (public-old/)"
    exit 1
fi

echo "🔄 Reiniciando PM2..."
pm2 restart suphelp-geo

sleep 2

echo "📊 Status do PM2:"
pm2 status

echo ""
echo "🧪 Testando sistema..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Sistema antigo funcionando (HTTP $RESPONSE)"
else
    echo "⚠️ Sistema retornou HTTP $RESPONSE"
fi

echo ""
echo "✅ ROLLBACK CONCLUÍDO!"
echo "====================="
echo ""
echo "🌐 Sistema antigo disponível em:"
echo "• Site: http://76.13.173.70:5000/"
echo "• Admin: http://76.13.173.70:5000/admin.html"