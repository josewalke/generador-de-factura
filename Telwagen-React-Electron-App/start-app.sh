#!/bin/bash

# Script para iniciar el backend y la aplicación React + Electron
# Este script debe ejecutarse desde la raíz del proyecto

echo "🚀 Iniciando Telwagen React + Electron App con Backend..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que existe el directorio backend
if [ ! -d "../backend" ]; then
    echo "❌ Error: No se encontró el directorio backend. Asegúrate de que existe ../backend/"
    exit 1
fi

echo "📁 Directorio actual: $(pwd)"
echo "📁 Backend encontrado en: $(realpath ../backend)"

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo procesos..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Configurar trap para limpiar procesos
trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "🔧 Iniciando backend..."
cd ../backend
npm start &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Esperar un poco para que el backend se inicie
sleep 3

# Volver al directorio de la aplicación
cd ../Telwagen-React-Electron-App

# Iniciar aplicación React + Electron
echo "⚛️ Iniciando aplicación React + Electron..."
npm run dev &
FRONTEND_PID=$!
echo "✅ Aplicación iniciada (PID: $FRONTEND_PID)"

echo ""
echo "🎉 ¡Aplicación iniciada correctamente!"
echo "📊 Backend: http://localhost:3000"
echo "⚛️ Frontend: http://localhost:5173"
echo "🖥️ Electron: Se abrirá automáticamente"
echo ""
echo "Presiona Ctrl+C para detener todos los procesos"

# Esperar a que terminen los procesos
wait
