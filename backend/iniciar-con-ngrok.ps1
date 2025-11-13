# Script completo para iniciar backend con ngrok y obtener URL externa

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR BACKEND CON NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ngrokExe = "C:\ngrok\ngrok.exe"
$backendDir = Join-Path $PSScriptRoot ".."
$frontendDir = Join-Path $backendDir "Telwagen-React-Electron-App"

# Verificar ngrok
if (-not (Test-Path $ngrokExe)) {
    Write-Host "❌ ngrok no encontrado. Ejecuta: .\instalar-ngrok.ps1" -ForegroundColor Red
    exit 1
}

# Verificar authtoken (ngrok v3 usa ubicación diferente)
$ngrokConfig1 = "$env:USERPROFILE\.ngrok2\ngrok.yml"
$ngrokConfig2 = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
if (-not (Test-Path $ngrokConfig1) -and -not (Test-Path $ngrokConfig2)) {
    Write-Host "⚠️ ngrok no está autenticado" -ForegroundColor Yellow
    Write-Host "Ejecuta primero: .\configurar-ngrok-token.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Iniciando backend..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir\backend'; npm run start:prod" -PassThru

Write-Host "⏳ Esperando 5 segundos para que el backend inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🌐 Iniciando ngrok..." -ForegroundColor Yellow
Write-Host ""

# Iniciar ngrok en background y capturar la URL
$ngrokProcess = Start-Process $ngrokExe -ArgumentList "http", "8443" -PassThru -NoNewWindow

Write-Host "⏳ Esperando 3 segundos para que ngrok se conecte..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Intentar obtener la URL de ngrok desde la API local
Write-Host "🔍 Obteniendo URL de ngrok..." -ForegroundColor Yellow
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $httpsUrl = ($ngrokApi.tunnels | Where-Object { $_.proto -eq "https" -and $_.config.addr -like "*:8443" }).public_url
    
    if ($httpsUrl) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ URL EXTERNA OBTENIDA" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 URL Pública: $httpsUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
        Write-Host "1. Copia esta URL: $httpsUrl" -ForegroundColor White
        Write-Host "2. Actualiza el frontend con esta URL" -ForegroundColor White
        Write-Host ""
        Write-Host "O ejecuta: .\actualizar-frontend-ngrok.ps1" -ForegroundColor Green
        Write-Host ""
        
        # Guardar URL en archivo para uso posterior
        $httpsUrl | Out-File -FilePath (Join-Path $PSScriptRoot "ngrok-url.txt") -Encoding UTF8
        
    } else {
        Write-Host "⚠️ No se pudo obtener la URL automáticamente" -ForegroundColor Yellow
        Write-Host "Abre: http://localhost:4040 para ver la URL" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️ No se pudo obtener la URL automáticamente" -ForegroundColor Yellow
    Write-Host "Abre: http://localhost:4040 para ver la URL" -ForegroundColor White
    Write-Host "O mira la salida de ngrok arriba" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVIDORES EN EJECUCIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend: Corriendo en puerto 8443" -ForegroundColor Green
Write-Host "✅ ngrok: Corriendo (ver URL arriba)" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Mantén estas ventanas abiertas" -ForegroundColor White
Write-Host "- La URL de ngrok cambia cada vez que reinicias" -ForegroundColor White
Write-Host "- Para detener: Cierra las ventanas o presiona Ctrl+C" -ForegroundColor White
Write-Host ""

