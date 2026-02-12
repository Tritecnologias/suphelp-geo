# Troubleshooting - Features Não Aparecem

## Problema
Você alterou o código mas não vê diferença na tela do admin ou na landing page.

## Diagnóstico Passo a Passo

### 1. Verificar se o código foi commitado e enviado ao Git

```bash
# No seu computador local (Windows)
git status
git log --oneline -5
```

Deve mostrar os commits recentes incluindo:
- `feat: Implementa carregamento dinâmico de configurações na seção Features`

### 2. Verificar se o servidor tem o código atualizado

```bash
# No servidor Linux
cd ~/suphelp-geo
git log --oneline -5
```

Se não mostrar os commits recentes, faça:
```bash
git pull origin main
```

### 3. Fazer o BUILD no servidor (CRÍTICO!)

```bash
# No servidor Linux
cd ~/suphelp-geo/frontend
npm run build
```

Aguarde o build terminar (pode levar 1-2 minutos).

### 4. Copiar o build para o backend

```bash
# No servidor Linux
cd ~/suphelp-geo
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/
```

### 5. Recarregar nginx e reiniciar aplicação

```bash
sudo systemctl reload nginx
pm2 restart suphelp-geo
```

### 6. Limpar cache do navegador

No navegador:
- Chrome/Edge: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5`
- Ou abra em aba anônima

### 7. Verificar se a API está retornando dados

Abra o console do navegador (F12) e execute:

```javascript
fetch('/api/cms/config')
  .then(r => r.json())
  .then(d => console.log('Features:', d.data?.features));
```

Deve mostrar algo como:
```json
{
  "title": { "value": "Recursos Poderosos" },
  "subtitle": { "value": "..." },
  "card_1_icon": { "value": "📍" },
  "card_1_title": { "value": "Busca por Endereço" },
  ...
}
```

### 8. Verificar se o componente está usando o contexto

No console do navegador, na página inicial, execute:

```javascript
// Verificar se o React está carregado
console.log('React:', typeof React !== 'undefined');

// Verificar se há erros no console
console.log('Erros:', performance.getEntriesByType('error'));
```

## Soluções Comuns

### Problema: "Não vejo os ícones Lucide, só emojis"

**Causa**: O banco de dados tem emojis salvos (📍, 📥, etc.)

**Solução**: 
1. Acesse `/admin`
2. Vá na aba "Recursos"
3. Altere os ícones para nomes Lucide:
   - Card 1: `MapPin`
   - Card 2: `Download`
   - Card 3: `FileText`
   - Card 4: `Target`
4. Clique em "Salvar Tudo"
5. Recarregue a landing page

### Problema: "Os campos no admin estão vazios"

**Causa**: Não há dados salvos no banco para a seção features

**Solução**: Use o arquivo de teste `test-features-api.html`

1. Copie o arquivo para `backend/public/`
2. Acesse `http://seu-dominio.com/test-features-api.html`
3. Faça login no admin primeiro
4. Clique em "Salvar Features de Teste"
5. Recarregue o admin

### Problema: "Erro 401 ao buscar configurações"

**Causa**: A rota `/api/cms/config` requer autenticação

**Solução**: Verificar se a rota está pública no backend

```javascript
// Em backend/src/server.js
// Esta rota DEVE estar ANTES das rotas autenticadas
app.get('/api/cms/config', async (req, res) => {
  // ... código da rota
});
```

### Problema: "Build demora muito ou falha"

**Causa**: Falta de memória ou dependências

**Solução**:
```bash
# Limpar cache do npm
cd ~/suphelp-geo/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Checklist Final

- [ ] Código commitado e enviado ao Git
- [ ] `git pull` executado no servidor
- [ ] `npm run build` executado no servidor
- [ ] Build copiado para `backend/public/react-build/`
- [ ] Nginx recarregado
- [ ] PM2 reiniciado
- [ ] Cache do navegador limpo
- [ ] Dados salvos no banco via admin
- [ ] Ícones alterados de emoji para nomes Lucide

## Teste Rápido

Execute este comando no servidor para fazer tudo de uma vez:

```bash
cd ~/suphelp-geo && \
git pull origin main && \
cd frontend && \
npm run build && \
cd .. && \
rm -rf backend/public/react-build && \
mkdir -p backend/public/react-build && \
cp -r frontend/dist/* backend/public/react-build/ && \
sudo systemctl reload nginx && \
pm2 restart suphelp-geo && \
echo "✅ Deploy concluído!"
```

Depois:
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Acesse o admin
3. Altere os ícones para nomes Lucide
4. Salve
5. Veja a landing page

## Ainda não funciona?

Envie os logs:

```bash
# Logs do PM2
pm2 logs suphelp-geo --lines 50

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Status do PM2
pm2 status

# Verificar se o build existe
ls -la ~/suphelp-geo/backend/public/react-build/
```
