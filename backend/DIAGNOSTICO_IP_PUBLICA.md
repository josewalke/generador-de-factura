# 🔍 DIAGNÓSTICO: IP Pública No Funciona

## ✅ Lo que SÍ funciona:
- ✅ Backend escuchando en `0.0.0.0:8443` (correcto)
- ✅ Firewall de Windows configurado
- ✅ Acceso local funciona (`https://192.168.100.101:8443`)

## ❌ Lo que NO funciona:
- ❌ Acceso desde Internet (`https://92.186.17.227:8443`) → `ERR_CONNECTION_REFUSED`

---

## 🔧 POSIBLES CAUSAS Y SOLUCIONES

### 1️⃣ **DOBLE ROUTER (Orange + D-Link)**

Si tienes **dos routers** (uno de Orange y el D-Link), el Port Forwarding solo en el D-Link **NO es suficiente**.

**Cómo verificar:**
1. Mira la **puerta de enlace** de tu servidor:
   ```powershell
   ipconfig | findstr "Puerta de enlace"
   ```
   - Si dice `192.168.100.1` → Solo D-Link (correcto)
   - Si dice otra IP (ej: `192.168.1.1`) → Hay otro router delante

2. Verifica si hay un router de Orange (ONT) conectado antes del D-Link.

**Solución si hay doble router:**
- Opción A: Configurar Port Forwarding también en el router de Orange hacia el D-Link
- Opción B: Poner el D-Link en **DMZ** en el router de Orange
- Opción C: Conectar el servidor directamente al router de Orange (si es posible)

---

### 2️⃣ **PORT FORWARDING MAL CONFIGURADO**

Verifica en el D-Link (`http://192.168.100.1`):

1. Ve a **"Advanced" → "Port Forwarding"** (o "Virtual Server")
2. Verifica que existe una regla para:
   - **External Port:** `8443`
   - **Internal IP:** `192.168.100.101`
   - **Internal Port:** `8443`
   - **Protocol:** `TCP`
   - **Status:** `Enabled` ✓

3. **Guarda** y **reinicia el router** (30 segundos desconectado)

---

### 3️⃣ **FIREWALL DEL ROUTER BLOQUEANDO**

En el D-Link, verifica:

1. **"Firewall Settings"**:
   - ✅ Enable SPI: **Marcado**
   - ✅ UDP Endpoint Filtering: **Endpoint Independent**
   - ✅ TCP Endpoint Filtering: **Address Restricted** (NO "Port And Address Restricted")
   - ✅ Enable anti-spoof checking: **Marcado**

2. **"Firewall Rules"** o **"Access Control"**:
   - Asegúrate de que NO hay reglas bloqueando el puerto 8443
   - Si hay reglas, agrega una excepción para permitir TCP 8443

---

### 4️⃣ **IP PÚBLICA CAMBIÓ**

Verifica que `92.186.17.227` sigue siendo tu IP pública:

```powershell
# En el servidor, ejecuta:
(Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content
```

Si la IP es diferente, actualiza:
- El Port Forwarding del router
- El frontend (`Telwagen-React-Electron-App/src/config/backend.ts`)

---

### 5️⃣ **PROVEEDOR BLOQUEANDO PUERTOS**

Algunos ISPs bloquean puertos entrantes. Prueba con otro puerto:

1. Cambia el puerto externo en el Port Forwarding a `443` (HTTPS estándar)
2. O prueba con `8080`, `8888`, etc.

---

## 🧪 PRUEBAS PASO A PASO

### Prueba 1: Verificar Port Forwarding desde el router
1. Accede al D-Link: `http://192.168.100.1`
2. Ve a **"Advanced" → "Port Forwarding"**
3. Verifica que la regla existe y está **Enabled**
4. Si no existe, créala:
   - **Name:** `Backend HTTPS`
   - **External Port:** `8443`
   - **Internal IP:** `192.168.100.101`
   - **Internal Port:** `8443`
   - **Protocol:** `TCP`
   - **Status:** `Enabled`
5. **Save Settings**
6. **Reinicia el router** (30 segundos)

### Prueba 2: Verificar desde otro ordenador en la misma red
Desde otro PC en la misma WiFi:
```
https://192.168.100.101:8443
```
- ✅ Si funciona → El problema es el Port Forwarding o doble router
- ❌ Si NO funciona → El problema es el firewall o el backend

### Prueba 3: Verificar IP pública actual
```powershell
(Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content
```
Compara con `92.186.17.227`. Si es diferente, actualiza todo.

### Prueba 4: Probar desde móvil con datos (4G/5G)
1. **Desconecta el WiFi** del móvil
2. Activa **datos móviles**
3. Abre: `https://92.186.17.227:8443`
4. Si funciona → ✅ Todo correcto
5. Si NO funciona → Problema de Port Forwarding o doble router

---

## 🎯 SOLUCIÓN RÁPIDA: Verificar Configuración Completa

Ejecuta este script en el servidor para verificar todo:

```powershell
Write-Host "=== DIAGNÓSTICO COMPLETO ===" -ForegroundColor Cyan
Write-Host ""

# 1. IP Local
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.100.*" }).IPAddress
Write-Host "IP Local: $localIP" -ForegroundColor Yellow

# 2. Puerta de enlace (router)
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0").NextHop
Write-Host "Router (Gateway): $gateway" -ForegroundColor Yellow

# 3. IP Pública
try {
    $publicIP = (Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content
    Write-Host "IP Pública: $publicIP" -ForegroundColor Yellow
    if ($publicIP -ne "92.186.17.227") {
        Write-Host "⚠️ La IP pública cambió. Actualiza el Port Forwarding y el frontend." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ No se pudo obtener IP pública" -ForegroundColor Red
}

# 4. Puerto escuchando
$port = netstat -ano | findstr :8443 | findstr LISTENING
if ($port) {
    Write-Host "✅ Puerto 8443 está escuchando" -ForegroundColor Green
} else {
    Write-Host "❌ Puerto 8443 NO está escuchando" -ForegroundColor Red
}

# 5. Firewall
$firewall = netsh advfirewall firewall show rule name="Node.js Backend - Puerto 8443"
if ($firewall -match "Habilitada.*S") {
    Write-Host "✅ Firewall de Windows configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Firewall de Windows NO configurado" -ForegroundColor Red
}
```

---

## 📞 SIGUIENTE PASO

**Dime qué resultado obtienes en cada prueba** y te ayudo a solucionarlo específicamente.

