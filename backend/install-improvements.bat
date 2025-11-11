@echo off
REM Script de instalación y configuración para mejoras de rendimiento
REM Generador de Facturas Telwagen v2.0

echo 🚀 Instalando mejoras de configuración y rendimiento...
echo ==================================================

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: Ejecutar este script desde el directorio backend/
    pause
    exit /b 1
)

REM Instalar dependencias
echo 📦 Instalando dependencias...
npm install node-cache

if %errorlevel% equ 0 (
    echo ✅ Dependencias instaladas correctamente
) else (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

REM Crear archivo .env si no existe
if not exist ".env" (
    echo 📝 Creando archivo .env...
    copy env.example .env
    echo ✅ Archivo .env creado desde env.example
    echo ⚠️  Recuerda personalizar las variables en .env
) else (
    echo ✅ Archivo .env ya existe
)

REM Crear directorios necesarios
echo 📁 Creando directorios necesarios...
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups
if not exist "certificados" mkdir certificados
if not exist "firmas" mkdir firmas
echo ✅ Directorios creados

REM Crear archivo de configuración de desarrollo
echo ⚙️  Creando configuración de desarrollo...
(
echo {
echo   "server": {
echo     "port": 3000,
echo     "host": "localhost",
echo     "environment": "development"
echo   },
echo   "database": {
echo     "path": "./database/telwagen.db",
echo     "timeout": 30000,
echo     "maxConnections": 10,
echo     "journalMode": "WAL",
echo     "synchronous": "NORMAL",
echo     "cacheSize": 2000
echo   },
echo   "cache": {
echo     "enabled": true,
echo     "ttl": 300,
echo     "maxSize": 1000
echo   },
echo   "pagination": {
echo     "defaultLimit": 20,
echo     "maxLimit": 100,
echo     "defaultOffset": 0
echo   },
echo   "logging": {
echo     "level": "info",
echo     "format": "combined",
echo     "file": "./logs/app.log"
echo   }
echo }
) > config.dev.json
echo ✅ Configuración de desarrollo creada

REM Verificar estructura de archivos
echo 🔍 Verificando estructura de archivos...
if exist "config\config.js" (
    echo ✅ config\config.js
) else (
    echo ❌ config\config.js - Archivo faltante
)

if exist "modules\sistemaCache.js" (
    echo ✅ modules\sistemaCache.js
) else (
    echo ❌ modules\sistemaCache.js - Archivo faltante
)

if exist "modules\sistemaPaginacion.js" (
    echo ✅ modules\sistemaPaginacion.js
) else (
    echo ❌ modules\sistemaPaginacion.js - Archivo faltante
)

if exist "env.example" (
    echo ✅ env.example
) else (
    echo ❌ env.example - Archivo faltante
)

if exist "MEJORAS_CONFIGURACION_RENDIMIENTO.md" (
    echo ✅ MEJORAS_CONFIGURACION_RENDIMIENTO.md
) else (
    echo ❌ MEJORAS_CONFIGURACION_RENDIMIENTO.md - Archivo faltante
)

REM Mostrar información de configuración
echo.
echo 📋 INFORMACIÓN DE CONFIGURACIÓN:
echo =================================
echo • Puerto del servidor: 3000
echo • Base de datos: SQLite con modo WAL
echo • Caché: Habilitado (TTL: 5 minutos)
echo • Paginación: 20 elementos por defecto
echo • Logs: .\logs\app.log
echo • Backups: .\backups\

echo.
echo 🚀 COMANDOS ÚTILES:
echo ===================
echo • Iniciar servidor: npm run dev
echo • Ver estadísticas: curl http://localhost:3000/api/performance/stats
echo • Ver caché: curl http://localhost:3000/api/performance/cache/stats
echo • Limpiar caché: curl -X POST http://localhost:3000/api/performance/cache/clear

echo.
echo 📚 DOCUMENTACIÓN:
echo =================
echo • Mejoras implementadas: MEJORAS_CONFIGURACION_RENDIMIENTO.md
echo • Variables de entorno: env.example
echo • Configuración: config\config.js

echo.
echo ✅ INSTALACIÓN COMPLETADA
echo =========================
echo El sistema está listo para usar con las mejoras de rendimiento.
echo Inicia el servidor con: npm run dev

pause

