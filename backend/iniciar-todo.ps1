# Script principal: Inicia TODO (Backend + ngrok + actualiza frontend)
# Uso: .\iniciar-todo.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIAR SERVIDOR COMPLETO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ngrokExe = "C:\ngrok\ngrok.exe"
$backendDir = Join-Path $PSScriptRoot ".."
$frontendDir = Join-Path $backendDir "Telwagen-React-Electron-App"

# Verificar ngrok
if (-not (Test-Path $ngrokExe)) {
    Write-Host "[ERROR] ngrok no encontrado" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\instalar-ngrok.ps1" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Verificar authtoken
$ngrokConfig1 = "$env:USERPROFILE\.ngrok2\ngrok.yml"
$ngrokConfig2 = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
if (-not (Test-Path $ngrokConfig1) -and -not (Test-Path $ngrokConfig2)) {
    Write-Host "[ERROR] ngrok no esta autenticado" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\configurar-ngrok-token.ps1" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[1/4] Iniciando backend..." -ForegroundColor Yellow
$backendPath = Join-Path $backendDir "backend"
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '=== BACKEND ===' -ForegroundColor Green; npm run start:prod" -PassThru -WindowStyle Normal

Write-Host "      Esperando 5 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "[2/4] Iniciando ngrok (puerto HTTP 3000)..." -ForegroundColor Yellow
$ngrokProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '=== NGROK ===' -ForegroundColor Cyan; & '$ngrokExe' http 3000" -PassThru -WindowStyle Normal

Write-Host "      Esperando 5 segundos para conexion..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "[3/4] Obteniendo URL externa..." -ForegroundColor Yellow

# Intentar obtener URL varias veces
$ngrokUrl = $null
$maxAttempts = 15
$attempt = 0

while (-not $ngrokUrl -and $attempt -lt $maxAttempts) {
    $attempt++
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = ($ngrokApi.tunnels | Where-Object { $_.proto -eq "https" -and ($_.config.addr -like "*:3000" -or $_.config.addr -like "*:8443") }).public_url
        if ($ngrokUrl) {
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($ngrokUrl) {
    Write-Host "[4/4] Actualizando frontend..." -ForegroundColor Yellow
    
    # Guardar URL
    $ngrokUrl | Out-File -FilePath (Join-Path $PSScriptRoot "ngrok-url.txt") -Encoding UTF8
    
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
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  TODO INICIADO CORRECTAMENTE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL Externa (usa esta desde cualquier lugar):" -ForegroundColor Cyan
    Write-Host "  $ngrokUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Estado:" -ForegroundColor Yellow
    Write-Host "  [OK] Backend corriendo en puerto 8443" -ForegroundColor Green
    Write-Host "  [OK] ngrok creando tunel publico" -ForegroundColor Green
    Write-Host "  [OK] Frontend configurado con URL externa" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo paso:" -ForegroundColor Yellow
    Write-Host "  Reinicia el frontend: cd Telwagen-React-Electron-App && npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "  - Manten abiertas las ventanas de backend y ngrok" -ForegroundColor White
    Write-Host "  - Si cierras ngrok, ejecuta este script de nuevo" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ADVERTENCIA] No se pudo obtener la URL automaticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "  1. Abre: http://localhost:4040 para ver la URL manualmente" -ForegroundColor White
    Write-Host "  2. Ejecuta: .\actualizar-frontend-ngrok.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

