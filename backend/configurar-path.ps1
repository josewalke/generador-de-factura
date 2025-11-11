# Script para configurar Node.js en el PATH permanentemente
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR NODE.JS EN PATH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$nodePath = "C:\Program Files\nodejs"

# Verificar si Node.js está instalado
if (-not (Test-Path $nodePath)) {
    Write-Host "❌ Node.js no encontrado en: $nodePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, verifica la instalación de Node.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js encontrado en: $nodePath" -ForegroundColor Green
Write-Host ""

# Obtener PATH actual del sistema
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Verificar si ya está en el PATH
if ($currentPath -like "*$nodePath*") {
    Write-Host "✅ Node.js ya está en el PATH del sistema" -ForegroundColor Green
} else {
    Write-Host "Agregando Node.js al PATH del sistema..." -ForegroundColor Yellow
    
    # Agregar al PATH del sistema (requiere permisos de administrador)
    try {
        $newPath = $currentPath + ";$nodePath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
        Write-Host "✅ Node.js agregado al PATH del sistema" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Reinicia PowerShell o la terminal para que los cambios surtan efecto" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Error: No se pudo agregar al PATH del sistema" -ForegroundColor Red
        Write-Host "   Ejecuta este script como Administrador" -ForegroundColor Yellow
        Write-Host "   O agrega manualmente: $nodePath" -ForegroundColor Yellow
    }
}

# Agregar al PATH de la sesión actual
$env:Path = "$nodePath;" + $env:Path
Write-Host "✅ Node.js agregado al PATH de esta sesión" -ForegroundColor Green
Write-Host ""

# Verificar
Write-Host "Verificando instalación..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error verificando Node.js" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

