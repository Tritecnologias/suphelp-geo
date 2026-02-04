# 🧪 Guia de Testes - Diego

## 🎯 Como Testar a API sem Entrar no Shell

Criamos uma **interface web simples** para você testar todos os endpoints da API diretamente no navegador, sem precisar usar comandos ou entrar via SSH no servidor.

---

## 🌐 Acessar a Interface Web

### Opção 1: Servidor em Produção (76.13.173.70)
```
http://76.13.173.70:5000/
```

### Opção 2: Localmente (se estiver rodando na sua máquina)
```
http://localhost:5000/
```

---

## 📋 O Que Você Vai Ver

A interface tem **8 cards principais** para testar:

### 1. ✅ Health Check
- **O que faz:** Verifica se a API está online
- **Como testar:** Clique em "Testar Conexão"
- **Resultado esperado:** `{ "message": "SupHelp Geo API - Sistema Operacional 🚀" }`

### 2. 📋 Listar Lugares
- **O que faz:** Lista todos os lugares cadastrados
- **Como testar:** 
  - Escolha quantos lugares quer ver (padrão: 10)
  - Clique em "Listar"
- **Resultado esperado:** Lista com lugares, endereços, coordenadas

### 3. 🔍 Buscar por ID
- **O que faz:** Busca um lugar específico pelo ID
- **Como testar:**
  - Digite o ID do lugar (ex: 1, 2, 3...)
  - Clique em "Buscar"
- **Resultado esperado:** Detalhes completos do lugar

### 4. 📍 Busca por Raio
- **O que faz:** Busca lugares próximos a uma coordenada
- **Como testar:**
  - Latitude: `-23.1865` (Centro de Jundiaí)
  - Longitude: `-46.8917`
  - Raio: `5000` metros (5km)
  - Clique em "Buscar Próximos"
- **Resultado esperado:** Lugares ordenados por distância

### 5. 🔎 Busca Avançada
- **O que faz:** Busca com múltiplos filtros
- **Como testar:**
  - Digite um nome (ex: "Padaria")
  - Ou categoria (ex: "farmácia")
  - Ou rating mínimo (ex: 4.0)
  - Clique em "Buscar"
- **Resultado esperado:** Lugares filtrados

### 6. ➕ Criar Lugar
- **O que faz:** Adiciona um novo lugar no banco
- **Como testar:**
  - Nome: "Teste Diego"
  - Endereço: "Rua Teste, 123"
  - Categoria: "Teste"
  - Latitude: `-23.1865`
  - Longitude: `-46.8917`
  - Clique em "Criar"
- **Resultado esperado:** Lugar criado com sucesso

### 7. 🌍 Importar Places API
- **O que faz:** Busca lugares via Google Places API
- **Como testar:**
  - Cidade: "Jundiaí, SP"
  - Keywords: "farmácia" (ou "mercado", "padaria")
  - Máximo: 5 (para não gastar muita API)
  - Clique em "Importar"
- **Resultado esperado:** Estatísticas de importação (success, duplicates, errors)

### 8. 📞 Enriquecer Contatos
- **O que faz:** Adiciona telefone, website e rating aos lugares
- **Como testar:**
  - Limite: 5 (quantos lugares enriquecer)
  - Clique em "Enriquecer"
- **Resultado esperado:** Estatísticas de enriquecimento

---

## 📊 Estatísticas do Banco

No final da página, você verá 3 cards com estatísticas:

- **Total de Lugares:** Quantos lugares estão cadastrados
- **Com Telefone:** Quantos foram enriquecidos com telefone
- **Com Rating:** Quantos têm avaliação do Google

Clique em "Atualizar Estatísticas" para ver os números atualizados.

---

## 🎨 Cores e Badges

A interface usa cores para facilitar:

- **Verde (GET):** Buscar/Listar dados
- **Azul (POST):** Criar/Importar dados
- **Laranja (PUT):** Atualizar dados
- **Vermelho (DELETE):** Deletar dados

---

## ✅ Checklist de Testes

Teste nesta ordem para validar tudo:

1. [ ] **Health Check** - Verifica se API está online
2. [ ] **Listar Lugares** - Vê quantos lugares já existem
3. [ ] **Buscar por ID** - Testa busca de um lugar específico
4. [ ] **Criar Lugar** - Adiciona um lugar de teste
5. [ ] **Busca por Raio** - Testa busca geoespacial
6. [ ] **Busca Avançada** - Testa filtros
7. [ ] **Importar Places API** - Importa 5 farmácias (cuidado com API)
8. [ ] **Enriquecer Contatos** - Enriquece 5 lugares
9. [ ] **Estatísticas** - Verifica números atualizados

---

## 🐛 Problemas Comuns

### "API Offline" no topo da página
**Causa:** Servidor não está rodando ou porta 5000 bloqueada

**Solução:**
```bash
# Conectar no servidor
ssh root@76.13.173.70

# Verificar se está rodando
pm2 status

# Se não estiver, iniciar
pm2 start src/server.js --name suphelp-backend

# Verificar logs
pm2 logs suphelp-backend
```

### "Erro ao buscar dados"
**Causa:** Banco de dados não está acessível

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
npm run test-connection
```

### "HTTP 429 - Too Many Requests" no Import
**Causa:** Muitas requisições à API do Google

**Solução:** Aguarde 1 minuto e tente novamente com menos resultados (maxResults: 5)

---

## 📱 Testando de Outros Dispositivos

A interface funciona em qualquer dispositivo:

- **Computador:** Acesse `http://76.13.173.70:5000/`
- **Celular:** Acesse o mesmo endereço no navegador
- **Tablet:** Funciona perfeitamente

---

## 🔒 Segurança

⚠️ **IMPORTANTE:** Esta interface é apenas para testes!

- Não tem autenticação (qualquer um pode acessar)
- Não use em produção sem adicionar login
- Recomendamos adicionar autenticação JWT na Fase 2

---

## 📞 Suporte

Se tiver qualquer problema:

1. Tire um print da tela
2. Copie a mensagem de erro (se houver)
3. Me envie para eu ajudar

---

## 🎯 Próximos Passos Após Testes

Depois de validar que tudo funciona:

1. ✅ Confirmar que API está estável
2. ✅ Validar performance (tempo de resposta)
3. ✅ Testar com dados reais (importar mais lugares)
4. ✅ Preparar para Fase 2 (Frontend React)

---

## 💡 Dicas

- **Comece pelo Health Check** para garantir que está tudo online
- **Use "Importar Places API" com cuidado** (cada keyword = 1 chamada à API)
- **Enriqueça poucos lugares por vez** (5-10) para não gastar API
- **Atualize as estatísticas** após cada importação/enriquecimento

---

**Tempo estimado de testes:** 10-15 minutos

**Dificuldade:** Muito fácil (só clicar nos botões)

**Resultado esperado:** Todos os 8 testes funcionando perfeitamente

---

## 🚀 Está Pronto!

Agora é só acessar `http://76.13.173.70:5000/` e começar a testar!

Qualquer dúvida, estou aqui para ajudar. 😊
