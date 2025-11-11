@echo off
echo ========================================
echo   MIGRACION SQLITE A POSTGRESQL
echo ========================================
echo.

cd backend

REM Intentar encontrar Node.js
set NODE_PATH=
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files\nodejs\node.exe
) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODE_PATH=C:\Program Files (x86)\nodejs\node.exe
) else (
    echo Buscando Node.js...
    where node >nul 2>&1
    if %ERRORLEVEL% == 0 (
        set NODE_PATH=node
    ) else (
        echo ERROR: Node.js no encontrado.
        echo Por favor, instala Node.js o agrega Node.js al PATH.
        pause
        exit /b 1
    )
)

echo Ejecutando migracion...
echo.

"%NODE_PATH%" migrar_a_postgresql.js

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

