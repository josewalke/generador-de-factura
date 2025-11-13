@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   INICIANDO SERVIDOR COMPLETO
echo ========================================
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0iniciar-todo.ps1"

