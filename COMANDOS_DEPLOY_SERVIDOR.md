# 🚀 COMANDOS PARA DEPLOY NO SERVIDOR

## PASSO 1: Copiar scripts para o servidor

Execute no seu computador Windows (PowerShell):

```powershell
# Copiar scripts de deploy
scp deploy-servidor.sh dev@76.13.173.70:~/suphelp-geo/
scp rollback.sh dev@76.13.173.70:~/suphelp-geo/backend/
```

## PASSO 2: Executar deploy no servidor

SSH no servidor e execute:

```bash
# Conectar no servidor
ssh dev@76.13.173.70

# Ir para pasta do projeto
cd ~/suphelp-geo

# Dar permissão de execução
chmod +x deploy-servidor.sh
chmod +x backend/rollback.sh

# Executar deploy
./deploy-servidor.sh
```

## PASSO 3: Verificar resultado

Após o deploy, teste as URLs:
- http://76.13.173.70:5000/ (React)
- http://76.13.173.70:5000/login (Login React)
- http://76.13.173.70:5000/dashboard (Dashboard React)
- http://76.13.173.70:5000/admin-old/admin.html (Admin antigo)

## EM CASO DE PROBLEMA

Se algo der errado, execute o rollback:

```bash
cd ~/suphelp-geo/backend
./rollback.sh
```

## COMANDOS ÚTEIS

```bash
# Ver logs do PM2
pm2 logs suphelp-geo

# Ver status
pm2 status

# Reiniciar se necessário
pm2 restart suphelp-geo
```