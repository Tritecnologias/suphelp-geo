# Script para testar API do CMS
Write-Host "=== Teste da API CMS ===" -ForegroundColor Cyan

# Teste 1: Verificar se a API está respondendo
Write-Host "1. Testando endpoint de configurações..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://76.13.173.70/api/cms/config" -Method Get
    Write-Host "✅ API respondendo:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro na API:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Teste 2: Tentar salvar uma configuração
Write-Host "2. Testando salvamento de configuração..." -ForegroundColor Yellow
$body = @{
    section = "footer"
    key = "company_name"
    value = "SupHelp Geo Teste"
    type = "text"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://76.13.173.70/api/cms/config" -Method Put -Body $body -ContentType "application/json"
    Write-Host "✅ Salvamento funcionando:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Erro ao salvar:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "=== Fim dos Testes ===" -ForegroundColor Cyan