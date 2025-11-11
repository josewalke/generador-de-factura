#!/bin/bash

echo "========================================"
echo "  INICIANDO BACKEND EN PRODUCCION"
echo "========================================"
echo ""

# Verificar que Node.js esté disponible
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no encontrado"
    echo "Por favor, instala Node.js"
    exit 1
fi

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: No se pudieron instalar las dependencias"
        exit 1
    fi
fi

# Copiar .env.production a .env si no existe .env
if [ ! -f ".env" ] && [ -f ".env.production" ]; then
    echo "Copiando .env.production a .env..."
    cp ".env.production" ".env"
fi

# Verificar conexión a PostgreSQL
echo "Verificando conexión a PostgreSQL..."
node -e "
const {Pool} = require('pg');
const config = require('./config/config');
const pool = new Pool({
    host: config.get('database.host'),
    port: config.get('database.port'),
    database: config.get('database.database'),
    user: config.get('database.user'),
    password: config.get('database.password')
});
pool.query('SELECT NOW()')
    .then(() => { console.log('✅ Conexión OK'); process.exit(0); })
    .catch(e => { console.log('❌ ERROR:', e.message); process.exit(1); });
"

if [ $? -ne 0 ]; then
    echo ""
    echo "ADVERTENCIA: No se pudo conectar a PostgreSQL"
    echo "Verifica la configuración en .env"
    echo ""
    read -p "Presiona Enter para continuar..."
fi

echo ""
echo "Iniciando servidor en modo producción..."
echo ""

# Iniciar servidor
export NODE_ENV=production
node server.js

