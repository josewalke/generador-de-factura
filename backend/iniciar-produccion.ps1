# Script para iniciar el backend en producción
# Configura el PATH y ejecuta el servidor

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO BACKEND EN PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Agregar Node.js al PATH si no está
$nodePath = "C:\Program Files\nodejs"
if (-not ($env:Path -like "*$nodePath*")) {
    $env:Path = "$nodePath;" + $env:Path
    Write-Host "✅ Node.js agregado al PATH de esta sesión" -ForegroundColor Green
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "   Por favor, instala Node.js o ejecuta configurar-path.ps1" -ForegroundColor Yellow
    exit 1
}

# Cambiar al directorio backend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verificar que .env existe
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.production") {
        Write-Host "Copiando .env.production a .env..." -ForegroundColor Yellow
        Copy-Item ".env.production" ".env"
    } else {
        Write-Host "⚠️  Advertencia: No se encontró archivo .env" -ForegroundColor Yellow
    }
}

# Verificar dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

# Configurar entorno de producción
$env:NODE_ENV = "production"

Write-Host "Iniciando servidor en modo producción..." -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el servidor`n" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Iniciar servidor
node server.js

