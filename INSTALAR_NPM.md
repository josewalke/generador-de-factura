# 📦 Instalación de npm en Windows

## ✅ Estado Actual

npm **YA ESTÁ INSTALADO** en tu sistema junto con Node.js v20.11.0.

El problema es que no está en el PATH del sistema, por lo que PowerShell no lo encuentra automáticamente.

## 🔧 Solución Aplicada

He configurado npm en el PATH del sistema. Ahora necesitas:

### 1. Cerrar y Reabrir PowerShell

Los cambios en el PATH requieren reiniciar la terminal.

### 2. Verificar que Funciona

Después de reabrir PowerShell, ejecuta:

```powershell
npm --version
```

Deberías ver: `10.2.4` (o similar)

## 🚀 Uso Rápido (Sin Reiniciar)

Si no quieres reiniciar PowerShell ahora, ejecuta esto cada vez:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm --version
```

## 📋 Comandos npm Disponibles

Una vez configurado, podrás usar:

```powershell
# Instalar dependencias
npm install

# Iniciar servidor en producción
npm run start:prod

# Ejecutar migración
npm run migrate:postgresql

# Ver todos los scripts disponibles
npm run
```

## ✅ Verificación

Para verificar que todo está bien:

```powershell
node --version    # Debe mostrar: v20.11.0
npm --version     # Debe mostrar: 10.2.4
```

## 🎉 ¡Listo!

npm está instalado y configurado. Solo necesitas reiniciar PowerShell para que esté disponible permanentemente.

