# Script para configurar o projeto React

Write-Host "🚀 Configurando projeto SupHelp Geo React..." -ForegroundColor Green

# 1. Instalar dependências do backend
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location backend
npm install cors
Set-Location ..

# 2. Instalar dependências do frontend
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install react-router-dom @types/react @types/react-dom

# 3. Criar arquivo de ambiente
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow
@"
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SupHelp Geo
"@ | Out-File -FilePath ".env" -Encoding UTF8

Set-Location ..

Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Iniciar backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Iniciar frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Acessar: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs do projeto:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "Site antigo: http://localhost:5000" -ForegroundColor White