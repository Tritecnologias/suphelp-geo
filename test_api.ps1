# Script PowerShell para testar a API

Write-Host "🧪 Testando API SupHelp Geo" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Teste 1: Health Check
Write-Host "1️⃣  Teste: Health Check (GET /)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get
    Write-Host "✅ Sucesso: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 2: Listar lugares
Write-Host "2️⃣  Teste: Listar lugares (GET /api/places)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/places" -Method Get
    Write-Host "✅ Sucesso: $($response.Count) lugares encontrados" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Exemplo: $($response[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 3: Importar via Places API
Write-Host "3️⃣  Teste: Importar via Places API (POST /api/import-places-api)" -ForegroundColor Yellow
$body = @{
    city = "Jundiaí, SP"
    keywords = @("farmácia")
    maxResults = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/import-places-api" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Sucesso: $($response.message)" -ForegroundColor Green
    if ($response.stats) {
        Write-Host "   Novos: $($response.stats.success)" -ForegroundColor Gray
        Write-Host "   Atualizados: $($response.stats.duplicates)" -ForegroundColor Gray
        Write-Host "   Erros: $($response.stats.errors)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Testes concluídos!" -ForegroundColor Green
