# Script de teste para o endpoint de Geocoding
# Execute este script após iniciar o servidor com: node src/server.js

Write-Host "=== Teste de Geocoding API ===" -ForegroundColor Cyan
Write-Host ""

# Teste 1: Geocoding de Jundiaí
Write-Host "1. Testando geocoding de 'Jundiaí, SP'..." -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "http://localhost:5000/api/geocode?address=Jundiaí, SP" -Method Get
Write-Host "Resultado:" -ForegroundColor Green
$response1 | ConvertTo-Json -Depth 5
Write-Host ""

# Teste 2: Geocoding de endereço específico
Write-Host "2. Testando geocoding de endereço completo..." -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/geocode?address=Rua XV de Novembro, 123, Jundiaí, SP" -Method Get
Write-Host "Resultado:" -ForegroundColor Green
$response2 | ConvertTo-Json -Depth 5
Write-Host ""

# Teste 3: Busca por raio usando o endereço geocodificado
Write-Host "3. Testando busca por raio usando coordenadas do geocoding..." -ForegroundColor Yellow
$lat = $response1.data.lat
$lng = $response1.data.lng
$response3 = Invoke-RestMethod -Uri "http://localhost:5000/api/places/nearby?lat=$lat&lng=$lng&radius=5000&limit=5" -Method Get
Write-Host "Resultado:" -ForegroundColor Green
$response3 | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "=== Testes Concluídos ===" -ForegroundColor Cyan
