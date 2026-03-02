# Deploy da Funcionalidade de Upload CSV

## Resumo
Implementada a funcionalidade de upload de arquivos CSV no painel administrativo. O admin pode fazer upload de um arquivo CSV e os dados serão importados automaticamente para o banco de dados.

## O que foi implementado

### Backend (server.js)
- ✅ Rota `POST /api/import-csv-upload` que:
  - Recebe arquivo CSV via multer
  - Salva temporariamente em `uploads/`
  - Chama `worker_csv.py` passando o caminho do arquivo
  - Processa stdout/stderr do Python
  - Remove arquivo temporário após processamento
  - Retorna JSON com sucesso e quantidade de registros importados

### Frontend (AdminPage.tsx)
- ✅ Interface de upload na seção "Importar"
- ✅ Input file que aceita apenas .csv
- ✅ Função `handleCSVUpload` que envia FormData para backend
- ✅ Feedback visual com mensagens de sucesso/erro

### Worker Python (worker_csv.py)
- ✅ Já existente e funcional
- ✅ Aceita caminho do arquivo como argumento
- ✅ Lê CSV com pandas
- ✅ Insere dados no PostgreSQL

## Comandos para Deploy no Servidor

### 1. Conectar no servidor
```bash
ssh root@76.13.173.70
```

### 2. Fazer pull das mudanças
```bash
cd ~/suphelp-geo
git pull origin main
```

### 3. Instalar dependências Python (se ainda não instaladas)
```bash
pip3 install pandas psycopg2-binary googlemaps python-dotenv --break-system-packages
```

**Nota:** O flag `--break-system-packages` é necessário porque o Python 3.13 tem ambiente gerenciado.

### 4. Verificar se a pasta uploads existe
```bash
mkdir -p ~/suphelp-geo/uploads
chmod 755 ~/suphelp-geo/uploads
```

### 5. Fazer build do frontend
```bash
cd ~/suphelp-geo/frontend
npm run build
```

### 6. Copiar build para o backend
```bash
cd ~/suphelp-geo
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/
```

### 7. Reiniciar o backend
```bash
pm2 restart suphelp-geo
```

### 8. Verificar logs
```bash
pm2 logs suphelp-geo --lines 50
```

### 9. Recarregar nginx
```bash
sudo systemctl reload nginx
```

## Comando Único (Deploy Completo)
```bash
cd ~/suphelp-geo && \
git pull origin main && \
mkdir -p uploads && \
chmod 755 uploads && \
cd frontend && \
npm run build && \
cd .. && \
rm -rf backend/public/react-build && \
mkdir -p backend/public/react-build && \
cp -r frontend/dist/* backend/public/react-build/ && \
pm2 restart suphelp-geo && \
sudo systemctl reload nginx && \
echo "✅ Deploy concluído!"
```

## Como Testar

1. Acesse o painel admin: `http://76.13.173.70/admin`
2. Faça login com suas credenciais de admin
3. Vá para a seção "Importar"
4. Na seção "Importar via Planilha CSV", clique em "Escolher arquivo"
5. Selecione um arquivo CSV com o formato:
   ```csv
   name,address,category,lat,lon
   Padaria Central,Rua Principal 123,Padaria,-23.1858,-46.8978
   Mercado Bom Preço,Av Comercial 456,Mercado,-23.1900,-46.9000
   ```
6. O sistema processará automaticamente e mostrará mensagem de sucesso

## Formato do CSV

O arquivo CSV deve ter as seguintes colunas (header obrigatório):
- `name`: Nome do estabelecimento (obrigatório)
- `address`: Endereço completo (opcional)
- `category`: Categoria (opcional, padrão: "Importado")
- `lat`: Latitude (obrigatório)
- `lon`: Longitude (obrigatório)

## Troubleshooting

### Erro: "Apenas arquivos CSV são permitidos"
- Certifique-se de que o arquivo tem extensão .csv
- Verifique se o mimetype é text/csv

### Erro 500 ao fazer upload
- Verifique se as dependências Python estão instaladas:
  ```bash
  python3 -c "import pandas, psycopg2, googlemaps, dotenv; print('OK')"
  ```
- Verifique os logs do PM2:
  ```bash
  pm2 logs suphelp-geo --lines 100
  ```

### Arquivo não é processado
- Verifique se a pasta uploads existe e tem permissões corretas:
  ```bash
  ls -la ~/suphelp-geo/uploads
  ```
- Verifique se o worker_csv.py está funcionando:
  ```bash
  cd ~/suphelp-geo/backend
  python3 src/worker_csv.py ../import.csv
  ```

### Dados não aparecem no banco
- Verifique se o CSV está no formato correto
- Verifique se as coordenadas são válidas (lat: -90 a 90, lon: -180 a 180)
- Verifique os logs do Python no PM2

## Próximos Passos

1. ✅ Rota de upload implementada
2. ✅ Interface de upload implementada
3. ⏳ Instalar dependências Python no servidor
4. ⏳ Fazer deploy e testar
5. ⏳ Validar importação com arquivo CSV real

## Arquivos Modificados

- `backend/src/server.js` - Adicionada rota `/api/import-csv-upload`
- `frontend/src/pages/AdminPage.tsx` - Já tinha interface implementada
- `backend/src/worker_csv.py` - Já existente, sem modificações

## Commit
```
feat: adiciona rota de upload CSV no painel admin

- Implementa rota POST /api/import-csv-upload que recebe arquivo via multer
- Processa CSV usando worker_csv.py e retorna quantidade importada
- Remove arquivo temporário após processamento
- Interface de upload já implementada no AdminPage.tsx
```
