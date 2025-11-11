# Script de PowerShell para iniciar el backend y la aplicación React + Electron
# Este script debe ejecutarse desde la raíz del proyecto

Write-Host "🚀 Iniciando Telwagen React + Electron App con Backend..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que existe el directorio backend
if (-not (Test-Path "../backend")) {
    Write-Host "❌ Error: No se encontró el directorio backend. Asegúrate de que existe ../backend/" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Directorio actual: $(Get-Location)" -ForegroundColor Blue
Write-Host "📁 Backend encontrado en: $(Resolve-Path ../backend)" -ForegroundColor Blue

# Función para limpiar procesos al salir
function Cleanup {
    Write-Host "🛑 Deteniendo procesos..." -ForegroundColor Yellow
    if ($backendJob) { Stop-Job $backendJob; Remove-Job $backendJob }
    if ($frontendJob) { Stop-Job $frontendJob; Remove-Job $frontendJob }
    exit 0
}

# Configurar manejo de señales
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Iniciar backend
    Write-Host "🔧 Iniciando backend..." -ForegroundColor Yellow
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        Set-Location ../backend
        npm start
    }
    Write-Host "✅ Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green

    # Esperar un poco para que el backend se inicie
    Start-Sleep -Seconds 3

    # Iniciar aplicación React + Electron
    Write-Host "⚛️ Iniciando aplicación React + Electron..." -ForegroundColor Yellow
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    Write-Host "✅ Aplicación iniciada (Job ID: $($frontendJob.Id))" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 ¡Aplicación iniciada correctamente!" -ForegroundColor Green
    Write-Host "📊 Backend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "⚛️ Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "🖥️ Electron: Se abrirá automáticamente" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener todos los procesos" -ForegroundColor Yellow

    # Mostrar logs de los jobs
    while ($true) {
        # Mostrar logs del backend
        if ($backendJob.State -eq "Running") {
            $backendOutput = Receive-Job $backendJob -ErrorAction SilentlyContinue
            if ($backendOutput) {
                Write-Host "[BACKEND] $backendOutput" -ForegroundColor Magenta
            }
        }

        # Mostrar logs del frontend
        if ($frontendJob.State -eq "Running") {
            $frontendOutput = Receive-Job $frontendJob -ErrorAction SilentlyContinue
            if ($frontendOutput) {
                Write-Host "[FRONTEND] $frontendOutput" -ForegroundColor Blue
            }
        }

        # Verificar si algún job terminó
        if ($backendJob.State -ne "Running" -or $frontendJob.State -ne "Running") {
            Write-Host "❌ Uno de los procesos terminó inesperadamente" -ForegroundColor Red
            break
        }

        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Cleanup
}
