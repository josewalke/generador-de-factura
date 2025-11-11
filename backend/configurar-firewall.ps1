# Script para configurar el firewall de Windows y permitir conexiones al puerto 3000
# Ejecuta este script como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR FIREWALL PARA BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Este script requiere permisos de Administrador" -ForegroundColor Yellow
    Write-Host "   Por favor, ejecuta PowerShell como Administrador" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Click derecho en PowerShell → Ejecutar como administrador" -ForegroundColor White
    exit 1
}

Write-Host "✅ Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# Verificar si la regla ya existe
$existingRule = Get-NetFirewallRule -DisplayName "Node.js Backend - Puerto 3000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "⚠️  La regla del firewall ya existe" -ForegroundColor Yellow
    Write-Host "   ¿Deseas eliminarla y recrearla? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Remove-NetFirewallRule -DisplayName "Node.js Backend - Puerto 3000"
        Write-Host "✅ Regla anterior eliminada" -ForegroundColor Green
    } else {
        Write-Host "✅ Usando regla existente" -ForegroundColor Green
        exit 0
    }
}

# Crear regla del firewall
Write-Host "Creando regla del firewall para puerto 3000..." -ForegroundColor Cyan

try {
    New-NetFirewallRule -DisplayName "Node.js Backend - Puerto 3000" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Permite conexiones entrantes al backend Node.js en puerto 3000"
    
    Write-Host ""
    Write-Host "✅ Regla del firewall creada exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "El servidor ahora puede recibir conexiones desde otros ordenadores" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs de acceso:" -ForegroundColor Yellow
    Write-Host "  - Local: http://localhost:3000" -ForegroundColor White
    Write-Host "  - Red local: http://TU_IP:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Para obtener tu IP, ejecuta:" -ForegroundColor Cyan
    Write-Host "  ipconfig | findstr /i IPv4" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Error creando regla del firewall:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta crear la regla manualmente desde el Firewall de Windows" -ForegroundColor Yellow
    exit 1
}

