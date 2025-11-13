# Script completo: Inicia backend + ngrok + actualiza frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR TODO CON NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ngrokExe = "C:\ngrok\ngrok.exe"
$backendDir = Join-Path $PSScriptRoot ".."
$frontendDir = Join-Path $backendDir "Telwagen-React-Electron-App"

# Verificar ngrok
if (-not (Test-Path $ngrokExe)) {
    Write-Host "ngrok no encontrado. Ejecuta: .\instalar-ngrok.ps1" -ForegroundColor Red
    exit 1
}

# Verificar authtoken (ngrok v3 usa ubicacion diferente)
$ngrokConfig1 = "$env:USERPROFILE\.ngrok2\ngrok.yml"
$ngrokConfig2 = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
if (-not (Test-Path $ngrokConfig1) -and -not (Test-Path $ngrokConfig2)) {
    Write-Host "ngrok no esta autenticado" -ForegroundColor Yellow
    Write-Host "Ejecuta primero: .\configurar-ngrok-token.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Paso 1: Iniciando backend..." -ForegroundColor Yellow
$backendPath = Join-Path $backendDir "backend"
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend iniciando...' -ForegroundColor Green; npm run start:prod" -PassThru

Write-Host "Esperando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Paso 2: Iniciando ngrok..." -ForegroundColor Yellow
$ngrokProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; & '$ngrokExe' http 8443" -PassThru

Write-Host "Esperando 5 segundos para que ngrok se conecte..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Paso 3: Obteniendo URL de ngrok..." -ForegroundColor Yellow

# Intentar obtener URL varias veces
$ngrokUrl = $null
$maxAttempts = 10
$attempt = 0

while (-not $ngrokUrl -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = ($ngrokApi.tunnels | Where-Object { $_.proto -eq "https" -and $_.config.addr -like "*:8443" }).public_url
        if ($ngrokUrl) {
            break
        }
    } catch {
        # Esperar un poco mas
        Start-Sleep -Seconds 2
    }
}

if ($ngrokUrl) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  URL EXTERNA OBTENIDA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL Publica: $ngrokUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Guardar URL
    $ngrokUrl | Out-File -FilePath (Join-Path $PSScriptRoot "ngrok-url.txt") -Encoding UTF8
    
    Write-Host "Paso 4: Actualizando frontend..." -ForegroundColor Yellow
    
    # Actualizar .env del frontend
    $envFile = Join-Path $frontendDir ".env"
    $envContent = "VITE_BACKEND_URL=$ngrokUrl`n"
    
    if (Test-Path $envFile) {
        $existingContent = Get-Content $envFile -Raw
        if ($existingContent -match "VITE_BACKEND_URL=") {
            $envContent = $existingContent -replace "VITE_BACKEND_URL=.*", "VITE_BACKEND_URL=$ngrokUrl"
        } else {
            $envContent = $existingContent + "`n" + "VITE_BACKEND_URL=$ngrokUrl"
        }
    }
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline
    
    Write-Host "Frontend actualizado con URL: $ngrokUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  TODO CONFIGURADO" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Resumen:" -ForegroundColor Yellow
    Write-Host "   Backend: Corriendo en puerto 8443" -ForegroundColor Green
    Write-Host "   ngrok: Corriendo" -ForegroundColor Green
    Write-Host "   Frontend: Configurado con URL externa" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL Externa: $ngrokUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Reinicia el frontend para aplicar cambios:" -ForegroundColor Yellow
    Write-Host "   cd `"$frontendDir`"" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "- Manten las ventanas de backend y ngrok abiertas" -ForegroundColor White
    Write-Host "- La URL cambia cada vez que reinicias ngrok" -ForegroundColor White
    Write-Host "- Ejecuta este script de nuevo si reinicias ngrok" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "No se pudo obtener la URL automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "1. Abre: http://localhost:4040 para ver la URL" -ForegroundColor White
    Write-Host "2. Ejecuta: .\actualizar-frontend-ngrok.ps1" -ForegroundColor White
    Write-Host ""
}
