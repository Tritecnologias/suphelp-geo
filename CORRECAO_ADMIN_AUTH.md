# 🔧 CORREÇÃO: Autenticação Admin

Execute estes comandos no servidor para corrigir o problema de autenticação admin:

## 1️⃣ **Atualizar código**

```bash
# No servidor
cd ~/suphelp-geo

# Parar PM2
pm2 stop suphelp-geo

# Atualizar código
git pull origin main

# Reiniciar PM2
pm2 restart suphelp-geo
```

## 2️⃣ **Testar login novamente**

```bash
# Testar login e pegar o novo token
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@suphelp.com.br","senha":"password"}'
```

O token agora deve incluir a flag `isAdmin: true` para usuários com role admin.

## 3️⃣ **Acessar no navegador**

1. Acesse: http://76.13.173.70:5000/admin
2. Faça logout (se estiver logado)
3. Faça login novamente com:
   - Email: `admin@suphelp.com.br`
   - Senha: `password`

Agora a seção de **Administradores** deve funcionar sem erro 403!

## ✅ **O que foi corrigido:**

- ✅ Token JWT agora inclui `role` e `isAdmin`
- ✅ Usuários com role `admin` ou `super_admin` têm acesso às rotas admin
- ✅ Endpoint `/api/admin/list` agora funciona corretamente

---

**Execute estes comandos e teste novamente!** 🚀