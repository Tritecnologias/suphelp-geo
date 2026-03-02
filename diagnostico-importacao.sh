#!/bin/bash

echo "🔍 Diagnóstico de Importação - SupHelp Geo"
echo "=========================================="
echo ""

# 1. Verificar Python
echo "1️⃣ Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python instalado: $PYTHON_VERSION"
else
    echo "❌ Python 3 NÃO está instalado!"
    echo "   Instale com: apt install python3 python3-pip -y"
fi
echo ""

# 2. Verificar pip
echo "2️⃣ Verificando pip..."
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version)
    echo "✅ pip instalado: $PIP_VERSION"
else
    echo "❌ pip NÃO está instalado!"
fi
echo ""

# 3. Verificar dependências Python
echo "3️⃣ Verificando dependências Python..."
DEPS=("pandas" "psycopg2" "googlemaps" "python-dotenv")
for dep in "${DEPS[@]}"; do
    if pip3 show $dep &> /dev/null; then
        VERSION=$(pip3 show $dep | grep Version | cut -d' ' -f2)
        echo "✅ $dep: $VERSION"
    else
        echo "❌ $dep NÃO instalado"
    fi
done
echo ""

# 4. Verificar arquivo .env
echo "4️⃣ Verificando arquivo .env..."
if [ -f ".env" ]; then
    echo "✅ Arquivo .env existe"
    if grep -q "GOOGLE_MAPS_API_KEY" .env; then
        echo "✅ GOOGLE_MAPS_API_KEY configurada"
    else
        echo "⚠️  GOOGLE_MAPS_API_KEY não encontrada no .env"
    fi
else
    echo "❌ Arquivo .env NÃO existe!"
fi
echo ""

# 5. Verificar scripts Python
echo "5️⃣ Verificando scripts Python..."
SCRIPTS=("backend/src/worker_places_api.py" "backend/src/worker_csv.py" "backend/src/worker_enrich_contacts.py")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "✅ $script existe"
    else
        echo "❌ $script NÃO encontrado"
    fi
done
echo ""

# 6. Verificar PostgreSQL
echo "6️⃣ Verificando PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL está rodando"
else
    echo "❌ PostgreSQL NÃO está rodando!"
fi
echo ""

# 7. Verificar PM2
echo "7️⃣ Verificando PM2..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 instalado"
    pm2 list | grep suphelp-geo
else
    echo "❌ PM2 NÃO está instalado!"
fi
echo ""

# 8. Verificar nginx
echo "8️⃣ Verificando nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ nginx está rodando"
else
    echo "❌ nginx NÃO está rodando!"
fi
echo ""

# 9. Testar conexão com banco
echo "9️⃣ Testando conexão com banco de dados..."
if command -v psql &> /dev/null; then
    COUNT=$(psql -h 76.13.173.70 -U admin -d suphelp_geo -t -c "SELECT COUNT(*) FROM places;" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ Conexão com banco OK - $COUNT lugares cadastrados"
    else
        echo "❌ Erro ao conectar no banco de dados"
    fi
else
    echo "⚠️  psql não instalado, não foi possível testar"
fi
echo ""

# 10. Resumo
echo "=========================================="
echo "📊 RESUMO"
echo "=========================================="
echo ""
echo "Para corrigir problemas encontrados:"
echo ""
echo "1. Instalar Python e pip:"
echo "   apt update && apt install python3 python3-pip -y"
echo ""
echo "2. Instalar dependências:"
echo "   pip3 install pandas psycopg2-binary googlemaps python-dotenv"
echo ""
echo "3. Configurar .env:"
echo "   nano .env"
echo "   Adicionar: GOOGLE_MAPS_API_KEY=sua_chave_aqui"
echo ""
echo "4. Reiniciar backend:"
echo "   pm2 restart suphelp-geo"
echo ""
echo "5. Ver logs:"
echo "   pm2 logs suphelp-geo --lines 50"
echo ""
