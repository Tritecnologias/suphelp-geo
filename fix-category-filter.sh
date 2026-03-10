#!/bin/bash
# Corrige o bug do filtro de categoria no backend

cd ~/suphelp-geo/backend/src

# Backup
cp server.js server.js.backup

# Corrige os placeholders SQL
sed -i 's/category ILIKE \${paramIndex}/category ILIKE $${paramIndex}/g' server.js
sed -i 's/rating >= \${paramCount}/rating >= $${paramCount}/g' server.js
sed -i 's/LIMIT \${paramCount}/LIMIT $${paramCount}/g' server.js

echo "✅ Correções aplicadas!"
echo "Verificando mudanças:"
grep -n "ILIKE" server.js | head -5

pm2 restart suphelp-geo
echo "✅ Backend reiniciado!"
