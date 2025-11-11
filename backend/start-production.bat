@echo off
echo ========================================
echo   INICIANDO BACKEND EN PRODUCCION
echo ========================================
echo.

REM Verificar que Node.js esté disponible
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no encontrado
    echo Por favor, instala Node.js o agrega al PATH
    pause
    exit /b 1
)

REM Verificar que las dependencias estén instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

REM Copiar .env.production a .env si no existe .env
if not exist ".env" (
    if exist ".env.production" (
        echo Copiando .env.production a .env...
        copy ".env.production" ".env" >nul
    )
)

REM Verificar que PostgreSQL esté configurado
echo Verificando conexion a PostgreSQL...
node -e "const {Pool}=require('pg');const config=require('./config/config');const p=new Pool({host:config.get('database.host'),port:config.get('database.port'),database:config.get('database.database'),user:config.get('database.user'),password:config.get('database.password')});p.query('SELECT NOW()').then(()=>{console.log('OK');process.exit(0)}).catch(e=>{console.log('ERROR:',e.message);process.exit(1)})"

if %ERRORLEVEL% neq 0 (
    echo.
    echo ADVERTENCIA: No se pudo conectar a PostgreSQL
    echo Verifica la configuracion en .env
    echo.
    pause
)

echo.
echo Iniciando servidor en modo produccion...
echo.

REM Iniciar servidor
set NODE_ENV=production
node server.js

pause

