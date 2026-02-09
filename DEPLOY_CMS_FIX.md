# 🚀 Deploy da Correção do CMS

## PROBLEMA RESOLVIDO
- ✅ Todas as seções do CMS agora refletem no site principal
- ✅ Removido código duplicado do server.js
- ✅ Implementação completa do sistema dinâmico

## COMANDOS PARA EXECUTAR NO SERVIDOR LINUX

### 1. Conectar ao servidor
```bash
ssh dev@76.13.173.70
cd ~/suphelp-geo/backend
```

### 2. Fazer pull das alterações
```bash
git pull origin main
```

### 3. Garantir que a tabela CMS existe
```bash
node src/force_create_cms.js
```

### 4. Reiniciar o servidor
```bash
pm2 restart suphelp-geo
```

### 5. Verificar se está funcionando
```bash
pm2 logs suphelp-geo --lines 20
```

### 6. Testar no navegador
- Acesse: http://76.13.173.70:5000/admin.html
- Vá na seção "Editor do Site"
- Altere qualquer campo (ex: título do Hero)
- Clique em "Salvar Alterações"
- Abra nova aba: http://76.13.173.70:5000/
- Verifique se a alteração apareceu

## SEÇÕES QUE AGORA FUNCIONAM

### ✅ Header
- Logo e texto
- Itens do menu
- Botões de login/cadastro

### ✅ Hero
- Título principal
- Subtítulo
- Botões de ação
- Estatísticas (3 números)

### ✅ Features
- Título da seção
- 6 cards com ícones e textos

### ✅ Demo
- Título da seção
- 3 passos explicativos

### ✅ Plans
- Título da seção
- 3 planos com preços
- Badge "Mais Popular"

### ✅ CTA
- Título
- Subtítulo
- Botão de ação

### ✅ Footer
- Nome da empresa
- Descrição
- Copyright

## ARQUIVOS ALTERADOS
- `src/server.js` - Rota principal simplificada
- `src/dynamic_page.js` - Módulo completo (NOVO)
- `src/force_create_cms.js` - Script de criação da tabela

## SE DER ERRO
1. Verificar logs: `pm2 logs suphelp-geo`
2. Recriar tabela: `node src/force_create_cms.js`
3. Reiniciar: `pm2 restart suphelp-geo`
4. Verificar porta: `netstat -tlnp | grep 5000`