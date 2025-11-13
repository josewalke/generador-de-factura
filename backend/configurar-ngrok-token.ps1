# Script para configurar el authtoken de ngrok

$ngrokDir = "C:\ngrok"
$ngrokExe = Join-Path $ngrokDir "ngrok.exe"

# Verificar que ngrok existe
if (-not (Test-Path $ngrokExe)) {
    Write-Host "❌ ngrok no encontrado. Ejecuta primero: .\instalar-ngrok.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR NGROK AUTHTOKEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para obtener tu authtoken:" -ForegroundColor Yellow
Write-Host "1. Ve a: https://dashboard.ngrok.com/signup" -ForegroundColor White
Write-Host "2. Crea una cuenta (gratis)" -ForegroundColor White
Write-Host "3. Ve a: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host "4. Copia tu authtoken" -ForegroundColor White
Write-Host ""

$token = Read-Host "Pega tu authtoken aquí"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token vacío. Operación cancelada." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔐 Configurando authtoken..." -ForegroundColor Yellow

try {
    & $ngrokExe config add-authtoken $token
    Write-Host "✅ Authtoken configurado correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes iniciar ngrok con: .\iniciar-ngrok.ps1" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error al configurar authtoken: $_" -ForegroundColor Red
    exit 1
}

