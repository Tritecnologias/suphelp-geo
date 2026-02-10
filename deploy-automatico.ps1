# Script automatizado para deploy no servidor

param(
    [string]$ServerIP = "76.13.173.70",
    [string]$ServerUser = "dev"
)

Write-Host "🚀 DEPLOY AUTOMATIZADO - SUPHELP GEO REACT" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Verificar se temos as pastas necessárias
if (!(Test-Path "frontend") -or !(Test-Path "backend")) {
    Write-Host "❌ Erro: Pastas frontend ou backend não encontradas!" -ForegroundColor Red
    Write-Host "Execute este script na pasta raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# 1. BUILD DO FRONTEND
Write-Host "📦 ETAPA 1: Build do Frontend React" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan

Set-Location frontend

# Verificar se node_modules existe
if (!(Test-Path "node_modules")) {
    Write-Host "📥 Instalando dependências do frontend..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
}

# Fazer build
Write-Host "🔨 Executando build de produção..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Set-Location ..

# 2. PREPARAR DEPLOY
Write-Host ""
Write-Host "📁 ETAPA 2: Preparando Deploy" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

# Criar pasta de deploy
$deployDir = "deploy-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copiar build do React
Write-Host "📋 Copiando build do React..." -ForegroundColor Yellow
Copy-Item -Recurse "frontend/dist" "$deployDir/"

# Copiar backend
Write-Host "📋 Copiando backend..." -ForegroundColor Yellow
Copy-Item -Recurse "backend/src" "$deployDir/"
Copy-Item "backend/package.json" "$deployDir/"

# Criar script de instalação para o servidor
Write-Host "📋 Criando script de instalação..." -ForegroundColor Yellow
@"
#!/bin/bash

echo "🚀 Instalando SupHelp Geo React no servidor..."
echo "=============================================="

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
cp -r dist/* public/
rm -rf dist
echo "✅ Frontend React instalado!"

# Atualizar backend
echo "🔧 Atualizando backend..."
cp -r src/* src/ 2>/dev/null || echo "Backend já atualizado"

# Instalar/atualizar dependências
echo "📦 Instalando dependências..."
npm install cors --save

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart suphelp-geo || pm2 start src/server.js --name suphelp-geo

# Verificar status
echo ""
echo "📊 Status do PM2:"
pm2 status

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "================================"
echo ""
echo "🌐 URLs disponíveis:"
echo "• Site React: http://$ServerIP:5000/"
echo "• Login: http://$ServerIP:5000/login"
echo "• Dashboard: http://$ServerIP:5000/dashboard"
echo "• APIs: http://$ServerIP:5000/api/"
echo "• Admin antigo: http://$ServerIP:5000/admin-old/admin.html"
echo ""
echo "📋 Para verificar logs:"
echo "pm2 logs suphelp-geo"
"@ | Out-File -FilePath "$deployDir/install.sh" -Encoding UTF8

Write-Host "✅ Pacote de deploy preparado!" -ForegroundColor Green

# 3. INSTRUÇÕES FINAIS
Write-Host ""
Write-Host "🎯 ETAPA 3: Deploy no Servidor" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Execute os seguintes comandos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Enviar arquivos para o servidor:" -ForegroundColor White
Write-Host "scp -r $deployDir/* $ServerUser@${ServerIP}:~/suphelp-geo/backend/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣ Conectar no servidor e instalar:" -ForegroundColor White
Write-Host "ssh $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "cd ~/suphelp-geo/backend" -ForegroundColor Cyan
Write-Host "chmod +x install.sh" -ForegroundColor Cyan
Write-Host "./install.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 OU execute tudo de uma vez:" -ForegroundColor Yellow
Write-Host "scp -r $deployDir/* $ServerUser@${ServerIP}:~/suphelp-geo/backend/ && ssh $ServerUser@$ServerIP 'cd ~/suphelp-geo/backend && chmod +x install.sh && ./install.sh'" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Após o deploy, acesse: http://$ServerIP:5000/" -ForegroundColor Green