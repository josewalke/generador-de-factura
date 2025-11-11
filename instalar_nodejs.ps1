# Script para instalar Node.js automáticamente
# Requiere ejecutarse como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALACION DE NODE.JS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya está instalado
$nodeInstalled = $false
if (Get-Command node -ErrorAction SilentlyContinue) {
    $version = node --version
    Write-Host "✅ Node.js ya está instalado: $version" -ForegroundColor Green
    $nodeInstalled = $true
} else {
    # Buscar en ubicaciones comunes
    $commonPaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:ProgramFiles\nodejs\node.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Host "✅ Node.js encontrado en: $path" -ForegroundColor Green
            $nodeInstalled = $true
            break
        }
    }
}

if ($nodeInstalled) {
    Write-Host ""
    Write-Host "Node.js ya está disponible. Verificando npm..." -ForegroundColor Yellow
    
    # Verificar npm
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = npm --version
        Write-Host "✅ npm disponible: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  npm no encontrado en PATH" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Puedes ejecutar la migración ahora:" -ForegroundColor Cyan
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  npm run migrate:postgresql" -ForegroundColor White
    exit 0
}

Write-Host "Node.js no está instalado." -ForegroundColor Yellow
Write-Host ""

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Este script requiere permisos de Administrador" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "1. Ejecutar este script como Administrador (clic derecho > Ejecutar como administrador)" -ForegroundColor White
    Write-Host "2. Instalar Node.js manualmente desde: https://nodejs.org/" -ForegroundColor White
    Write-Host ""
    
    # Intentar abrir el sitio web
    $response = Read-Host "¿Deseas abrir la página de descarga de Node.js? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Start-Process "https://nodejs.org/"
    }
    
    exit 1
}

Write-Host "Descargando instalador de Node.js LTS..." -ForegroundColor Yellow

# URL del instalador de Node.js LTS para Windows x64
$nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
$installerPath = "$env:TEMP\nodejs-installer.msi"

try {
    # Descargar el instalador
    Write-Host "Descargando desde: $nodeUrl" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing
    
    Write-Host "✅ Descarga completada" -ForegroundColor Green
    Write-Host ""
    Write-Host "Instalando Node.js..." -ForegroundColor Yellow
    Write-Host "Por favor, sigue las instrucciones del instalador." -ForegroundColor Cyan
    Write-Host ""
    
    # Ejecutar el instalador
    Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait -Verb RunAs
    
    Write-Host ""
    Write-Host "✅ Instalación completada" -ForegroundColor Green
    Write-Host ""
    
    # Actualizar PATH en la sesión actual
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verificar instalación
    Start-Sleep -Seconds 2
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $version = node --version
        Write-Host "✅ Node.js instalado correctamente: $version" -ForegroundColor Green
        
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            $npmVersion = npm --version
            Write-Host "✅ npm instalado: $npmVersion" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  INSTALACION COMPLETADA" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora puedes ejecutar la migración:" -ForegroundColor Cyan
        Write-Host "  cd backend" -ForegroundColor White
        Write-Host "  npm run migrate:postgresql" -ForegroundColor White
    } else {
        Write-Host "⚠️  Node.js instalado pero no disponible en PATH" -ForegroundColor Yellow
        Write-Host "Por favor, reinicia la terminal o PowerShell" -ForegroundColor Yellow
    }
    
    # Limpiar
    Remove-Item $installerPath -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Error durante la instalación: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instala Node.js manualmente desde:" -ForegroundColor Yellow
    Write-Host "https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

