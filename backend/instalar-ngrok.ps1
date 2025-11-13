# Script para instalar y configurar ngrok

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALAR Y CONFIGURAR NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ngrokDir = "C:\ngrok"
$ngrokExe = Join-Path $ngrokDir "ngrok.exe"

# Verificar si ngrok ya está instalado
if (Test-Path $ngrokExe) {
    Write-Host "✅ ngrok ya está instalado en: $ngrokDir" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "📥 Descargando ngrok..." -ForegroundColor Yellow
    
    # Crear directorio si no existe
    if (-not (Test-Path $ngrokDir)) {
        New-Item -ItemType Directory -Path $ngrokDir -Force | Out-Null
    }
    
    # URL de descarga de ngrok para Windows
    $ngrokUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    $zipPath = Join-Path $env:TEMP "ngrok.zip"
    
    try {
        # Descargar ngrok
        Write-Host "Descargando desde: $ngrokUrl" -ForegroundColor White
        Invoke-WebRequest -Uri $ngrokUrl -OutFile $zipPath -UseBasicParsing
        
        # Extraer
        Write-Host "Extrayendo..." -ForegroundColor White
        Expand-Archive -Path $zipPath -DestinationPath $ngrokDir -Force
        
        # Limpiar
        Remove-Item $zipPath -Force
        
        Write-Host "✅ ngrok instalado en: $ngrokDir" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al descargar ngrok: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "📥 Descarga manual:" -ForegroundColor Yellow
        Write-Host "1. Ve a: https://ngrok.com/download" -ForegroundColor White
        Write-Host "2. Descarga para Windows" -ForegroundColor White
        Write-Host "3. Extrae ngrok.exe en: $ngrokDir" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR AUTENTICACIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para usar ngrok necesitas:" -ForegroundColor Yellow
Write-Host "1. Crear cuenta en: https://dashboard.ngrok.com/signup" -ForegroundColor White
Write-Host "2. Obtener authtoken en: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host "3. Ejecutar: ngrok config add-authtoken TU_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "O ejecuta este script después de obtener tu token:" -ForegroundColor Yellow
Write-Host "  .\configurar-ngrok-token.ps1" -ForegroundColor Green
Write-Host ""

