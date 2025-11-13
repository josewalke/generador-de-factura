# 🔧 SOLUCIONES EN D-LINK PARA ACCESO DESDE INTERNET

## ⚠️ IMPORTANTE

Aunque configures todo en el D-Link, **si el router Orange no tiene Port Forwarding, el tráfico nunca llegará al D-Link**. 

Pero hay algunas configuraciones que pueden ayudar:

---

## ✅ OPCIÓN 1: DMZ en el D-Link (Exponer el Servidor)

**Ubicación:** "ADVANCED" → "DMZ" o "ZONA DESMILITARIZADA"

**Configuración:**
1. Habilita DMZ
2. Pon la IP del servidor: `192.168.100.101`
3. Guarda y reinicia

**Qué hace:**
- Expone el servidor completamente a Internet (a través del D-Link)
- Redirige TODO el tráfico entrante al servidor
- Más simple que Port Forwarding, pero menos seguro

**⚠️ IMPORTANTE:**
- Asegúrate de que el firewall de Windows esté activo en el servidor
- Esto expone el servidor a Internet, así que ten cuidado con la seguridad

**Nota:** Esto solo funcionará si el router Orange también tiene Port Forwarding o DMZ configurado hacia el D-Link.

---

## ✅ OPCIÓN 2: Verificar y Ajustar NAT Settings

**Ubicación:** "ADVANCED" → "ADVANCED NETWORK" → "NAT"

**Configuración:**
1. Verifica que NAT esté **habilitado**
2. Modo NAT: Cambia a "Full Cone" o "Symmetric"
3. Si está en "Restricted", cámbialo
4. Guarda y reinicia

**Qué hace:**
- "Full Cone" es más permisivo y permite mejor conectividad desde Internet
- "Restricted" puede bloquear conexiones entrantes

---

## ✅ OPCIÓN 3: Configurar IP Estática para el D-Link en el Router Orange

**No es en el D-Link, pero es importante:**

El D-Link debe tener una IP estática o reservada en el router Orange para que el Port Forwarding funcione correctamente.

**En el Router Orange:**
1. Ve a "DHCP" → "Reservations" o "IP Reservations"
2. Reserva la IP del D-Link (ej: `192.168.1.100`)
3. O configura el D-Link con IP estática en el rango del Orange

**En el D-Link:**
1. Ve a "SETUP" → "INTERNET" o "WAN"
2. Si usas DHCP, verifica que obtiene IP del Orange
3. O configura IP estática si el Orange lo requiere

---

## ✅ OPCIÓN 4: Deshabilitar Firewall Temporalmente (Solo para Pruebas)

**Ubicación:** "ADVANCED" → "FIREWALL SETTINGS"

**⚠️ SOLO PARA PRUEBAS - NO PARA PRODUCCIÓN:**

1. Deshabilita temporalmente el firewall del D-Link
2. Prueba la conexión desde Internet
3. Si funciona, el problema era el firewall
4. Vuelve a habilitar el firewall y ajusta las reglas

**Configuración correcta del firewall:**
- Enable SPI: Marcado
- TCP Endpoint Filtering: "Address Restricted" (NO "Port And Address Restricted")
- UDP Endpoint Filtering: "Endpoint Independent"

---

## ✅ OPCIÓN 5: Verificar Inbound Filter

**Ubicación:** "ADVANCED" → "INBOUND FILTER"

**Configuración:**
1. Debe estar en "Allow All"
2. Si está en "Deny All", cámbialo a "Allow All"
3. Guarda y reinicia

**Qué hace:**
- "Deny All" bloquea TODO el tráfico entrante, incluso con Port Forwarding
- "Allow All" permite el tráfico que viene del Port Forwarding

---

## ✅ OPCIÓN 6: Verificar Access Control

**Ubicación:** "ADVANCED" → "ACCESS CONTROL"

**Configuración:**
1. Verifica que NO haya reglas bloqueando:
   - Puerto 8443
   - IP 192.168.100.101
   - Protocolo TCP
2. Si hay reglas, desactívalas temporalmente o crea excepciones
3. Guarda y reinicia

---

## ✅ OPCIÓN 7: UPnP (No Recomendado para Producción)

**Ubicación:** "ADVANCED" → "ADVANCED NETWORK" → "UPnP"

**Configuración:**
1. Habilita UPnP
2. El backend puede intentar abrir puertos automáticamente
3. Reinicia

**⚠️ NO RECOMENDADO:**
- UPnP es menos seguro
- Puede causar conflictos con Port Forwarding manual
- Solo para desarrollo, no para producción

---

## 🎯 CONFIGURACIÓN RECOMENDADA

### Para que funcione desde Internet, necesitas:

**1. En el Router Orange (LO MÁS IMPORTANTE):**
- Port Forwarding: 8443 → IP del D-Link (ej: 192.168.1.100:8443)
- O DMZ hacia el D-Link

**2. En el D-Link:**
- Port Forwarding: 8443 → 192.168.100.101:8443 (ya configurado)
- O DMZ hacia 192.168.100.101
- Inbound Filter: "Allow All"
- Firewall: TCP Endpoint Filtering = "Address Restricted"
- Access Control: Sin reglas bloqueando puerto 8443

---

## 📋 CHECKLIST COMPLETO

### D-Link:
- [ ] Port Forwarding: TCP 8443 → 192.168.100.101:8443 (habilitado)
- [ ] Inbound Filter: "Allow All"
- [ ] Firewall: TCP Endpoint Filtering = "Address Restricted"
- [ ] Access Control: Sin reglas bloqueando 8443
- [ ] NAT: Habilitado, modo "Full Cone" o "Symmetric"
- [ ] Router reiniciado

### Router Orange (FALTA ESTO):
- [ ] Port Forwarding: TCP 8443 → IP del D-Link:8443
- [ ] O DMZ hacia el D-Link

---

## 🔍 CÓMO VERIFICAR QUE EL D-LINK RECIBE TRÁFICO

1. Accede al D-Link: `http://192.168.100.1`
2. Ve a "STATUS" → "SYSTEM LOG" o "ROUTER STATUS"
3. Intenta conectarte desde Internet: `https://92.186.17.227:8443`
4. Mira los logs del D-Link
5. **Si ves intentos de conexión** → El router Orange está enviando tráfico, el problema está en el D-Link
6. **Si NO ves nada** → El problema está en el router Orange (no tiene Port Forwarding)

---

## ✅ SOLUCIÓN MÁS SIMPLE

**Si quieres probar rápido:**

1. **En el D-Link:**
   - Habilita DMZ hacia `192.168.100.101`
   - Inbound Filter: "Allow All"
   - Deshabilita Access Control temporalmente
   - Reinicia

2. **En el Router Orange:**
   - Configura Port Forwarding: 8443 → IP del D-Link:8443
   - O habilita DMZ hacia el D-Link
   - Reinicia

3. **Prueba desde Internet:**
   - `https://92.186.17.227:8443`

---

## 🆘 SI NADA FUNCIONA

Puede ser que:
1. **Orange bloquee puertos entrantes** en planes residenciales
2. **Necesites un plan de negocio** para abrir puertos
3. **Haya un firewall adicional** en el router Orange

En ese caso, contacta con Orange.

