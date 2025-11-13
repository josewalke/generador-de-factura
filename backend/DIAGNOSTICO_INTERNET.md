# 🔍 DIAGNÓSTICO: Acceso desde Internet

## ❌ Problema Actual
- `https://92.186.17.227:8443` → `ERR_CONNECTION_REFUSED`
- El backend funciona localmente
- Port Forwarding configurado en el router

---

## ✅ VERIFICACIONES NECESARIAS

### 1️⃣ Verificar que el Port Forwarding está correcto

En el D-Link (`http://192.168.100.1` → "ADVANCED" → "PORT FORWARDING"):

- ✅ **Name:** `Backend HTTPS`
- ✅ **TCP:** `8443` (NO 5443)
- ✅ **IP Address:** `192.168.100.101`
- ✅ **Checkbox:** Marcado (habilitado)
- ✅ **Schedule:** `Always`
- ✅ **Inbound Filter:** `Allow All`

**IMPORTANTE:** Guarda y reinicia el router después de cualquier cambio.

---

### 2️⃣ Verificar Firewall del Router

En el D-Link → "ADVANCED" → "FIREWALL SETTINGS":

- ✅ **Enable SPI:** Marcado
- ✅ **UDP Endpoint Filtering:** `Endpoint Independent`
- ✅ **TCP Endpoint Filtering:** `Address Restricted` (NO "Port And Address Restricted")
- ✅ **Enable anti-spoof checking:** Marcado

---

### 3️⃣ Verificar si hay DOBLE ROUTER (Orange + D-Link)

**Esto es MUY común y causa que el Port Forwarding no funcione.**

#### Cómo verificar:
1. Mira el cable que va del D-Link a la pared/ONT de Orange
2. Si hay un router blanco de Orange (ONT) antes del D-Link, ese es el problema

#### Solución si hay doble router:

**Opción A: Port Forwarding en el router de Orange**
1. Accede al router de Orange (normalmente `192.168.1.1` o `192.168.0.1`)
2. Configura Port Forwarding:
   - **External Port:** `8443`
   - **Internal IP:** `192.168.100.1` (IP del D-Link)
   - **Internal Port:** `8443`
   - **Protocol:** `TCP`

**Opción B: DMZ en el router de Orange**
1. Accede al router de Orange
2. Ve a "DMZ" o "Zona Desmilitarizada"
3. Pon la IP del D-Link: `192.168.100.1`
4. Esto redirige TODO el tráfico entrante al D-Link

---

### 4️⃣ Verificar que el ISP no bloquea puertos

Algunos ISPs (como Orange) bloquean puertos entrantes en planes residenciales.

**Cómo verificar:**
- Contacta con Orange y pregunta si bloquean puertos entrantes
- Pregunta si necesitas un plan de negocio para abrir puertos

---

### 5️⃣ Probar con otro puerto

Si el 8443 está bloqueado, prueba con el puerto 443 (HTTPS estándar):

1. En el D-Link, crea una nueva regla:
   - **TCP:** `443`
   - **IP Address:** `192.168.100.101`
   - **Internal Port:** `8443` (o cambia el backend a 443)

2. Prueba: `https://92.186.17.227:443`

---

### 6️⃣ Verificar IP pública actual

A veces la IP pública cambia. Verifica:

```powershell
(Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content
```

Si es diferente a `92.186.17.227`, actualiza el frontend.

---

## 🧪 PRUEBAS PASO A PASO

### Prueba 1: Desde el mismo servidor (debe funcionar)
```
https://localhost:8443
```
✅ Si funciona → Backend OK

### Prueba 2: Desde otro ordenador en la misma red local
```
https://192.168.100.101:8443
```
✅ Si funciona → Firewall de Windows OK

### Prueba 3: Desde Internet (móvil con datos 4G/5G)
```
https://92.186.17.227:8443
```
❌ Si NO funciona → Problema de Port Forwarding o doble router

---

## 🎯 CAUSA MÁS PROBABLE

**Doble router (Orange ONT + D-Link)**

Si tienes un router de Orange delante del D-Link, el Port Forwarding solo en el D-Link NO es suficiente. Necesitas configurarlo también en el router de Orange.

---

## 📋 CHECKLIST COMPLETO

- [ ] Port Forwarding configurado: TCP 8443 → 192.168.100.101:8443
- [ ] Port Forwarding habilitado (checkbox marcado)
- [ ] Router reiniciado después de cambios
- [ ] Firewall del router: TCP Endpoint Filtering = "Address Restricted"
- [ ] Verificado si hay router de Orange delante del D-Link
- [ ] Si hay doble router: Port Forwarding configurado también en Orange
- [ ] IP pública verificada: `92.186.17.227`
- [ ] Probado desde móvil con datos (4G/5G, NO WiFi)

---

## 🆘 SI NADA FUNCIONA

1. **Contacta con Orange:**
   - Pregunta si bloquean puertos entrantes
   - Pregunta si necesitas un plan de negocio

2. **Usa un servicio de túnel (temporal para desarrollo):**
   - **ngrok:** `ngrok http 8443`
   - **Cloudflare Tunnel**
   - Esto es solo para desarrollo, no para producción

