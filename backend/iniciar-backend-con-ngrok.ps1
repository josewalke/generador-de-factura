# Script para iniciar backend y ngrok juntos

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR BACKEND + NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $PSScriptRoot ".."
$ngrokExe = "C:\ngrok\ngrok.exe"

# Verificar que ngrok existe
if (-not (Test-Path $ngrokExe)) {
    Write-Host "❌ ngrok no encontrado en: $ngrokExe" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\instalar-ngrok.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar authtoken
$ngrokConfig = "$env:USERPROFILE\.ngrok2\ngrok.yml"
if (-not (Test-Path $ngrokConfig)) {
    Write-Host "⚠️ ngrok no está autenticado" -ForegroundColor Yellow
    Write-Host "Ejecuta primero: .\configurar-ngrok-token.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continuar = Read-Host "¿Continuar de todos modos? (S/N)"
    if ($continuar -ne "S" -and $continuar -ne "s") {
        exit 1
    }
}

Write-Host "🚀 Iniciando backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir\backend'; npm run start:prod"

Write-Host "⏳ Esperando 5 segundos para que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🌐 Iniciando ngrok..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Copia la URL HTTPS que aparece (ej: https://abc123.ngrok.io)" -ForegroundColor White
Write-Host "- Actualiza el frontend con esa URL" -ForegroundColor White
Write-Host "- Mantén esta ventana abierta" -ForegroundColor White
Write-Host ""

# Iniciar ngrok
& $ngrokExe http 8443

