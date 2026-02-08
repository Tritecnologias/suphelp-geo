# 🔐 Setup do Sistema de Autenticação

## 📋 O que foi implementado

### Frontend
1. **Landing Page** (`index.html`) - Página inicial moderna com apresentação
2. **Página de Planos** - Três planos: Básico, Profissional, Enterprise
3. **Cadastro** (`cadastro.html`) - Formulário completo de registro
4. **Login** (`login.html`) - Autenticação de usuários
5. **Dashboard** (`dashboard.html`) - Painel protegido com busca geográfica

### Backend
1. **Tabela de usuários** no PostgreSQL
2. **Endpoints de autenticação**:
   - POST `/api/auth/register` - Cadastro
   - POST `/api/auth/login` - Login
   - GET `/api/auth/profile` - Perfil (protegido)
3. **JWT** para autenticação
4. **Bcrypt** para hash de senhas

---

## 🚀 Como Instalar

### 1. Instalar Dependências

```bash
cd ~/suphelp-geo/backend
npm install
```

Isso vai instalar:
- `bcryptjs` - Para hash de senhas
- `jsonwebtoken` - Para tokens JWT

### 2. Criar Tabela de Usuários

Execute o SQL no PostgreSQL:

```bash
psql -h 76.13.173.70 -U admin -d suphelp_geo -f src/setup_users_table.sql
```

Ou conecte manualmente e execute:

```sql
-- Copie e cole o conteúdo de src/setup_users_table.sql
```

### 3. Verificar Variável de Ambiente

O arquivo `.env` já tem a variável `JWT_SECRET`:

```
JWT_SECRET=UmW8lL0KhR73x2a7oom4X2F6FngYIIt0tahrUPOXjlc=
```

### 4. Reiniciar o Servidor

```bash
# Mate processos antigos
sudo pkill -9 node

# Inicie o servidor
nohup node src/server.js > server.log 2>&1 &

# Veja os logs
tail -f server.log
```

---

## 📊 Planos Disponíveis

| Plano | Preço | Buscas/Mês | Recursos |
|-------|-------|------------|----------|
| **Básico** | R$ 49 | 100 | Excel, PDF, Suporte Email |
| **Profissional** | R$ 149 | 1.000 | + API Access, Relatórios |
| **Enterprise** | R$ 499 | Ilimitado | + Suporte 24/7, Integração |

---

## 🔑 Fluxo de Autenticação

### 1. Cadastro
```
Cliente → cadastro.html → POST /api/auth/register → Banco de Dados
```

**Dados salvos:**
- Nome, email, telefone, empresa
- Senha (hash bcrypt)
- Plano escolhido
- Status: `pending` (aguardando pagamento)
- Limite de buscas conforme plano

### 2. Login
```
Cliente → login.html → POST /api/auth/login → Verifica senha → Gera JWT
```

**Token JWT contém:**
- ID do usuário
- Email
- Plano
- Validade: 7 dias

### 3. Acesso ao Dashboard
```
Cliente → dashboard.html → Verifica token no localStorage → Libera acesso
```

---

## 🔒 Proteção de Rotas

### Rotas Públicas (sem autenticação)
- `GET /` - Health check
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `GET /api/geocode` - Geocoding

### Rotas Protegidas (requerem token)
- `GET /api/auth/profile` - Perfil do usuário
- Futuras rotas de busca podem ser protegidas

### Como Proteger uma Rota

```javascript
app.get('/api/rota-protegida', authenticateToken, async (req, res) => {
  // req.user contém os dados do token
  const userId = req.user.id;
  // ...
});
```

---

## 💳 Próximos Passos (Integração de Pagamento)

### 1. Adicionar Gateway de Pagamento
- Mercado Pago
- PagSeguro
- Stripe

### 2. Webhook de Confirmação
Quando o pagamento for confirmado:
```javascript
// Atualizar status do usuário
UPDATE users SET status = 'active' WHERE id = ?
```

### 3. Controle de Uso
Incrementar contador de buscas:
```javascript
UPDATE users SET searches_used = searches_used + 1 WHERE id = ?
```

Verificar limite:
```javascript
if (user.searches_used >= user.searches_limit) {
  return res.status(403).json({ error: 'Limite de buscas atingido' });
}
```

---

## 🧪 Testando o Sistema

### 1. Acesse a Landing Page
```
http://76.13.173.70/
```

### 2. Crie uma Conta
```
http://76.13.173.70/cadastro.html
```

### 3. Faça Login
```
http://76.13.173.70/login.html
```

### 4. Acesse o Dashboard
```
http://76.13.173.70/dashboard.html
```

---

## 📝 Estrutura do Banco

```sql
users
├── id (SERIAL PRIMARY KEY)
├── nome (VARCHAR)
├── email (VARCHAR UNIQUE)
├── senha_hash (VARCHAR)
├── telefone (VARCHAR)
├── empresa (VARCHAR)
├── plano (VARCHAR) - basico, profissional, enterprise
├── status (VARCHAR) - pending, active, suspended
├── searches_used (INTEGER)
├── searches_limit (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## 🐛 Troubleshooting

### Erro: "bcryptjs not found"
```bash
npm install bcryptjs jsonwebtoken
```

### Erro: "Table users does not exist"
```bash
psql -h 76.13.173.70 -U admin -d suphelp_geo -f src/setup_users_table.sql
```

### Erro: "JWT_SECRET is not defined"
Verifique o arquivo `.env`:
```bash
cat .env | grep JWT_SECRET
```

### Token expirado
O token expira em 7 dias. Faça login novamente.

---

## ✅ Checklist de Deploy

- [ ] Fazer `git pull` no servidor
- [ ] Executar `npm install`
- [ ] Criar tabela `users` no banco
- [ ] Verificar `JWT_SECRET` no `.env`
- [ ] Reiniciar servidor Node.js
- [ ] Testar cadastro
- [ ] Testar login
- [ ] Testar acesso ao dashboard

---

**Sistema pronto para uso!** 🎉
