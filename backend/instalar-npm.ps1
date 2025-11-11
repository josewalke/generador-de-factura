# Script para instalar y configurar npm permanentemente
# Ejecuta este script como Administrador para una configuración completa

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALACIÓN Y CONFIGURACIÓN DE NPM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js está instalado
$nodePath = "C:\Program Files\nodejs"
$nodeFound = $false

if (Test-Path "$nodePath\node.exe") {
    Write-Host "✅ Node.js encontrado en: $nodePath" -ForegroundColor Green
    $nodeFound = $true
} else {
    # Buscar en otras ubicaciones comunes
    $possiblePaths = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs",
        "$env:ProgramFiles\nodejs"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\node.exe") {
            Write-Host "✅ Node.js encontrado en: $path" -ForegroundColor Green
            $nodePath = $path
            $nodeFound = $true
            break
        }
    }
}

if (-not $nodeFound) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opciones para instalar Node.js:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Usando winget (recomendado):" -ForegroundColor White
    Write-Host "   winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Usando Chocolatey:" -ForegroundColor White
    Write-Host "   choco install nodejs-lts -y" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Descarga manual desde:" -ForegroundColor White
    Write-Host "   https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    
    # Intentar instalar con winget si está disponible
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "¿Instalar Node.js ahora con winget? (S/N): " -ForegroundColor Yellow -NoNewline
        $response = Read-Host
        if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
            Write-Host ""
            Write-Host "Instalando Node.js LTS..." -ForegroundColor Yellow
            winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Node.js instalado correctamente" -ForegroundColor Green
                $nodePath = "C:\Program Files\nodejs"
                $nodeFound = $true
            }
        }
    }
    
    if (-not $nodeFound) {
        Write-Host ""
        Write-Host "Por favor, instala Node.js y vuelve a ejecutar este script" -ForegroundColor Yellow
        exit 1
    }
}

# Configurar PATH
Write-Host ""
Write-Host "Configurando PATH..." -ForegroundColor Yellow

$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$currentMachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($currentUserPath -notlike "*$nodePath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentUserPath;$nodePath", "User")
    Write-Host "✅ PATH del usuario configurado" -ForegroundColor Green
} else {
    Write-Host "✅ Node.js ya está en el PATH del usuario" -ForegroundColor Green
}

# Verificar instalación
Write-Host ""
Write-Host "Verificando instalación..." -ForegroundColor Yellow

# Agregar al PATH de esta sesión para verificar
$env:Path = "$nodePath;" + $env:Path

try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host ""
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ INSTALACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "   Cierra y vuelve a abrir PowerShell para que los cambios surtan efecto" -ForegroundColor White
    Write-Host ""
    Write-Host "Después de reiniciar PowerShell, podrás usar:" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor White
    Write-Host "   npm run start:prod" -ForegroundColor White
    Write-Host "   npm --version" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Error al verificar la instalación" -ForegroundColor Red
    Write-Host "   Reinicia PowerShell y vuelve a intentar" -ForegroundColor Yellow
    Write-Host ""
}

