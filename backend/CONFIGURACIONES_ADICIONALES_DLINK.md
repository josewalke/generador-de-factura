# 🔧 CONFIGURACIONES ADICIONALES EN D-LINK

## ✅ Ya Configurado

1. ✅ Port Forwarding: TCP 8443 → 192.168.100.101:8443
2. ✅ Firewall Settings: TCP Endpoint Filtering = "Address Restricted"

---

## 🔍 CONFIGURACIONES ADICIONALES A VERIFICAR

### 1️⃣ NAT Settings / NAT Mode

**Ubicación:** "ADVANCED" → "ADVANCED NETWORK" o "NAT"

**Verificar:**
- ✅ NAT debe estar **habilitado**
- ✅ Modo NAT: "Full Cone" o "Symmetric" (no "Restricted")

**Si está en modo "Restricted":**
- Cambia a "Full Cone" o "Symmetric"
- Guarda y reinicia

---

### 2️⃣ WAN Settings / Internet Connection

**Ubicación:** "SETUP" → "INTERNET" o "WAN"

**Verificar:**
- ✅ Tipo de conexión: "Static IP" o "DHCP" (según tu configuración)
- ✅ Si es "Static IP", verifica que la IP del D-Link sea correcta
- ✅ Gateway: Debe ser la IP del router Orange (ej: `192.168.1.1`)

**Importante:**
- El D-Link debe poder comunicarse con el router Orange
- Verifica que el D-Link tenga acceso a Internet

---

### 3️⃣ Access Control / Network Filter

**Ubicación:** "ADVANCED" → "ACCESS CONTROL" o "NETWORK FILTER"

**Verificar:**
- ❌ NO debe haber reglas bloqueando el puerto 8443
- ❌ NO debe haber reglas bloqueando la IP `192.168.100.101`
- ✅ Si hay reglas, desactívalas temporalmente para probar

**Si hay reglas activas:**
- Crea una excepción para permitir TCP 8443
- O desactiva temporalmente el Access Control

---

### 4️⃣ Inbound Filter

**Ubicación:** "ADVANCED" → "INBOUND FILTER"

**Verificar:**
- ✅ Debe estar en "Allow All" o tener excepción para puerto 8443
- ❌ Si está en "Deny All", cambia a "Allow All"

---

### 5️⃣ Firewall Rules (Reglas Específicas)

**Ubicación:** "ADVANCED" → "FIREWALL SETTINGS" → "FIREWALL RULES"

**Verificar:**
- ✅ NO debe haber reglas bloqueando puerto 8443
- ✅ NO debe haber reglas bloqueando IP 192.168.100.101
- ✅ Si hay reglas, agrega una excepción para permitir TCP 8443

---

### 6️⃣ DMZ (Alternativa al Port Forwarding)

**Ubicación:** "ADVANCED" → "DMZ" o "ZONA DESMILITARIZADA"

**Si el Port Forwarding no funciona, puedes usar DMZ:**

1. Habilita DMZ
2. Pon la IP del servidor: `192.168.100.101`
3. Guarda y reinicia

⚠️ **NOTA:** DMZ expone el servidor completamente. Asegúrate de que el firewall de Windows esté activo.

---

### 7️⃣ UPnP (Universal Plug and Play)

**Ubicación:** "ADVANCED" → "ADVANCED NETWORK" → "UPnP"

**Verificar:**
- ✅ UPnP puede estar interfiriendo con Port Forwarding
- ⚠️ Si está habilitado, prueba deshabilitarlo temporalmente
- Luego reinicia y prueba el Port Forwarding

---

### 8️⃣ Virtual Server (Verificar que esté activo)

**Ubicación:** "ADVANCED" → "VIRTUAL SERVER" o "PORT FORWARDING"

**Verificar:**
- ✅ La regla "Backend HTTPS" debe estar **habilitada** (checkbox marcado)
- ✅ Schedule debe ser "Always" (no "Never" o un horario específico)
- ✅ Inbound Filter debe ser "Allow All"

---

### 9️⃣ Router Mode vs Bridge Mode

**Ubicación:** "SETUP" → "INTERNET" o "WAN"

**Verificar:**
- ✅ El D-Link debe estar en modo **Router** (no Bridge)
- ✅ Si está en Bridge, el Port Forwarding no funcionará

---

## 📋 CHECKLIST COMPLETO D-LINK

Antes de probar desde Internet, verifica:

- [ ] Port Forwarding configurado: TCP 8443 → 192.168.100.101:8443
- [ ] Port Forwarding **habilitado** (checkbox marcado)
- [ ] Schedule: "Always"
- [ ] Inbound Filter: "Allow All"
- [ ] Firewall Settings: TCP Endpoint Filtering = "Address Restricted"
- [ ] Firewall Settings: Enable SPI = Marcado
- [ ] Access Control: NO reglas bloqueando puerto 8443
- [ ] Inbound Filter: "Allow All" (no "Deny All")
- [ ] NAT habilitado
- [ ] WAN configurado correctamente (puede comunicarse con router Orange)
- [ ] Router en modo Router (no Bridge)
- [ ] Router reiniciado después de cambios

---

## 🎯 CONFIGURACIÓN MÁS IMPORTANTE

La configuración **MÁS IMPORTANTE** además del Port Forwarding es:

1. **Firewall Settings:**
   - TCP Endpoint Filtering: "Address Restricted" (NO "Port And Address Restricted")

2. **Inbound Filter:**
   - Debe ser "Allow All" o tener excepción para 8443

3. **Access Control:**
   - NO debe haber reglas bloqueando el puerto 8443

---

## 🔍 CÓMO VERIFICAR QUE EL D-LINK RECIBE TRÁFICO

1. Accede al D-Link: `http://192.168.100.1`
2. Ve a "STATUS" → "ROUTER STATUS" o "SYSTEM LOG"
3. Intenta conectarte desde Internet: `https://92.186.17.227:8443`
4. Mira los logs del D-Link
5. Si ves intentos de conexión → El router Orange está enviando tráfico
6. Si NO ves nada → El problema está en el router Orange

---

## ✅ DESPUÉS DE VERIFICAR TODO

1. Verifica todas las configuraciones anteriores
2. Guarda cambios en el D-Link
3. Reinicia el D-Link
4. Configura Port Forwarding en el router Orange (esto es lo MÁS importante)
5. Reinicia el router Orange
6. Prueba desde Internet: `https://92.186.17.227:8443`

---

## 🆘 SI SIGUE SIN FUNCIONAR

El problema más probable es que **falta configurar el Port Forwarding en el router Orange**. 

El D-Link puede estar perfectamente configurado, pero si el router Orange no redirige el tráfico, nunca llegará al D-Link.

