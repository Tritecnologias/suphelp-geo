# 🔧 Corrigir Importação Google Places API

## Problema

Erro 500 ao tentar importar dados via Google Places API no painel admin.

## Causa Provável

1. Python 3 não instalado no servidor
2. Dependências Python faltando (pandas, psycopg2, googlemaps)
3. API Key do Google Maps não configurada
4. Permissões de execução do script

## Solução

### 1. Verificar se Python está instalado

```bash
ssh root@76.13.173.70
python3 --version
```

Se não estiver instalado:

```bash
# Ubuntu/Debian
apt update
apt install python3 python3-pip -y

# CentOS/RHEL
yum install python3 python3-pip -y
```

### 2. Instalar dependências Python

```bash
cd ~/suphelp-geo
pip3 install pandas psycopg2-binary googlemaps python-dotenv
```

Ou usar o arquivo requirements.txt:

```bash
pip3 install -r requirements.txt
```

### 3. Verificar API Key do Google Maps

Editar o arquivo `.env`:

```bash
nano ~/suphelp-geo/.env
```

Verificar se existe:

```
GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

### 4. Testar o script Python manualmente

```bash
cd ~/suphelp-geo
python3 backend/src/worker_places_api.py "Jundiaí, SP" "farmácia,padaria,mercado" 20
```

### 5. Verificar logs do PM2

```bash
pm2 logs suphelp-geo --lines 50
```

Procurar por erros relacionados a Python.

## Alternativa: Importar CSV

Se a importação via Google Places API não funcionar, você pode:

### 1. Criar arquivo CSV

Criar `import.csv` na raiz do projeto:

```csv
name,address,category,lat,lon
Farmácia Central,Rua Principal 123,Farmácia,-23.1858,-46.8978
Padaria Pão Quente,Av Brasil 456,Padaria,-23.1900,-46.9000
Mercado Bom Preço,Rua Comercial 789,Mercado,-23.1950,-46.9050
```

### 2. Importar via API

```bash
curl -X POST http://76.13.173.70:5000/api/import-csv
```

### 3. Ou importar direto no banco

```bash
ssh root@76.13.173.70
cd ~/suphelp-geo
python3 backend/src/worker_csv.py import.csv
```

## Importação Manual via SQL

Se nada funcionar, você pode inserir dados direto no PostgreSQL:

```bash
ssh root@76.13.173.70
psql -h 76.13.173.70 -U admin -d suphelp_geo
```

```sql
INSERT INTO places (name, address, category, location)
VALUES 
  ('Farmácia Central', 'Rua Principal 123, Jundiaí - SP', 'Farmácia', 
   ST_SetSRID(ST_MakePoint(-46.8978, -23.1858), 4326)),
  ('Padaria Pão Quente', 'Av Brasil 456, Jundiaí - SP', 'Padaria',
   ST_SetSRID(ST_MakePoint(-46.9000, -23.1900), 4326)),
  ('Mercado Bom Preço', 'Rua Comercial 789, Jundiaí - SP', 'Mercado',
   ST_SetSRID(ST_MakePoint(-46.9050, -23.1950), 4326));
```

## Verificar Dados Importados

```sql
SELECT id, name, category, address, 
       ST_X(location) as longitude, 
       ST_Y(location) as latitude 
FROM places 
ORDER BY id DESC 
LIMIT 10;
```

## Testar Busca

Após importar, teste no dashboard:
1. Acesse http://76.13.173.70/dashboard
2. Selecione Estado: SP
3. Cidade: Jundiaí
4. Categoria: Farmácia (ou outra que você importou)
5. Clique em Buscar

## Logs Úteis

### Ver logs do backend
```bash
pm2 logs suphelp-geo
```

### Ver logs do nginx
```bash
tail -f /var/log/nginx/error.log
```

### Ver logs do PostgreSQL
```bash
tail -f /var/log/postgresql/postgresql-*.log
```

## Comandos Rápidos de Diagnóstico

```bash
# Verificar se o backend está rodando
pm2 status

# Verificar se o PostgreSQL está rodando
systemctl status postgresql

# Verificar se o nginx está rodando
systemctl status nginx

# Testar conexão com o banco
psql -h 76.13.173.70 -U admin -d suphelp_geo -c "SELECT COUNT(*) FROM places;"

# Verificar Python e dependências
python3 --version
pip3 list | grep -E "pandas|psycopg2|googlemaps"
```

## Solução Definitiva

Se você quer que a importação via Google Places API funcione perfeitamente:

1. **Instalar Python e dependências** (passos 1 e 2 acima)
2. **Configurar API Key** no `.env`
3. **Reiniciar o backend**: `pm2 restart suphelp-geo`
4. **Testar novamente** no painel admin

## Contato para Suporte

Se o problema persistir, envie:
- Logs do PM2: `pm2 logs suphelp-geo --lines 100 > logs.txt`
- Versão do Python: `python3 --version`
- Dependências instaladas: `pip3 list`
- Conteúdo do .env (sem a API Key real)
