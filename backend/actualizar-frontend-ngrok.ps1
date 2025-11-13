# Script para actualizar el frontend con la URL de ngrok

$backendDir = Join-Path $PSScriptRoot ".."
$frontendDir = Join-Path $backendDir "Telwagen-React-Electron-App"
$ngrokUrlFile = Join-Path $PSScriptRoot "ngrok-url.txt"
$envFile = Join-Path $frontendDir ".env"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ACTUALIZAR FRONTEND CON URL NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Intentar obtener URL de ngrok
$ngrokUrl = $null

# Opción 1: Leer de archivo
if (Test-Path $ngrokUrlFile) {
    $ngrokUrl = (Get-Content $ngrokUrlFile -Raw).Trim()
    Write-Host "✅ URL encontrada en archivo: $ngrokUrl" -ForegroundColor Green
}

# Opción 2: Obtener de API de ngrok
if (-not $ngrokUrl) {
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = ($ngrokApi.tunnels | Where-Object { $_.proto -eq "https" -and $_.config.addr -like "*:8443" }).public_url
        if ($ngrokUrl) {
            Write-Host "✅ URL obtenida de ngrok: $ngrokUrl" -ForegroundColor Green
            # Guardar para uso futuro
            $ngrokUrl | Out-File -FilePath $ngrokUrlFile -Encoding UTF8
        }
    } catch {
        Write-Host "⚠️ No se pudo conectar a ngrok API" -ForegroundColor Yellow
    }
}

# Opción 3: Pedir al usuario
if (-not $ngrokUrl) {
    Write-Host "⚠️ No se pudo obtener la URL automáticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "1. Abre: http://localhost:4040 para ver la URL" -ForegroundColor White
    Write-Host "2. O mira la salida de ngrok" -ForegroundColor White
    Write-Host ""
    $ngrokUrl = Read-Host "Pega la URL de ngrok aquí (ej: https://abc123.ngrok.io)"
    
    if ([string]::IsNullOrWhiteSpace($ngrokUrl)) {
        Write-Host "❌ URL vacía. Operación cancelada." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Actualizando frontend..." -ForegroundColor Yellow

# Crear o actualizar archivo .env
$envContent = "VITE_BACKEND_URL=$ngrokUrl`n"

if (Test-Path $envFile) {
    # Leer archivo existente
    $existingContent = Get-Content $envFile -Raw
    if ($existingContent -match "VITE_BACKEND_URL=") {
        # Reemplazar línea existente
        $envContent = $existingContent -replace "VITE_BACKEND_URL=.*", "VITE_BACKEND_URL=$ngrokUrl"
    } else {
        # Agregar nueva línea
        $envContent = $existingContent + "`n" + "VITE_BACKEND_URL=$ngrokUrl"
    }
}

$envContent | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline

Write-Host "✅ Archivo .env actualizado: $envFile" -ForegroundColor Green
Write-Host "   VITE_BACKEND_URL=$ngrokUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Reinicia el frontend para aplicar los cambios:" -ForegroundColor Yellow
Write-Host "   cd `"$frontendDir`"" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

