@echo off
echo ========================================
echo   MIGRACION SQLITE A POSTGRESQL
echo ========================================
echo.

REM Buscar Node.js en ubicaciones comunes
set NODE_PATH=

if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_PATH=C:\Program Files\nodejs\node.exe"
    goto :found
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set "NODE_PATH=C:\Program Files (x86)\nodejs\node.exe"
    goto :found
)

REM Buscar en PATH
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    set NODE_PATH=node
    goto :found
)

echo ERROR: Node.js no encontrado
echo.
echo Por favor, instala Node.js o agrega Node.js al PATH
echo.
echo Puedes descargarlo de: https://nodejs.org/
echo.
pause
exit /b 1

:found
echo Node.js encontrado: %NODE_PATH%
echo.
echo Ejecutando migracion...
echo.

cd /d "%~dp0"
call "%NODE_PATH%" migrar_a_postgresql.js

if %ERRORLEVEL% == 0 (
    echo.
    echo ========================================
    echo   MIGRACION COMPLETADA EXITOSAMENTE
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   ERROR EN LA MIGRACION
    echo ========================================
)

echo.
pause

