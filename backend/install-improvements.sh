#!/bin/bash

# Script de instalación y configuración para mejoras de rendimiento
# Generador de Facturas Telwagen v2.0

echo "🚀 Instalando mejoras de configuración y rendimiento..."
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar este script desde el directorio backend/"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install node-cache

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error instalando dependencias"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cp env.example .env
    echo "✅ Archivo .env creado desde env.example"
    echo "⚠️  Recuerda personalizar las variables en .env"
else
    echo "✅ Archivo .env ya existe"
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p logs
mkdir -p backups
mkdir -p certificados
mkdir -p firmas
echo "✅ Directorios creados"

# Verificar permisos de escritura
echo "🔐 Verificando permisos..."
if [ -w "logs" ] && [ -w "backups" ]; then
    echo "✅ Permisos de escritura verificados"
else
    echo "⚠️  Verifica los permisos de escritura en logs/ y backups/"
fi

# Crear archivo de configuración de desarrollo
echo "⚙️  Creando configuración de desarrollo..."
cat > config.dev.json << EOF
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "environment": "development"
  },
  "database": {
    "path": "./database/telwagen.db",
    "timeout": 30000,
    "maxConnections": 10,
    "journalMode": "WAL",
    "synchronous": "NORMAL",
    "cacheSize": 2000
  },
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 1000
  },
  "pagination": {
    "defaultLimit": 20,
    "maxLimit": 100,
    "defaultOffset": 0
  },
  "logging": {
    "level": "info",
    "format": "combined",
    "file": "./logs/app.log"
  }
}
EOF
echo "✅ Configuración de desarrollo creada"

# Verificar estructura de archivos
echo "🔍 Verificando estructura de archivos..."
required_files=(
    "config/config.js"
    "modules/sistemaCache.js"
    "modules/sistemaPaginacion.js"
    "env.example"
    "MEJORAS_CONFIGURACION_RENDIMIENTO.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - Archivo faltante"
    fi
done

# Mostrar información de configuración
echo ""
echo "📋 INFORMACIÓN DE CONFIGURACIÓN:"
echo "================================="
echo "• Puerto del servidor: 3000"
echo "• Base de datos: SQLite con modo WAL"
echo "• Caché: Habilitado (TTL: 5 minutos)"
echo "• Paginación: 20 elementos por defecto"
echo "• Logs: ./logs/app.log"
echo "• Backups: ./backups/"

echo ""
echo "🚀 COMANDOS ÚTILES:"
echo "==================="
echo "• Iniciar servidor: npm run dev"
echo "• Ver estadísticas: curl http://localhost:3000/api/performance/stats"
echo "• Ver caché: curl http://localhost:3000/api/performance/cache/stats"
echo "• Limpiar caché: curl -X POST http://localhost:3000/api/performance/cache/clear"

echo ""
echo "📚 DOCUMENTACIÓN:"
echo "================="
echo "• Mejoras implementadas: MEJORAS_CONFIGURACION_RENDIMIENTO.md"
echo "• Variables de entorno: env.example"
echo "• Configuración: config/config.js"

echo ""
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================="
echo "El sistema está listo para usar con las mejoras de rendimiento."
echo "Inicia el servidor con: npm run dev"

