# 🚀 Guia de Deploy Rápido

## Servidor Linux Remoto: 76.13.173.70

### Opção 1: Via SSH Manual

1. **Conecte ao servidor:**
```bash
ssh admin@76.13.173.70
# ou
ssh root@76.13.173.70
```

2. **Navegue até o diretório do projeto:**
```bash
cd /root/suphelp-geo
# ou onde estiver o projeto
```

3. **Atualize o código:**
```bash
git pull origin main
```

4. **Reinicie o servidor Node.js:**
```bash
# Encontre o processo
ps aux | grep node

# Mate o processo (substitua 1234 pelo PID real)
kill -9 1234

# Ou mate todos os processos node
pkill -f "node src/server.js"

# Reinicie o servidor
nohup node src/server.js > server.log 2>&1 &

# Verifique os logs
tail -f server.log
```

### Opção 2: Comando Único

```bash
ssh admin@76.13.173.70 "cd /root/suphelp-geo && git pull && pkill -f 'node src/server.js' && nohup node src/server.js > server.log 2>&1 &"
```

### Opção 3: Se estiver usando PM2

```bash
ssh admin@76.13.173.70
cd /root/suphelp-geo
git pull origin main
pm2 restart suphelp-geo
pm2 logs suphelp-geo
```

### Opção 4: Se estiver usando Docker

```bash
ssh admin@76.13.173.70
cd /root/suphelp-geo
git pull origin main
docker-compose down
docker-compose up -d --build
docker-compose logs -f
```

---

## 🔍 Verificar se funcionou

Após reiniciar, teste:

```bash
# No servidor
curl http://localhost:5000/api/geocode?address=Jundiaí

# Do seu computador
curl http://76.13.173.70:5000/api/geocode?address=Jundiaí
```

Ou acesse no navegador:
```
http://76.13.173.70/
```

---

## 📋 Checklist

- [ ] Conectou ao servidor via SSH
- [ ] Fez `git pull` para pegar as alterações
- [ ] Reiniciou o processo Node.js
- [ ] Verificou os logs (deve aparecer os emojis 🗺️ 🔍 📍)
- [ ] Testou a interface web
- [ ] Funcionou! 🎉

---

## ⚠️ Problemas Comuns

### "Permission denied"
```bash
# Use sudo ou root
sudo pkill -f "node src/server.js"
sudo nohup node src/server.js > server.log 2>&1 &
```

### "Port already in use"
```bash
# Encontre o que está usando a porta 5000
lsof -i :5000
# ou
netstat -tulpn | grep 5000

# Mate o processo
kill -9 PID
```

### "Git pull failed"
```bash
# Descarte alterações locais
git reset --hard origin/main
git pull origin main
```
