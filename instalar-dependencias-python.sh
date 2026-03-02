#!/bin/bash

echo "🚀 Instalando dependências Python para SupHelp Geo"
echo "=================================================="
echo ""

# 1. Atualizar sistema
echo "1️⃣ Atualizando sistema..."
apt update
echo "✅ Sistema atualizado"
echo ""

# 2. Instalar Python e pip
echo "2️⃣ Instalando Python 3 e pip..."
apt install python3 python3-pip -y
echo "✅ Python instalado: $(python3 --version)"
echo "✅ pip instalado: $(pip3 --version)"
echo ""

# 3. Instalar dependências Python
echo "3️⃣ Instalando dependências Python..."
pip3 install pandas psycopg2-binary googlemaps python-dotenv
echo "✅ Dependências instaladas"
echo ""

# 4. Verificar instalação
echo "4️⃣ Verificando instalação..."
echo "Dependências instaladas:"
pip3 list | grep -E "pandas|psycopg2|googlemaps|python-dotenv"
echo ""

# 5. Reiniciar backend
echo "5️⃣ Reiniciando backend..."
pm2 restart suphelp-geo
echo "✅ Backend reiniciado"
echo ""

# 6. Mostrar status
echo "6️⃣ Status dos serviços:"
pm2 list
echo ""

echo "=================================================="
echo "✅ Instalação concluída!"
echo "=================================================="
echo ""
echo "Próximos passos:"
echo "1. Aguarde 5 segundos para o backend inicializar"
echo "2. Acesse http://76.13.173.70/admin"
echo "3. Vá em 'Importar'"
echo "4. Teste a importação via Google Places API"
echo ""
echo "Para ver os logs em tempo real:"
echo "pm2 logs suphelp-geo"
echo ""
