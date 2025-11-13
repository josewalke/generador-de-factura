# Script para iniciar ngrok automáticamente

$ngrokDir = "C:\ngrok"
$ngrokExe = Join-Path $ngrokDir "ngrok.exe"

# Verificar que ngrok existe
if (-not (Test-Path $ngrokExe)) {
    Write-Host "❌ ngrok no encontrado en: $ngrokExe" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\instalar-ngrok.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Iniciando túnel ngrok en puerto 8443..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Asegúrate de que el backend esté corriendo en puerto 8443" -ForegroundColor White
Write-Host "- Mantén esta ventana abierta mientras uses ngrok" -ForegroundColor White
Write-Host "- La URL cambiará cada vez que reinicies ngrok" -ForegroundColor White
Write-Host ""

# Iniciar ngrok
& $ngrokExe http 8443

