# 🔄 PLANO DE ROLLBACK - SUPHELP GEO

## EM CASO DE PROBLEMAS NO DEPLOY

### ROLLBACK RÁPIDO (1 minuto)

Se algo der errado com o React, você pode voltar ao sistema antigo rapidamente:

```bash
# SSH no servidor
ssh dev@76.13.173.70
cd ~/suphelp-geo/backend

# Parar PM2
pm2 stop suphelp-geo

# Restaurar frontend antigo
rm -rf public
mv public-old public

# Reiniciar PM2
pm2 restart suphelp-geo

# Verificar
pm2 status
```

### VERIFICAÇÕES APÓS DEPLOY

#### 1. Verificar se PM2 está rodando
```bash
pm2 status
pm2 logs suphelp-geo --lines 20
```

#### 2. Testar URLs principais
- http://76.13.173.70:5000/ (deve carregar React)
- http://76.13.173.70:5000/api/health (deve retornar JSON)
- http://76.13.173.70:5000/admin-old/admin.html (backup do admin)

#### 3. Testar funcionalidades
- Cadastro de usuário
- Login
- Dashboard
- APIs funcionando

### PROBLEMAS COMUNS E SOLUÇÕES

#### Problema: "Cannot GET /"
**Causa:** Build do React não foi copiado corretamente
**Solução:**
```bash
# Verificar se existe public/index.html
ls -la public/
# Se não existir, fazer rollback
```

#### Problema: "API endpoints não funcionam"
**Causa:** CORS ou rotas conflitantes
**Solução:**
```bash
# Verificar logs
pm2 logs suphelp-geo
# Reinstalar dependências
npm install cors
pm2 restart suphelp-geo
```

#### Problema: "Página em branco"
**Causa:** Erro no JavaScript do React
**Solução:**
```bash
# Verificar console do navegador (F12)
# Fazer rollback se necessário
```

### BACKUP COMPLETO

Antes do deploy, sempre temos:
- `public-old/` - Frontend antigo completo
- `src/` - Backend atual (não alterado)
- Git - Histórico completo no repositório

### COMANDOS ÚTEIS

```bash
# Ver status completo
pm2 monit

# Reiniciar apenas se necessário
pm2 restart suphelp-geo

# Ver logs em tempo real
pm2 logs suphelp-geo --follow

# Verificar porta
netstat -tlnp | grep 5000

# Verificar espaço em disco
df -h
```

### CONTATOS DE EMERGÊNCIA

Se algo der muito errado:
1. Fazer rollback imediato
2. Verificar logs
3. Reportar problema com logs específicos

### TESTE COMPLETO PÓS-DEPLOY

```bash
# 1. Verificar serviço
curl http://76.13.173.70:5000/api/health

# 2. Verificar frontend
curl -I http://76.13.173.70:5000/

# 3. Verificar admin antigo
curl -I http://76.13.173.70:5000/admin-old/

# Todos devem retornar 200 OK
```