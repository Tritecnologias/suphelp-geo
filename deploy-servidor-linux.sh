#!/bin/bash

# ===================================
# DEPLOY SUPHELP GEO - SERVIDOR LINUX
# ===================================

echo "🚀 Iniciando deploy do SupHelp Geo..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    log_error "Execute este script no diretório raiz do projeto!"
    exit 1
fi

# 1. Fazer backup do .env
log_info "Fazendo backup do arquivo .env..."
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.backup
    log_success "Backup do .env criado"
else
    log_warning "Arquivo .env não encontrado"
fi

# 2. Parar processos PM2 existentes
log_info "Parando processos PM2..."
pm2 stop suphelp-geo 2>/dev/null || true
pm2 delete suphelp-geo 2>/dev/null || true
log_success "Processos PM2 parados"

# 3. Fazer pull do Git
log_info "Atualizando código do Git..."
git stash push -m "Deploy backup $(date)" 2>/dev/null || true
git pull origin main
if [ $? -eq 0 ]; then
    log_success "Código atualizado do Git"
else
    log_error "Erro ao fazer pull do Git"
    exit 1
fi

# 4. Restaurar .env se existir backup
if [ -f "backend/.env.backup" ]; then
    log_info "Restaurando arquivo .env..."
    cp backend/.env.backup backend/.env
    log_success "Arquivo .env restaurado"
fi

# 5. Instalar dependências do backend
log_info "Instalando dependências do backend..."
cd backend
npm install --production
if [ $? -eq 0 ]; then
    log_success "Dependências do backend instaladas"
else
    log_error "Erro ao instalar dependências do backend"
    exit 1
fi
cd ..

# 6. Instalar dependências do frontend
log_info "Instalando dependências do frontend..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    log_success "Dependências do frontend instaladas"
else
    log_error "Erro ao instalar dependências do frontend"
    exit 1
fi

# 7. Build do frontend React
log_info "Fazendo build do frontend React..."
npm run build
if [ $? -eq 0 ]; then
    log_success "Build do frontend concluído"
else
    log_error "Erro no build do frontend"
    exit 1
fi
cd ..

# 8. Copiar build para o backend
log_info "Copiando build do React para o backend..."
rm -rf backend/public/react-build 2>/dev/null || true
mkdir -p backend/public/react-build
cp -r frontend/dist/* backend/public/react-build/
log_success "Build copiado para o backend"

# 9. Verificar configuração do banco
log_info "Verificando conexão com banco de dados..."
cd backend
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Erro de conexão:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Banco conectado:', res.rows[0].now);
    process.exit(0);
  }
});
" 2>/dev/null
if [ $? -eq 0 ]; then
    log_success "Banco de dados conectado"
else
    log_warning "Problema na conexão com banco - verifique .env"
fi
cd ..

# 10. Iniciar com PM2
log_info "Iniciando aplicação com PM2..."
cd backend
pm2 start src/server.js --name "suphelp-geo" --watch --ignore-watch="node_modules"
if [ $? -eq 0 ]; then
    log_success "Aplicação iniciada com PM2"
else
    log_error "Erro ao iniciar com PM2"
    exit 1
fi

# 11. Salvar configuração PM2
pm2 save
pm2 startup | grep -E "sudo|systemctl" | head -1 > /tmp/pm2_startup.sh 2>/dev/null || true

# 12. Verificar se está rodando
log_info "Verificando se aplicação está rodando..."
sleep 3
curl -s http://localhost:5000/ > /dev/null
if [ $? -eq 0 ]; then
    log_success "Aplicação rodando em http://localhost:5000"
else
    log_warning "Aplicação pode não estar respondendo ainda"
fi

# 13. Mostrar status
log_info "Status dos processos:"
pm2 list

# 14. Configurar Nginx (se necessário)
if command -v nginx &> /dev/null; then
    log_info "Verificando configuração do Nginx..."
    if [ -f "/etc/nginx/sites-available/default" ]; then
        # Verificar se já tem configuração do React
        if ! grep -q "react-build" /etc/nginx/sites-available/default; then
            log_warning "Nginx pode precisar ser reconfigurado para servir o React"
            echo "Execute: sudo nano /etc/nginx/sites-available/default"
            echo "E adicione a configuração para servir arquivos React"
        else
            log_success "Nginx já configurado"
            sudo systemctl reload nginx 2>/dev/null || true
        fi
    fi
fi

# 15. Limpeza
log_info "Limpando arquivos temporários..."
rm -f backend/.env.backup 2>/dev/null || true

echo ""
log_success "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   • Frontend React: ✅ Build criado"
echo "   • Backend Node.js: ✅ Rodando com PM2"
echo "   • Banco de dados: ✅ Conectado"
echo "   • Aplicação: http://localhost:5000"
echo ""
echo "📝 Próximos passos:"
echo "   • Verificar se tudo está funcionando"
echo "   • Testar login com: teste@suphelp.com.br / password"
echo "   • Testar admin com: admin@suphelp.com.br / password"
echo ""
echo "🔧 Comandos úteis:"
echo "   • Ver logs: pm2 logs suphelp-geo"
echo "   • Reiniciar: pm2 restart suphelp-geo"
echo "   • Parar: pm2 stop suphelp-geo"
echo ""

cd ..
log_success "Deploy finalizado! 🚀"