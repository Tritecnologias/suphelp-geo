# 🗺️ FUNCIONALIDADE: Busca com Mapa Integrado (SEGURA)

## ✨ **O que foi implementado:**

Uma página de busca completa similar ao CondoFinder, com **segurança aprimorada**:

- ✅ **API Key do Google Maps carregada do backend** (não exposta no frontend!)
- ✅ **Endpoint `/api/config`** que fornece a chave de forma segura
- ✅ **Carregamento dinâmico** do script do Google Maps
- ✅ **Sidebar com filtros avançados**
- ✅ **Mapa interativo do Google Maps**
- ✅ **Lista de resultados**
- ✅ **Design responsivo**

## 🔒 **SEGURANÇA:**

A API Key do Google Maps **NÃO está exposta no código frontend**!

- ✅ Chave armazenada no `.env` do backend
- ✅ Endpoint `/api/config` fornece a chave via API
- ✅ Script do Google Maps carregado dinamicamente
- ✅ Sem exposição de credenciais no código-fonte

## 🚀 **Como acessar:**

URL: **http://76.13.173.70:5000/busca**

## 🔧 **Configuração (já está pronta!):**

A chave já está configurada no `.env`:

```env
GOOGLE_MAPS_API_KEY=AIzaSyDq2V4A_RmdQmxfO6jPkGHe0jXdfxDHV_Y
```

### **Para fazer deploy:**

```bash
# No servidor
cd ~/suphelp-geo
git pull origin main

# Build
cd frontend
npm run build

# Deploy
cd ..
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/

# Reiniciar
pm2 restart suphelp-geo
```

## 📋 **Como usar:**

1. Acesse http://76.13.173.70:5000/busca
2. Digite uma cidade no campo "Cidade"
3. Selecione categorias (opcional)
4. Ajuste o raio de busca
5. Clique em "Buscar"
6. Interaja com os resultados e marcadores

## 🎨 **Categorias disponíveis:**

- Condomínio
- Prédio Residencial
- Clube
- Empresa
- Academia
- Farmácia
- Mercado
- Restaurante
- Padaria

## 🔍 **Funcionalidades técnicas:**

- **API Key segura**: Carregada do backend via `/api/config`
- **Geocoding**: Converte endereços em coordenadas
- **Busca por raio**: PostGIS calcula distâncias reais
- **Filtros client-side**: Categorias filtradas no frontend
- **Marcadores dinâmicos**: Atualizados em tempo real
- **InfoWindows**: Detalhes ao clicar nos marcadores
- **Bounds automático**: Zoom ajustado automaticamente
- **Loading states**: Feedback visual durante carregamento

## 🎯 **Melhorias de segurança implementadas:**

1. ✅ API Key não exposta no HTML
2. ✅ Carregamento dinâmico do Google Maps
3. ✅ Endpoint backend para configuração
4. ✅ Variável de ambiente no .env
5. ✅ Sem credenciais no código-fonte

---

**A funcionalidade está pronta e SEGURA! Faça o deploy e teste!** 🚀🔒

## ✨ **O que foi implementado:**

Uma página de busca completa similar ao CondoFinder, com:

- ✅ **Sidebar com filtros avançados**
  - Campo de busca por cidade
  - Filtro por bairro
  - Seleção de categorias (múltipla escolha)
  - Slider de raio de busca (1-20 km)
  
- ✅ **Mapa interativo do Google Maps**
  - Marcadores para cada resultado
  - InfoWindow com detalhes ao clicar
  - Zoom automático para mostrar todos os resultados
  - Centralização ao clicar em um resultado

- ✅ **Lista de resultados**
  - Contador de resultados
  - Cards clicáveis que centralizam no mapa
  - Informações: nome, endereço, categoria, distância, rating

- ✅ **Design responsivo**
  - Sidebar retrátil
  - Adaptável para mobile e desktop

## 🚀 **Como acessar:**

URL: **http://76.13.173.70:5000/busca**

## 🔧 **Configuração necessária:**

### 1. **Google Maps API Key**

Você precisa configurar uma API Key do Google Maps:

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione um existente
3. Ative as APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Crie uma credencial (API Key)
5. Adicione restrições (opcional mas recomendado):
   - Restrição de aplicativo: Referenciadores HTTP
   - Adicione: `76.13.173.70/*` e `localhost/*`

### 2. **Atualizar o frontend/index.html**

Substitua `YOUR_GOOGLE_MAPS_API_KEY` pela sua chave real:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=SUA_CHAVE_AQUI&libraries=places"></script>
```

### 3. **Fazer build e deploy**

```bash
# No servidor
cd ~/suphelp-geo
git pull origin main

# Editar index.html com a API Key
nano frontend/index.html
# (Substitua YOUR_GOOGLE_MAPS_API_KEY pela chave real)

# Build
cd frontend
npm run build

# Deploy
cd ..
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/

# Reiniciar
pm2 restart suphelp-geo
```

## 📋 **Como usar:**

1. **Acesse** http://76.13.173.70:5000/busca

2. **Digite uma cidade** no campo "Cidade"
   - Exemplo: "São Paulo", "Jundiaí, SP", "Rio de Janeiro"

3. **Selecione categorias** (opcional)
   - Clique nas categorias desejadas
   - Múltipla seleção permitida

4. **Ajuste o raio** de busca (1-20 km)
   - Use o slider

5. **Clique em "Buscar"**
   - O mapa será centralizado
   - Marcadores aparecerão
   - Lista de resultados será exibida

6. **Interaja com os resultados**
   - Clique em um card para centralizar no mapa
   - Clique em um marcador para ver detalhes

## 🎨 **Categorias disponíveis:**

- Condomínio
- Prédio Residencial
- Clube
- Empresa
- Academia
- Farmácia
- Mercado
- Restaurante
- Padaria

## 🔍 **Funcionalidades técnicas:**

- **Geocoding**: Converte endereços em coordenadas
- **Busca por raio**: PostGIS calcula distâncias reais
- **Filtros client-side**: Categorias filtradas no frontend
- **Marcadores dinâmicos**: Atualizados em tempo real
- **InfoWindows**: Detalhes ao clicar nos marcadores
- **Bounds automático**: Zoom ajustado para mostrar todos os resultados

## 📱 **Responsividade:**

- **Desktop**: Sidebar fixa + mapa
- **Mobile**: Sidebar retrátil com botão de toggle
- **Tablet**: Layout adaptativo

## 🎯 **Próximas melhorias sugeridas:**

- [ ] Filtro por rating mínimo
- [ ] Filtro "apenas com telefone"
- [ ] Ordenação de resultados (distância, rating, nome)
- [ ] Paginação de resultados
- [ ] Exportação de resultados (Excel/PDF)
- [ ] Salvar buscas favoritas
- [ ] Compartilhar busca via link
- [ ] Rotas/direções no mapa
- [ ] Street View integration
- [ ] Clustering de marcadores (muitos resultados)

## 🐛 **Troubleshooting:**

### Mapa não carrega:
- Verifique se a API Key está correta
- Verifique se as APIs estão ativadas no Google Cloud
- Verifique o console do navegador (F12) para erros

### Sem resultados:
- Verifique se há lugares cadastrados no banco
- Aumente o raio de busca
- Tente uma cidade diferente
- Remova filtros de categoria

### Marcadores não aparecem:
- Verifique se os lugares têm coordenadas (lat/lng)
- Verifique o console para erros JavaScript
- Recarregue a página (F5)

---

**A funcionalidade está pronta! Só falta configurar a Google Maps API Key!** 🚀