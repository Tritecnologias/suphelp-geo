# Script para atualizar o servidor Linux remoto
# Execute este script para fazer deploy das alterações

$SERVER_IP = "76.13.173.70"
$SERVER_USER = "admin"  # Ajuste se necessário

Write-Host "=== Deploy de Atualização ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Conectando ao servidor..." -ForegroundColor Yellow
Write-Host "Servidor: $SERVER_IP" -ForegroundColor Gray
Write-Host ""

Write-Host "Execute os seguintes comandos no servidor:" -ForegroundColor Green
Write-Host ""
Write-Host "# 1. Navegue até o diretório do projeto" -ForegroundColor White
Write-Host "cd /caminho/do/projeto/suphelp-geo" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 2. Faça pull das alterações" -ForegroundColor White
Write-Host "git pull origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 3. Encontre o processo Node.js rodando" -ForegroundColor White
Write-Host "ps aux | grep node" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 4. Mate o processo (substitua PID pelo número que aparecer)" -ForegroundColor White
Write-Host "kill -9 PID" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 5. Reinicie o servidor" -ForegroundColor White
Write-Host "nohup node src/server.js > server.log 2>&1 &" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 6. Verifique se está rodando" -ForegroundColor White
Write-Host "tail -f server.log" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Ou use este comando único ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh $SERVER_USER@$SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Depois cole este comando:" -ForegroundColor Yellow
Write-Host "cd /caminho/do/projeto && git pull && pkill -f 'node src/server.js' && nohup node src/server.js > server.log 2>&1 & && tail -f server.log" -ForegroundColor Cyan
