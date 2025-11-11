# Script de migración a PostgreSQL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRACION SQLITE A POSTGRESQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio backend
Set-Location backend

# Intentar encontrar Node.js
$nodePath = $null

# Buscar en ubicaciones comunes
$possiblePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:APPDATA\npm\node.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $nodePath = $path
        Write-Host "Node.js encontrado en: $path" -ForegroundColor Green
        break
    }
}

# Si no se encuentra, intentar desde PATH
if (-not $nodePath) {
    try {
        $nodeCmd = Get-Command node -ErrorAction Stop
        $nodePath = $nodeCmd.Source
        Write-Host "Node.js encontrado en PATH: $nodePath" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Node.js no encontrado." -ForegroundColor Red
        Write-Host "Por favor, instala Node.js o agrega Node.js al PATH." -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# Ejecutar migración
Write-Host ""
Write-Host "Ejecutando migración..." -ForegroundColor Yellow
Write-Host ""

try {
    & $nodePath migrar_a_postgresql.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  MIGRACION COMPLETADA EXITOSAMENTE" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ERROR EN LA MIGRACION" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
    }
} catch {
    Write-Host "Error ejecutando migración: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Presiona Enter para salir"

