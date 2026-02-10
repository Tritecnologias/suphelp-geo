# Script para fazer deploy do React no servidor

param(
    [string]$ServerIP = "76.13.173.70",
    [string]$ServerUser = "dev",
    [string]$ServerPath = "~/suphelp-geo/backend"
)

Write-Host "🚀 Iniciando deploy do React para o servidor..." -ForegroundColor Green
Write-Host "Servidor: $ServerUser@$ServerIP" -ForegroundColor Yellow
Write-Host ""

# 1. Build do Frontend
Write-Host "📦 Fazendo build do frontend React..." -ForegroundColor Yellow
Set-Location frontend

# Instalar dependências se necessário
if (!(Test-Path "node_modules")) {
    Write-Host "📥 Instalando dependências do frontend..." -ForegroundColor Cyan
    npm install
}

# Configurar variáveis de ambiente para produção
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Cyan
@"
VITE_API_URL=http://$ServerIP:5000/api
VITE_APP_NAME=SupHelp Geo
"@ | Out-File -FilePath ".env.production" -Encoding UTF8

# Fazer build
Write-Host "🔨 Executando build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build do frontend!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green
Set-Location ..

# 2. Preparar arquivos para upload
Write-Host "📁 Preparando arquivos para upload..." -ForegroundColor Yellow

# Criar pasta temporária
$tempDir = "deploy-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copiar build do React
Copy-Item -Recurse "frontend/dist/*" "$tempDir/"

# Copiar backend atualizado
Copy-Item -Recurse "backend/src" "$tempDir/"
Copy-Item "backend/package.json" "$tempDir/"

# 3. Criar script de configuração do servidor
@"
#!/bin/bash
echo "🔧 Configurando servidor para React..."

# Backup do frontend antigo
if [ -d "public" ]; then
    echo "📦 Fazendo backup do frontend antigo..."
    mv public public-old
fi

# Mover build do React para pasta public
echo "📁 Configurando build do React..."
mkdir -p public
cp -r dist/* public/
rm -rf dist

# Instalar dependências do backend (incluindo cors)
echo "📦 Instalando dependências do backend..."
npm install cors

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart suphelp-geo

echo "✅ Configuração concluída!"
echo ""
echo "🌐 URLs disponíveis:"
echo "Site React: http://$ServerIP:5000/"
echo "APIs: http://$ServerIP:5000/api/"
echo "Admin antigo: http://$ServerIP:5000/admin-old/"
"@ | Out-File -FilePath "$tempDir/configure-server.sh" -Encoding UTF8

Write-Host "✅ Arquivos preparados!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos manuais:" -ForegroundColor Cyan
Write-Host "1. Enviar pasta '$tempDir' para o servidor" -ForegroundColor White
Write-Host "2. SSH no servidor: ssh $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "3. Ir para pasta: cd $ServerPath" -ForegroundColor White
Write-Host "4. Executar: bash configure-server.sh" -ForegroundColor White
Write-Host ""
Write-Host "💡 Comandos completos:" -ForegroundColor Cyan
Write-Host "scp -r $tempDir/* $ServerUser@${ServerIP}:$ServerPath/" -ForegroundColor White
Write-Host "ssh $ServerUser@$ServerIP 'cd $ServerPath && bash configure-server.sh'" -ForegroundColor White