# Deploy da Nova Interface de Busca de Condomínios

## O que foi feito

✅ Nova interface de busca criada baseada na imagem fornecida
✅ Backup da versão anterior salvo em `DashboardPage.backup.tsx`
✅ Tipo User atualizado com propriedade `role`
✅ Build do frontend realizado com sucesso
✅ Arquivos copiados para `backend/public/react-build`
✅ Commit e push realizados

## Comandos para executar no servidor Linux

```bash
# 1. Conectar ao servidor
ssh root@76.13.173.70

# 2. Navegar para o diretório do projeto
cd ~/suphelp-geo

# 3. Fazer pull das alterações
git pull origin main

# 4. Fazer build do frontend NO SERVIDOR
cd frontend
npm run build
cd ..

# 5. Remover build antigo e copiar novo
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/

# 6. Recarregar nginx
sudo systemctl reload nginx

# 7. Verificar se o PM2 está rodando (opcional)
pm2 list

# 8. Se necessário, reiniciar o backend
pm2 restart suphelp-geo

# 9. Verificar logs
pm2 logs suphelp-geo --lines 50
```

## Verificação

Após o deploy, acesse:
- http://76.13.173.70/dashboard

## Funcionalidades da Nova Interface

### Campos de Busca
- **Estado**: Dropdown com todos os estados brasileiros
- **Cidade**: Campo de texto livre
- **Bairro 1**: Campo de texto livre
- **Bairro 2**: Campo de texto livre (opcional)

### Categorias (múltipla seleção)
- 🏢 Condomínio
- 🏢 Prédio Corporativo
- 💼 Empresa
- 🏥 Hospital
- 🎓 Universidade
- 💪 Academia

### Raio de Busca
- Slider de 0 a 20 km
- Valor padrão: 5 km

### Concorrentes Próximos (checkboxes)
- 🛒 Supermercado
- 🏪 Atacadão

### Resultados
- Lista com cards mostrando:
  - Número sequencial
  - Nome do estabelecimento
  - Endereço completo
  - Categoria (badge azul)
  - Distância em km
  - Rating (se disponível)

## Layout

- Design limpo e moderno
- Cards brancos com sombras
- Gradientes azuis no header
- Ícones Lucide para cada categoria
- Totalmente responsivo (mobile-first)
- Botão verde de busca destacado

## Observações

- A versão anterior foi salva em `DashboardPage.backup.tsx`
- Para voltar à versão anterior, basta renomear os arquivos
- O backend já suporta todos os filtros necessários
- A busca sempre usa geocoding + nearby com filtros

## Próximos Passos (se necessário)

1. Implementar lógica de concorrentes próximos (buscar supermercados/atacadões no raio)
2. Adicionar mapa interativo (se solicitado)
3. Melhorar exportação de resultados
4. Adicionar mais filtros avançados

## Rollback (se necessário)

Se precisar voltar à versão anterior:

```bash
# No servidor
cd ~/suphelp-geo/frontend/src/pages

# Fazer backup da nova versão
mv DashboardPage.tsx DashboardPage.new.tsx

# Restaurar versão anterior
mv DashboardPage.backup.tsx DashboardPage.tsx

# Rebuild
cd ~/suphelp-geo/frontend
npm run build

# Copiar para backend
cd ~/suphelp-geo
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/

# Recarregar nginx
sudo systemctl reload nginx
```
