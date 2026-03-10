#!/bin/bash
# Script para corrigir o bug do filtro de categoria no backend

echo "🔧 Corrigindo placeholders SQL no filtro de categoria..."

# Fazer backup
cp backend/src/server.js backend/src/server.js.backup

# Corrigir a linha 924: adicionar $ antes do paramIndex
sed -i 's/category ILIKE ${paramIndex}/category ILIKE $${paramIndex}/g' backend/src/server.js

echo "✅ Correção aplicada!"
echo ""
echo "📝 Verificando a mudança:"
grep -n "category ILIKE" backend/src/server.js | head -5

echo ""
echo "🔄 Agora execute: pm2 restart suphelp-geo"
