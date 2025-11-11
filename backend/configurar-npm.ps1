# Script para configurar npm en PowerShell
# Ejecuta este script cada vez que abras PowerShell, o configúralo permanentemente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR NPM EN POWERSHELL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Agregar Node.js al PATH de esta sesión
$nodePath = "C:\Program Files\nodejs"
if (-not ($env:Path -like "*$nodePath*")) {
    $env:Path = "$nodePath;" + $env:Path
    Write-Host "✅ Node.js agregado al PATH de esta sesión" -ForegroundColor Green
} else {
    Write-Host "✅ Node.js ya está en el PATH" -ForegroundColor Green
}

# Verificar que funciona
Write-Host ""
Write-Host "Verificando instalación..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ ¡npm está disponible ahora!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Puedes usar:" -ForegroundColor Yellow
    Write-Host "  npm install" -ForegroundColor White
    Write-Host "  npm run start:prod" -ForegroundColor White
    Write-Host "  npm run migrate:postgresql" -ForegroundColor White
} catch {
    Write-Host "❌ Error: Node.js no encontrado en $nodePath" -ForegroundColor Red
    Write-Host "   Verifica que Node.js esté instalado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACIÓN PERMANENTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para que npm esté siempre disponible:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ejecuta este script cada vez que abras PowerShell:" -ForegroundColor White
Write-Host "   .\configurar-npm.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. O configúralo permanentemente (requiere Admin):" -ForegroundColor White
Write-Host "   [Environment]::SetEnvironmentVariable('Path', `$env:Path + ';C:\Program Files\nodejs', 'User')" -ForegroundColor Cyan
Write-Host ""

