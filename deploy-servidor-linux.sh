#!/bin/bash

echo "🚀 DEPLOY SUPHELP GEO REACT - SERVIDOR LINUX"
echo "============================================="
echo ""

# Verificar se estamos na pasta correta
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Erro: Execute este script na pasta raiz do projeto (onde estão as pastas frontend e backend)"
    echo "Pasta atual: $(pwd)"
    echo "Conteúdo: $(ls -la)"
    exit 1
fi

echo "📍 Pasta atual: $(pwd)"
echo "📁 Estrutura encontrada:"
ls -la

echo ""
echo "📦 ETAPA 1: Build do Frontend React"
echo "-----------------------------------"

cd frontend

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado na pasta frontend"
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências do frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências!"
        exit 1
    fi
fi

# Fazer build
echo "🔨 Executando build de produção..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build!"
    exit 1
fi

echo "✅ Build concluído com sucesso!"
cd ..

echo ""
echo "🔧 ETAPA 2: Configurando Backend"
echo "--------------------------------"

cd backend

# Parar PM2
echo "⏹️ Parando PM2..."
pm2 stop suphelp-geo 2>/dev/null || echo "PM2 não estava rodando"

# Backup do frontend antigo
if [ -d "public" ]; then
    echo "📦 Fazendo backup do frontend antigo..."
    if [ -d "public-old" ]; then
        rm -rf public-old
    fi
    mv public public-old
    echo "✅ Backup salvo em public-old/"
fi

# Configurar novo frontend React
echo "📁 Instalando frontend React..."
mkdir -p public
cp -r ../frontend/dist/* public/
echo "✅ Frontend React instalado!"

# Instalar/atualizar dependências do backend
echo "📦 Verificando dependências do backend..."
npm install cors --save

echo ""
echo "🔄 ETAPA 3: Reiniciando Serviços"
echo "--------------------------------"

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart suphelp-geo || pm2 start src/server.js --name suphelp-geo

# Aguardar um pouco
sleep 3

# Verificar status
echo ""
echo "📊 Status do PM2:"
pm2 status

echo ""
echo "🧪 ETAPA 4: Testes Básicos"
echo "--------------------------"

# Testar API
echo "🔍 Testando API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$API_RESPONSE" = "200" ]; then
    echo "✅ API funcionando (HTTP $API_RESPONSE)"
else
    echo "⚠️ API retornou HTTP $API_RESPONSE"
fi

# Testar frontend
echo "🔍 Testando frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend funcionando (HTTP $FRONTEND_RESPONSE)"
else
    echo "⚠️ Frontend retornou HTTP $FRONTEND_RESPONSE"
fi

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "================================"
echo ""
echo "🌐 URLs disponíveis:"
echo "• Site React: http://76.13.173.70:5000/"
echo "• Login: http://76.13.173.70:5000/login"
echo "• Dashboard: http://76.13.173.70:5000/dashboard"
echo "• APIs: http://76.13.173.70:5000/api/"
echo "• Admin antigo: http://76.13.173.70:5000/admin-old/admin.html"
echo ""
echo "📋 Para verificar logs:"
echo "pm2 logs suphelp-geo"
echo ""
echo "🔄 Para fazer rollback (se necessário):"
echo "cd backend && pm2 stop suphelp-geo && rm -rf public && mv public-old public && pm2 restart suphelp-geo"