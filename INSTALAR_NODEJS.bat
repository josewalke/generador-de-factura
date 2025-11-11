@echo off
echo ========================================
echo   INSTALACION DE NODE.JS
echo ========================================
echo.

REM Verificar si ya está instalado
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Node.js ya esta instalado!
    node --version
    npm --version
    echo.
    echo Puedes ejecutar la migracion ahora:
    echo   cd backend
    echo   npm run migrate:postgresql
    pause
    exit /b 0
)

echo Node.js no esta instalado.
echo.
echo Descargando instalador de Node.js LTS...
echo.

REM Crear directorio temporal
set TEMP_DIR=%TEMP%\nodejs_install
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM URL del instalador de Node.js LTS
set NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
set INSTALLER=%TEMP_DIR%\nodejs-installer.msi

echo Descargando desde nodejs.org...
echo Esto puede tardar unos minutos...
echo.

REM Descargar usando PowerShell
powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%INSTALLER%' -UseBasicParsing"

if not exist "%INSTALLER%" (
    echo ERROR: No se pudo descargar el instalador
    echo.
    echo Por favor, descarga Node.js manualmente desde:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo.
echo Instalador descargado correctamente.
echo.
echo IMPORTANTE: Se abrira el instalador de Node.js
echo.
echo Por favor:
echo 1. Sigue las instrucciones del instalador
echo 2. Acepta los terminos y condiciones
echo 3. Asegurate de marcar "Add to PATH" durante la instalacion
echo 4. Completa la instalacion
echo.
pause

REM Ejecutar el instalador
start /wait msiexec.exe /i "%INSTALLER%" /quiet /norestart

echo.
echo Instalacion completada!
echo.
echo IMPORTANTE: Cierra y vuelve a abrir esta ventana para que Node.js
echo este disponible en el PATH.
echo.
echo Despues de reiniciar la terminal, ejecuta:
echo   cd backend
echo   npm run migrate:postgresql
echo.

REM Limpiar
rmdir /s /q "%TEMP_DIR%" 2>nul

pause

