# Script PowerShell para testar o endpoint de enriquecimento

Write-Host "Testando Endpoint de Enriquecimento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Teste: Enriquecer ultimos 5 lugares
Write-Host "Teste: Enriquecer ultimos 5 lugares" -ForegroundColor Yellow
$body = @{
    placeIds = "all"
    limit = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/enrich-contacts" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "Sucesso: $($response.message)" -ForegroundColor Green
    if ($response.stats) {
        Write-Host "   Total: $($response.stats.total)" -ForegroundColor Gray
        Write-Host "   Enriquecidos: $($response.stats.enriched)" -ForegroundColor Gray
        Write-Host "   Nao encontrados: $($response.stats.not_found)" -ForegroundColor Gray
        Write-Host "   Erros: $($response.stats.errors)" -ForegroundColor Gray
        Write-Host "   Chamadas API: $($response.stats.api_calls)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teste concluido!" -ForegroundColor Green
