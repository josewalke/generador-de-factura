# 🔍 VERIFICACIÓN DETALLADA DEL PORT FORWARDING

## ❌ Problema: `ERR_CONNECTION_REFUSED` desde Internet

Aunque el Port Forwarding está configurado, sigue sin funcionar. Vamos a verificar todo paso a paso.

---

## ✅ PASO 1: Verificar que el backend está escuchando

En el servidor, ejecuta:
```powershell
netstat -ano | findstr :8443
```

Debe mostrar:
```
TCP    0.0.0.0:8443           0.0.0.0:0              LISTENING
```

Si NO aparece, el backend no está corriendo. Reinícialo.

---

## ✅ PASO 2: Verificar Port Forwarding en el D-Link

1. Accede: `http://192.168.100.1`
2. Ve a **"ADVANCED" → "PORT FORWARDING"**
3. Verifica que la regla "Backend HTTPS" tenga:
   - ✅ **TCP:** `8443` (NO 5443)
   - ✅ **IP Address:** `192.168.100.101`
   - ✅ **Checkbox:** Marcado (habilitado)
   - ✅ **Schedule:** `Always`
   - ✅ **Inbound Filter:** `Allow All`

4. Si está todo correcto, haz clic en **"Save Settings"**
5. **Reinicia el router** otra vez (30 segundos desconectado)

---

## ✅ PASO 3: Verificar Firewall del Router

1. En el D-Link, ve a **"ADVANCED" → "FIREWALL SETTINGS"**
2. Verifica:
   - ✅ **Enable SPI:** Marcado
   - ✅ **UDP Endpoint Filtering:** `Endpoint Independent`
   - ✅ **TCP Endpoint Filtering:** `Address Restricted` (NO "Port And Address Restricted")
   - ✅ **Enable anti-spoof checking:** Marcado
3. **Save Settings**

---

## ✅ PASO 4: Verificar que NO hay reglas bloqueando

1. En el D-Link, ve a **"ADVANCED" → "ACCESS CONTROL"** o **"NETWORK FILTER"**
2. Verifica que NO hay reglas bloqueando el puerto 8443 o la IP `192.168.100.101`
3. Si hay reglas, desactívalas temporalmente para probar

---

## ✅ PASO 5: Probar desde la red local primero

Antes de probar desde Internet, verifica que funciona desde la red local:

**Desde otro ordenador en la misma WiFi:**
```
https://192.168.100.101:8443
```

- ✅ Si funciona → El backend está bien, el problema es el Port Forwarding
- ❌ Si NO funciona → El problema es el firewall de Windows o el backend

---

## ✅ PASO 6: Verificar IP pública actual

A veces la IP pública cambia. Verifica:
```powershell
(Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content
```

Si es diferente a `92.186.17.227`, actualiza:
- El Port Forwarding (no es necesario, pero verifica)
- El frontend (`Telwagen-React-Electron-App/src/config/backend.ts`)

---

## ✅ PASO 7: Probar con otro puerto

Si el 8443 sigue sin funcionar, prueba con el puerto 443 (HTTPS estándar):

1. En el D-Link, crea una nueva regla de Port Forwarding:
   - **Name:** `Backend HTTPS 443`
   - **TCP:** `443`
   - **IP Address:** `192.168.100.101`
   - **Schedule:** `Always`
   - **Inbound Filter:** `Allow All`

2. En el backend, cambia el puerto HTTPS a 443 (o crea una regla adicional)

3. Prueba: `https://92.186.17.227:443`

---

## 🎯 POSIBLES CAUSAS ESPECÍFICAS

### Causa 1: Router de Orange delante del D-Link
Aunque la puerta de enlace es `192.168.100.1`, puede haber un router de Orange (ONT) que también necesita Port Forwarding.

**Solución:** Accede al router de Orange (normalmente `192.168.1.1` o `192.168.0.1`) y configura Port Forwarding hacia el D-Link.

### Causa 2: ISP bloqueando puertos
Algunos ISPs bloquean puertos entrantes en planes residenciales.

**Solución:** Contacta con tu ISP (Orange) y pregunta si bloquean puertos entrantes.

### Causa 3: Firewall del router muy restrictivo
Aunque configuraste el firewall, puede haber otras reglas bloqueando.

**Solución:** Temporalmente, desactiva el firewall del router para probar (solo para diagnóstico).

---

## 📋 CHECKLIST COMPLETO

Antes de probar desde Internet, verifica:

- [ ] Backend escuchando en `0.0.0.0:8443`
- [ ] Firewall de Windows permite puerto 8443
- [ ] Port Forwarding configurado: TCP 8443 → 192.168.100.101:8443
- [ ] Port Forwarding habilitado (checkbox marcado)
- [ ] Router reiniciado después de cambios
- [ ] Firewall del router: TCP Endpoint Filtering = "Address Restricted"
- [ ] Funciona desde red local: `https://192.168.100.101:8443`
- [ ] IP pública correcta: `92.186.17.227`

---

## 🆘 SI NADA FUNCIONA

1. **Prueba con HTTP en lugar de HTTPS:**
   - Port Forwarding: TCP 3000 → 192.168.100.101:3000
   - Prueba: `http://92.186.17.227:3000` (sin 's' en http)

2. **Contacta con Orange:**
   - Pregunta si bloquean puertos entrantes
   - Pregunta si necesitas un plan de negocio para abrir puertos

3. **Usa un servicio de túnel (temporal):**
   - ngrok: `ngrok http 8443`
   - Cloudflare Tunnel
   - Esto es solo para desarrollo, no para producción

