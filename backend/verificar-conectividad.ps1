# Script para verificar conectividad del backend desde otro ordenador
# Ejecutar este script EN EL OTRO ORDENADOR (no en el servidor)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACIÓN DE CONECTIVIDAD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$serverIP = "192.168.100.101"
$port = 8443

Write-Host "1. Verificando conectividad básica (ping)..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $serverIP -Count 2 -Quiet
if ($pingResult) {
    Write-Host "   ✅ Ping exitoso a $serverIP" -ForegroundColor Green
} else {
    Write-Host "   ❌ No se puede hacer ping a $serverIP" -ForegroundColor Red
    Write-Host "   ⚠️  Verifica que ambos ordenadores estén en la misma red" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Verificando puerto $port (HTTPS)..." -ForegroundColor Yellow
try {
    $connection = Test-NetConnection -ComputerName $serverIP -Port $port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "   ✅ Puerto $port está abierto y accesible" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Puerto $port NO está accesible" -ForegroundColor Red
        Write-Host "   Detalles:" -ForegroundColor Yellow
        Write-Host "      - TcpTestSucceeded: $($connection.TcpTestSucceeded)" -ForegroundColor White
        Write-Host "      - RemoteAddress: $($connection.RemoteAddress)" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Error al verificar puerto: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Verificando conexión HTTPS..." -ForegroundColor Yellow
try {
    # Intentar conexión HTTPS (ignorar certificado autofirmado)
    $response = Invoke-WebRequest -Uri "https://${serverIP}:${port}" -SkipCertificateCheck -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Conexión HTTPS exitosa" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Error en conexión HTTPS: $_" -ForegroundColor Red
    Write-Host "   Mensaje: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Verificando IP local de este ordenador..." -ForegroundColor Yellow
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.100.*" }).IPAddress
if ($localIP) {
    Write-Host "   ✅ IP local: $localIP (misma red que el servidor)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Este ordenador NO está en la red 192.168.100.x" -ForegroundColor Yellow
    $allIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { -not $_.IPAddress.StartsWith("169.254") } | Select-Object -ExpandProperty IPAddress
    Write-Host "   IPs detectadas: $($allIPs -join ', ')" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

