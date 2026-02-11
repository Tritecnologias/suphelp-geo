# Troubleshooting - Servidor Parado

## Erro: "Failed to fetch" na tela de login

Este erro indica que o frontend não consegue se conectar ao backend. Possíveis causas:

### 1. Verificar se o Node.js está rodando

```bash
pm2 status
```

Se o status estiver "stopped" ou "errored":

```bash
pm2 restart suphelp-geo
pm2 logs suphelp-geo --lines 50
```

### 2. Verificar se o MySQL está rodando

```bash
sudo systemctl status mysql
```

Se estiver parado:

```bash
sudo systemctl start mysql
sudo systemctl enable mysql  # Para iniciar automaticamente
```

### 3. Verificar conexão do banco

```bash
mysql -u root -p
# Digite a senha do MySQL

# Dentro do MySQL:
USE suphelp_geo;
SHOW TABLES;
SELECT COUNT(*) FROM users;
exit;
```

### 4. Verificar logs do PM2

```bash
pm2 logs suphelp-geo --lines 100
```

Procure por erros como:
- `ECONNREFUSED` - Banco não está rodando
- `ER_ACCESS_DENIED_ERROR` - Senha do banco incorreta
- `ER_BAD_DB_ERROR` - Database não existe

### 5. Verificar arquivo .env

```bash
cd ~/suphelp-geo
cat .env
```

Certifique-se que tem:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=suphelp_geo
PORT=5000
JWT_SECRET=sua_chave_secreta
GOOGLE_MAPS_API_KEY=sua_api_key
```

### 6. Testar conexão manualmente

```bash
cd ~/suphelp-geo/backend/src
node test_connection.js
```

### 7. Reiniciar tudo do zero

```bash
# Parar aplicação
pm2 stop suphelp-geo

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar se MySQL está rodando
sudo systemctl status mysql

# Iniciar aplicação
pm2 start suphelp-geo

# Ver logs
pm2 logs suphelp-geo --lines 50
```

### 8. Se nada funcionar - Restart completo

```bash
# Deletar processo PM2
pm2 delete suphelp-geo

# Navegar para o projeto
cd ~/suphelp-geo

# Iniciar novamente
pm2 start backend/src/server.js --name suphelp-geo

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### 9. Verificar porta 5000

```bash
# Ver se algo está usando a porta 5000
sudo lsof -i :5000

# Se houver outro processo, matar:
sudo kill -9 PID_DO_PROCESSO
```

### 10. Testar API diretamente

```bash
# Testar se o servidor responde
curl http://localhost:5000/api/health

# Testar login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@suphelp.com.br","senha":"password"}'
```

## Comandos úteis

```bash
# Ver todos os processos PM2
pm2 list

# Ver logs em tempo real
pm2 logs suphelp-geo

# Reiniciar com variáveis de ambiente atualizadas
pm2 restart suphelp-geo --update-env

# Ver informações detalhadas
pm2 show suphelp-geo

# Monitorar recursos
pm2 monit
```

## Solução mais comum

Na maioria dos casos, o problema é o MySQL que parou. Execute:

```bash
sudo systemctl start mysql
pm2 restart suphelp-geo
```
