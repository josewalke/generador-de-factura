# Script para configurar ngrok para acceso desde Internet
# Sin necesidad de tocar el router Orange

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR NGROK PARA ACCESO INTERNET" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ngrok está instalado
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokPath) {
    Write-Host "❌ ngrok no está instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Pasos para instalar ngrok:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://ngrok.com/download" -ForegroundColor White
    Write-Host "2. Descarga ngrok para Windows" -ForegroundColor White
    Write-Host "3. Extrae el archivo ngrok.exe" -ForegroundColor White
    Write-Host "4. Colócalo en una carpeta (ej: C:\ngrok\)" -ForegroundColor White
    Write-Host "5. Agrega esa carpeta al PATH o ejecuta desde ahí" -ForegroundColor White
    Write-Host ""
    Write-Host "O instala con Chocolatey:" -ForegroundColor Yellow
    Write-Host "   choco install ngrok" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ ngrok encontrado: $($ngrokPath.Source)" -ForegroundColor Green
Write-Host ""

# Verificar si está autenticado
Write-Host "🔍 Verificando autenticación de ngrok..." -ForegroundColor Yellow
$ngrokConfig = "$env:USERPROFILE\.ngrok2\ngrok.yml"
if (Test-Path $ngrokConfig) {
    $configContent = Get-Content $ngrokConfig -Raw
    if ($configContent -match "authtoken:") {
        Write-Host "✅ ngrok está autenticado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ ngrok no está autenticado" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para autenticarte:" -ForegroundColor Yellow
        Write-Host "1. Regístrate en: https://dashboard.ngrok.com/signup" -ForegroundColor White
        Write-Host "2. Obtén tu authtoken en: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
        Write-Host "3. Ejecuta: ngrok config add-authtoken TU_TOKEN" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "⚠️ ngrok no está configurado" -ForegroundColor Yellow
    Write-Host "   Necesitas autenticarte primero (ver arriba)" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR TÚNEL NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar el túnel, ejecuta:" -ForegroundColor Yellow
Write-Host "  ngrok http 8443" -ForegroundColor Green
Write-Host ""
Write-Host "Esto creará una URL pública como:" -ForegroundColor White
Write-Host "  https://abc123.ngrok.io" -ForegroundColor Cyan
Write-Host ""
Write-Host "Luego actualiza el frontend para usar esa URL." -ForegroundColor White
Write-Host ""

