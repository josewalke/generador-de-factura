# 🔐 HTTPS Automático - Sin Advertencias

Este sistema permite usar HTTPS **sin tener que aceptar certificados manualmente** en cada ordenador.

## 📋 Cómo Funciona

Usamos **mkcert** para generar certificados válidos localmente. Una vez instalada la CA root en cada ordenador, los certificados serán válidos automáticamente.

## 🚀 Instalación Rápida

### Paso 1: Instalar mkcert (solo una vez en el servidor)

**Windows:**
```powershell
# Opción 1: Con Chocolatey (recomendado)
choco install mkcert

# Opción 2: Manual
# 1. Descarga desde: https://github.com/FiloSottile/mkcert/releases
# 2. Busca: mkcert-v*-windows-amd64.exe
# 3. Renómbralo a mkcert.exe
# 4. Colócalo en una carpeta del PATH (ej: C:\Windows\System32)
```

**Linux/Mac:**
```bash
# Mac
brew install mkcert

# Debian/Ubuntu
apt install mkcert
```

### Paso 2: Generar Certificado Válido

```bash
cd backend
npm run cert:generate
```

Esto generará un certificado válido que incluye:
- localhost
- 127.0.0.1
- 192.168.100.101 (tu IP local)
- 92.186.17.227 (tu IP pública)

### Paso 3: Instalar CA Root en Cada Ordenador Cliente

**En cada ordenador que vaya a usar el backend:**

```powershell
# Windows (PowerShell como Administrador)
cd backend
.\instalar-ca-en-clientes.ps1

# O manualmente:
mkcert -install
```

**Linux:**
```bash
mkcert -install
```

**Mac:**
```bash
mkcert -install
```

### Paso 4: Reiniciar el Servidor Backend

```bash
npm run start:prod
```

## ✅ Resultado

Después de estos pasos:
- ✅ HTTPS funcionará sin advertencias
- ✅ No necesitarás aceptar certificados manualmente
- ✅ Funciona en todos los navegadores
- ✅ Funciona en todos los ordenadores con la CA instalada

## 🔄 Si Cambias de IP

Si tu IP local cambia, regenera el certificado:

```bash
cd backend
npm run cert:generate
```

Y reinicia el servidor.

## 📝 Notas

- La CA root solo necesita instalarse **una vez por ordenador**
- Los certificados generados son válidos por 1 año
- Para producción real, considera usar **Let's Encrypt** con un dominio

## 🆘 Solución de Problemas

**Error: "mkcert no encontrado"**
- Asegúrate de que mkcert está en el PATH
- O ejecuta desde el directorio donde está mkcert.exe

**Error: "No se puede instalar CA root"**
- Ejecuta PowerShell como Administrador
- O instala manualmente: `mkcert -install`

**Sigue mostrando advertencias**
- Verifica que la CA root está instalada: `mkcert -CAROOT`
- Reinicia el navegador después de instalar la CA

