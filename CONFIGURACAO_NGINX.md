# Configuração Nginx - SupHelp Geo

## Problema
O frontend está tentando acessar `http://76.13.173.70:5000/api` diretamente, causando erro de CORS.

## Solução
Usar nginx como proxy reverso para rotear `/api` para o backend Node.js na porta 5000.

## Configuração do Nginx

Arquivo: `/etc/nginx/sites-available/suphelp-geo` (ou `/etc/nginx/conf.d/suphelp-geo.conf`)

```nginx
server {
    listen 80;
    server_name 76.13.173.70;

    # Logs
    access_log /var/log/nginx/suphelp-geo-access.log;
    error_log /var/log/nginx/suphelp-geo-error.log;

    # Frontend React (arquivos estáticos)
    location / {
        root /home/dev/suphelp-geo/backend/public/react-build;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy para API Backend (Node.js na porta 5000)
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        
        # Headers necessários
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Tamanho máximo de upload
    client_max_body_size 10M;
}
```

## Comandos para aplicar

```bash
# 1. Criar/editar arquivo de configuração
sudo nano /etc/nginx/sites-available/suphelp-geo

# 2. Criar link simbólico (se não existir)
sudo ln -s /etc/nginx/sites-available/suphelp-geo /etc/nginx/sites-enabled/

# 3. Testar configuração
sudo nginx -t

# 4. Recarregar nginx
sudo systemctl reload nginx

# 5. Verificar status
sudo systemctl status nginx
```

## Verificar se nginx está rodando

```bash
# Status
sudo systemctl status nginx

# Se não estiver rodando
sudo systemctl start nginx
sudo systemctl enable nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Testar proxy

```bash
# Testar se o proxy está funcionando
curl http://localhost/api/health

# Deve retornar: {"status":"ok","message":"API funcionando"}
```

## Alternativa: Configuração mínima

Se não quiser criar arquivo separado, adicione ao `/etc/nginx/nginx.conf` dentro do bloco `http`:

```nginx
http {
    # ... outras configurações ...
    
    server {
        listen 80;
        server_name 76.13.173.70;
        
        location / {
            root /home/dev/suphelp-geo/backend/public/react-build;
            try_files $uri $uri/ /index.html;
        }
        
        location /api/ {
            proxy_pass http://localhost:5000/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## Troubleshooting

### Erro: "nginx: command not found"
```bash
# Instalar nginx
sudo apt update
sudo apt install nginx -y
```

### Erro: "Permission denied"
```bash
# Verificar permissões do diretório
sudo chown -R www-data:www-data /home/dev/suphelp-geo/backend/public/react-build
sudo chmod -R 755 /home/dev/suphelp-geo/backend/public/react-build
```

### Erro: "Connection refused"
```bash
# Verificar se o backend está rodando
pm2 status
curl http://localhost:5000/api/health
```

### Ver configuração ativa
```bash
sudo nginx -T
```

## Após configurar nginx

1. Rebuild do frontend com path relativo (já feito)
2. Configurar nginx (comandos acima)
3. Deploy:

```bash
cd ~/suphelp-geo
git pull origin main
cd frontend && npm run build && cd ..
rm -rf backend/public/react-build
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/
sudo systemctl reload nginx
```
