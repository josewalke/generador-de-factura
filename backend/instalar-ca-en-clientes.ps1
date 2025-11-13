# Script para instalar la CA root de mkcert en ordenadores cliente
# Esto permite que los certificados HTTPS sean válidos automáticamente

Write-Host "`n🔐 Instalador de CA Root para Certificados HTTPS`n" -ForegroundColor Cyan

# Verificar si mkcert está instalado
$mkcertPath = Get-Command mkcert -ErrorAction SilentlyContinue

if (-not $mkcertPath) {
    Write-Host "❌ mkcert no está instalado" -ForegroundColor Red
    Write-Host "`n📦 Instalación:" -ForegroundColor Yellow
    Write-Host "   Windows (con Chocolatey): choco install mkcert" -ForegroundColor White
    Write-Host "   O descarga desde: https://github.com/FiloSottile/mkcert/releases`n" -ForegroundColor White
    exit 1
}

Write-Host "✅ mkcert encontrado: $($mkcertPath.Source)" -ForegroundColor Green
Write-Host "`n🔐 Instalando CA root..." -ForegroundColor Yellow

try {
    # Instalar CA root
    & mkcert -install
    
    Write-Host "`n✅ CA root instalada correctamente" -ForegroundColor Green
    Write-Host "`n📋 Los certificados HTTPS generados con mkcert ahora serán válidos" -ForegroundColor Cyan
    Write-Host "   No necesitarás aceptar advertencias de seguridad`n" -ForegroundColor White
} catch {
    Write-Host "`n❌ Error instalando CA root: $_" -ForegroundColor Red
    exit 1
}

