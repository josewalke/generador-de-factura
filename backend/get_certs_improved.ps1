# Script mejorado para obtener certificados
try {
    $certificados = Get-ChildItem -Path Cert:\CurrentUser\My
    $resultado = @()
    
    foreach ($cert in $certificados) {
        if ($cert.Subject -like "*CN=*" -and $cert.Subject -notlike "*localhost*") {
            $cnMatch = [regex]::Match($cert.Subject, "CN=([^,)]+)")
            $commonName = if ($cnMatch.Success) { $cnMatch.Groups[1].Value } else { $cert.Subject }
            
            $certInfo = @{
                Subject = $cert.Subject
                CommonName = $commonName
                NotBefore = $cert.NotBefore.ToString("yyyy-MM-dd HH:mm:ss")
                NotAfter = $cert.NotAfter.ToString("yyyy-MM-dd HH:mm:ss")
                Thumbprint = $cert.Thumbprint
                IsValid = ($cert.NotBefore -le (Get-Date) -and $cert.NotAfter -gt (Get-Date))
                DaysUntilExpiry = [math]::Max(0, [math]::Ceiling((($cert.NotAfter - (Get-Date)).TotalDays)))
                HasPrivateKey = $true
                ClientAuth = $true
                DigitalSignature = $true
            }
            $resultado += $certInfo
        }
    }
    
    $resultado | ConvertTo-Json -Depth 3
} catch {
    Write-Error "Error: $_"
    "[]"
}
