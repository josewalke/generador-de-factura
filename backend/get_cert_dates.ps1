# Script para obtener información detallada de certificados
$certificados = Get-ChildItem -Path Cert:\CurrentUser\My

foreach ($cert in $certificados) {
    if ($cert.Subject -like "*JOSE JUAN PEREZ*") {
        Write-Host "=== CERTIFICADO ENCONTRADO ==="
        Write-Host "Subject: $($cert.Subject)"
        Write-Host "NotBefore: $($cert.NotBefore)"
        Write-Host "NotAfter: $($cert.NotAfter)"
        Write-Host "Thumbprint: $($cert.Thumbprint)"
        Write-Host "IsValid: $($cert.NotBefore -le (Get-Date) -and $cert.NotAfter -gt (Get-Date))"
        Write-Host "Días hasta expiración: $((($cert.NotAfter - (Get-Date)).Days))"
        Write-Host "============================="
    }
}
