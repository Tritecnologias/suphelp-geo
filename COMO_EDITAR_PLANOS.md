# Como Editar Planos e Features no CMS

## Campos Disponíveis na Aba "Preços"

### Seção Principal
- **Título da Seção**: Ex: "Escolha Seu Plano"
- **Subtítulo**: Ex: "Planos flexíveis para todas as necessidades"

### Para Cada Plano (Básico, Profissional, Enterprise)

#### Informações Básicas
- **Nome**: Nome do plano (ex: "Básico", "Profissional", "Enterprise")
- **Preço**: Valor do plano (ex: "R$ 49", "49", "$49")
- **Período**: Periodicidade (ex: "/mês", "/ano", "por mês")
- **Descrição**: Texto curto descrevendo o plano (ex: "Ideal para pequenos negócios")

#### Features (Recursos)

##### Features Incluídas (Check Verde ✓)
Digite uma feature por linha, começando com ✓:

```
✓ 100 buscas por mês
✓ Exportação Excel
✓ Exportação PDF
✓ Suporte por email
```

##### Features Não Incluídas (X Vermelho ✗)
Digite uma feature por linha, começando com ✗:

```
✗ API Access
✗ Relatórios personalizados
```

## Exemplo Completo - Plano Básico

### Campos:
- **Nome**: `Básico`
- **Preço**: `R$ 49`
- **Período**: `/mês`
- **Descrição**: `Ideal para pequenos negócios`

### Features Incluídas:
```
✓ 100 buscas por mês
✓ Exportação Excel
✓ Exportação PDF
✓ Suporte por email
```

### Features Não Incluídas:
```
✗ API Access
✗ Relatórios personalizados
```

## Exemplo Completo - Plano Profissional

### Campos:
- **Nome**: `Profissional`
- **Preço**: `R$ 149`
- **Período**: `/mês`
- **Descrição**: `Para empresas em crescimento`

### Features Incluídas:
```
✓ 1.000 buscas por mês
✓ Exportação Excel
✓ Exportação PDF
✓ Suporte prioritário
✓ API Access
✓ Relatórios personalizados
```

### Features Não Incluídas:
```
(deixe vazio se todas as features estão incluídas)
```

## Exemplo Completo - Plano Enterprise

### Campos:
- **Nome**: `Enterprise`
- **Preço**: `R$ 499`
- **Período**: `/mês`
- **Descrição**: `Para grandes organizações`

### Features Incluídas:
```
✓ Buscas ilimitadas
✓ Exportação Excel
✓ Exportação PDF
✓ Suporte 24/7
✓ API Access completo
✓ Relatórios personalizados
✓ Integração customizada
✓ Treinamento dedicado
```

### Features Não Incluídas:
```
(deixe vazio se todas as features estão incluídas)
```

## Dicas Importantes

### Símbolos Aceitos

**Para features incluídas (check verde):**
- ✓ (recomendado)
- ✔
- ☑

**Para features não incluídas (X vermelho):**
- ✗ (recomendado)
- ✘
- ☒
- ×

### Formatação

1. **Uma feature por linha**: Cada linha representa uma feature
2. **Símbolo no início**: Sempre comece a linha com ✓ ou ✗
3. **Texto após o símbolo**: O sistema remove o símbolo automaticamente
4. **Linhas vazias**: São ignoradas automaticamente

### Exemplos de Formatação

✅ **CORRETO:**
```
✓ 100 buscas por mês
✓ Exportação Excel
✗ API Access
```

❌ **INCORRETO:**
```
100 buscas por mês ✓
Exportação Excel (incluído)
API Access - não incluído
```

## Como Salvar

1. Preencha todos os campos desejados
2. Clique no botão **"Salvar Tudo"** no topo da página
3. Aguarde a mensagem de confirmação
4. Acesse a landing page para ver as alterações

## Visualização na Landing Page

Após salvar, os planos aparecerão assim:

```
┌─────────────────────────┐
│       Básico            │
│ Ideal para pequenos...  │
│                         │
│      R$ 49 /mês         │
│                         │
│ ✓ 100 buscas por mês    │
│ ✓ Exportação Excel      │
│ ✓ Exportação PDF        │
│ ✓ Suporte por email     │
│ ✗ API Access            │
│ ✗ Relatórios...         │
│                         │
│     [Começar]           │
└─────────────────────────┘
```

## Troubleshooting

### Features não aparecem
- Verifique se você colocou ✓ ou ✗ no início de cada linha
- Certifique-se de que salvou as alterações
- Limpe o cache do navegador (Ctrl+Shift+R)

### Formatação estranha
- Use apenas uma feature por linha
- Não use vírgulas ou pontos no final
- Mantenha o texto simples e direto

### Plano não atualiza
- Verifique se fez o build no servidor
- Confirme que o deploy foi executado
- Verifique os logs do PM2

## Deploy

Após editar os planos, execute no servidor:

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
pm2 restart suphelp-geo
```
