# Deploy - Features Dinâmicos com Ícones Lucide

## O que foi implementado

✅ Seção Features agora carrega configurações do banco de dados
✅ Suporte a ícones Lucide React profissionais
✅ Editor CMS permite alterar título, subtítulo e 4 cards
✅ Cada card tem: ícone, título e descrição editáveis
✅ Fallback automático para valores padrão

## Comandos de Deploy no Servidor

Execute os comandos abaixo no servidor Linux:

```bash
# 1. Navegar para o diretório do projeto
cd ~/suphelp-geo

# 2. Fazer pull das alterações
git pull origin main

# 3. Navegar para o frontend
cd frontend

# 4. Fazer build do React
npm run build

# 5. Voltar para raiz
cd ..

# 6. Remover build antigo
rm -rf backend/public/react-build

# 7. Criar diretório
mkdir -p backend/public/react-build

# 8. Copiar novo build
cp -r frontend/dist/* backend/public/react-build/

# 9. Recarregar nginx
sudo systemctl reload nginx

# 10. Reiniciar aplicação (se necessário)
pm2 restart suphelp-geo
```

## Como Testar

1. Acesse o painel admin: `https://seu-dominio.com/admin`
2. Faça login com suas credenciais
3. Clique na aba **Recursos**
4. Você verá os campos:
   - Título da Seção
   - Subtítulo
   - 4 Cards com: Ícone, Título e Descrição

5. Teste alterando os ícones:
   - Card 1: `Navigation`
   - Card 2: `Database`
   - Card 3: `Zap`
   - Card 4: `BarChart3`

6. Clique em **Salvar Tudo**
7. Acesse a landing page e veja as alterações

## Ícones Disponíveis

Consulte o arquivo `ICONES_LUCIDE_DISPONIVEIS.md` para ver a lista completa de ícones.

### Exemplos de ícones populares:
- `MapPin` - Localização
- `Download` - Download
- `FileText` - Documento
- `Target` - Alvo
- `Phone` - Telefone
- `Mail` - Email
- `Users` - Usuários
- `Database` - Banco de dados
- `Zap` - Velocidade
- `BarChart3` - Gráficos
- `Search` - Busca
- `Settings` - Configurações

## Troubleshooting

### Alterações não aparecem na landing page
```bash
# Verificar se o build foi copiado corretamente
ls -la backend/public/react-build/

# Verificar logs do nginx
sudo tail -f /var/log/nginx/error.log

# Limpar cache do navegador (Ctrl+Shift+R)
```

### Ícones não aparecem
- Verifique se o nome do ícone está correto (case sensitive)
- Use nomes como `MapPin`, `Download`, não `mappin` ou `download`
- Se o ícone não existir, o sistema usa `MapPin` como padrão

### Campos não carregam valores salvos
```bash
# Verificar se o backend está rodando
pm2 status

# Verificar logs do backend
pm2 logs suphelp-geo --lines 50

# Testar endpoint de configurações
curl http://localhost:5000/api/cms/config
```

## Próximos Passos

Após o deploy bem-sucedido:
1. ✅ Features dinâmicos funcionando
2. 🔄 Próximo: Implementar seção Pricing dinâmica
3. 🔄 Próximo: Adicionar mais opções de customização

## Arquivos Alterados

- `frontend/src/components/Features.tsx` - Componente com carregamento dinâmico
- `frontend/src/contexts/SiteConfigContext.tsx` - Contexto com dados de features
- `frontend/src/components/CMSEditor.tsx` - Editor com aba de recursos
- `ICONES_LUCIDE_DISPONIVEIS.md` - Documentação de ícones
