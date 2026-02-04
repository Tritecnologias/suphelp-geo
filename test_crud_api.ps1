# Script PowerShell para testar CRUD completo

Write-Host "Testando CRUD Completo da API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/places"

# Teste 1: Criar novo lugar
Write-Host "1. POST /api/places - Criar novo lugar" -ForegroundColor Yellow
$newPlace = @{
    name = "Teste CRUD - Padaria do Bairro"
    address = "Rua Teste, 123 - Centro, Jundiai - SP"
    category = "Padaria"
    lat = -23.1865
    lng = -46.8917
    phone = "(11) 99999-9999"
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $newPlace -ContentType "application/json"
    $createdId = $created.data.id
    Write-Host "Sucesso: Lugar criado com ID $createdId" -ForegroundColor Green
    Write-Host "   Nome: $($created.data.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Teste 2: Buscar por ID
Write-Host "2. GET /api/places/$createdId - Buscar por ID" -ForegroundColor Yellow
try {
    $place = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method Get
    Write-Host "Sucesso: Lugar encontrado" -ForegroundColor Green
    Write-Host "   Nome: $($place.name)" -ForegroundColor Gray
    Write-Host "   Categoria: $($place.category)" -ForegroundColor Gray
    Write-Host "   Telefone: $($place.phone)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
}

# Teste 3: Atualizar lugar
Write-Host "3. PUT /api/places/$createdId - Atualizar lugar" -ForegroundColor Yellow
$update = @{
    name = "Teste CRUD - Padaria Atualizada"
    rating = 4.5
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method Put -Body $update -ContentType "application/json"
    Write-Host "Sucesso: Lugar atualizado" -ForegroundColor Green
    Write-Host "   Nome: $($updated.data.name)" -ForegroundColor Gray
    Write-Host "   Rating: $($updated.data.rating)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
}

# Teste 4: Listar lugares
Write-Host "4. GET /api/places?limit=5 - Listar lugares" -ForegroundColor Yellow
try {
    $list = Invoke-RestMethod -Uri "${baseUrl}?limit=5" -Method Get
    Write-Host "Sucesso: $($list.data.Count) lugares listados" -ForegroundColor Green
    Write-Host "   Total no banco: $($list.pagination.total)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
}

# Teste 5: Busca por raio
Write-Host "5. GET /api/places/nearby - Busca por raio" -ForegroundColor Yellow
try {
    $nearby = Invoke-RestMethod -Uri "${baseUrl}/nearby?lat=-23.1865&lng=-46.8917&radius=5000&limit=5" -Method Get
    Write-Host "Sucesso: $($nearby.total) lugares encontrados em 5km" -ForegroundColor Green
    if ($nearby.data.Count -gt 0) {
        Write-Host "   Mais proximo: $($nearby.data[0].name) ($($nearby.data[0].distance_km) km)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
}

# Teste 6: Busca avancada
Write-Host "6. GET /api/places/search - Busca avancada" -ForegroundColor Yellow
try {
    $search = Invoke-RestMethod -Uri "${baseUrl}/search?category=padaria&limit=5" -Method Get
    Write-Host "Sucesso: $($search.data.Count) padarias encontradas" -ForegroundColor Green
    Write-Host "   Total: $($search.pagination.total)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
}

# Teste 7: Deletar lugar
Write-Host "7. DELETE /api/places/$createdId - Deletar lugar" -ForegroundColor Yellow
try {
    $deleted = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method Delete
    Write-Host "Sucesso: Lugar deletado" -ForegroundColor Green
    Write-Host "   Nome: $($deleted.data.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
}

# Teste 8: Verificar se foi deletado
Write-Host "8. GET /api/places/$createdId - Verificar delecao" -ForegroundColor Yellow
try {
    $place = Invoke-RestMethod -Uri "$baseUrl/$createdId" -Method Get
    Write-Host "Erro: Lugar ainda existe!" -ForegroundColor Red
    Write-Host ""
} catch {
    Write-Host "Sucesso: Lugar nao encontrado (deletado corretamente)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Todos os testes concluidos!" -ForegroundColor Green
