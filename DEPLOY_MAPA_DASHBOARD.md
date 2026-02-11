# Deploy - Mapa Integrado no Dashboard

## O que foi implementado

✅ Mapa Google Maps integrado ao DashboardPage
✅ Layout estilo CondoFinder: sidebar esquerda + mapa direita
✅ Carregamento dinâmico da API Key do backend (seguro)
✅ Marcadores sincronizados com resultados da busca
✅ Clique no resultado da lista centraliza no mapa
✅ InfoWindows com detalhes ao clicar nos marcadores
✅ Todas as funcionalidades existentes mantidas: busca, filtros, exportação Excel/PDF

## Comandos para executar no servidor Linux

```bash
# 1. Conectar ao servidor
ssh dev@76.13.173.70

# 2. Navegar para o diretório do projeto
cd ~/suphelp-geo

# 3. Parar o servidor
pm2 stop suphelp-geo

# 4. Atualizar código do Git
git pull origin main

# 5. Build do frontend
cd frontend
npm run build
cd ..

# 6. Copiar build para o backend
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/

# 7. Reiniciar servidor
pm2 restart suphelp-geo

# 8. Verificar logs
pm2 logs suphelp-geo --lines 50
```

## Verificação

Após o deploy, acesse:
- http://76.13.173.70:5000/dashboard

Você deve ver:
- Sidebar esquerda com busca, filtros e lista de resultados
- Mapa grande à direita ocupando toda a altura
- Ao fazer uma busca, marcadores aparecem no mapa
- Ao clicar em um resultado da lista, o mapa centraliza naquele local
- Botões de exportação Excel/PDF funcionando

## Troubleshooting

Se o mapa não carregar:
1. Verificar se `GOOGLE_MAPS_API_KEY` está no `.env` do servidor
2. Verificar endpoint `/api/config` retorna a chave
3. Verificar console do navegador para erros

Se houver erro 403 no admin:
- Usuário precisa limpar localStorage e fazer login novamente para pegar novo token JWT

## Arquivos modificados

- `frontend/src/pages/DashboardPage.tsx` - Adicionado mapa integrado
- Layout mudou de página única para sidebar + mapa
- Mantidas todas as funcionalidades: busca, filtros, exportação, stats

## Próximos passos

- Testar no servidor
- Verificar responsividade
- Ajustar zoom/centralização se necessário
