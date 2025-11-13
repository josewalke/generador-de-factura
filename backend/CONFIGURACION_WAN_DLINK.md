# 🔧 CONFIGURACIÓN WAN DEL D-LINK

## 📊 Configuración Actual

- **Internet Connection Type:** Dynamic IP (DHCP) ✅
- **Host Name:** dlinkrouter
- **Primary DNS:** Vacío (usa DHCP)
- **Secondary DNS:** Vacío
- **MTU:** 1500 ✅

---

## ✅ ESTO ESTÁ BIEN

La configuración actual es **correcta** para un router secundario:
- ✅ Dynamic IP (DHCP) es lo adecuado cuando el D-Link obtiene IP del router Orange
- ✅ MTU 1500 es el valor estándar
- ✅ DNS vacío usa los del router Orange (correcto)

---

## 🔍 LO QUE PODRÍA AYUDAR

### 1️⃣ Configurar IP Estática (Opcional pero Recomendado)

**Problema actual:**
- El D-Link obtiene IP dinámicamente del router Orange
- Si la IP cambia, el Port Forwarding en el router Orange dejaría de funcionar

**Solución:**

**Opción A: Reservar IP en el Router Orange (Recomendado)**
1. Accede al router Orange
2. Ve a "DHCP" → "Reservations" o "IP Reservations"
3. Reserva una IP para el D-Link (ej: `192.168.1.100`)
4. Usa la MAC Address del D-Link (está en la etiqueta del router)

**Opción B: Configurar IP Estática en el D-Link**
1. En esta misma página, cambia "Dynamic IP (DHCP)" a **"Static IP"**
2. Necesitarás:
   - **IP Address:** Una IP del rango del router Orange (ej: `192.168.1.100`)
   - **Subnet Mask:** Normalmente `255.255.255.0`
   - **Gateway:** IP del router Orange (ej: `192.168.1.1`)
   - **Primary DNS:** IP del router Orange o `8.8.8.8`
   - **Secondary DNS:** `8.8.4.4` (opcional)

⚠️ **IMPORTANTE:** Solo haz esto si sabes la configuración de red del router Orange.

---

### 2️⃣ Verificar que el D-Link Obtiene IP del Router Orange

**Cómo verificar:**
1. En el D-Link, ve a "STATUS" → "INTERNET" o "WAN STATUS"
2. Verifica que tenga:
   - Una IP del rango del router Orange (ej: `192.168.1.x`)
   - Gateway: IP del router Orange
   - DNS: IPs del router Orange o públicas

**Si NO tiene IP:**
- El D-Link no está conectado correctamente al router Orange
- Verifica el cable de red
- Verifica que el router Orange tenga DHCP habilitado

---

## ❌ ESTO NO ES LA SOLUCIÓN PRINCIPAL

La configuración WAN del D-Link está **correcta**. El problema principal es:

**El router Orange NO tiene Port Forwarding configurado hacia el D-Link.**

Aunque el D-Link esté perfectamente configurado, si el router Orange no redirige el tráfico, nunca llegará al D-Link.

---

## ✅ LO QUE REALMENTE NECESITAS HACER

### 1. En el Router Orange (LO MÁS IMPORTANTE):
- Configurar Port Forwarding: `8443` → IP del D-Link: `8443`
- O configurar DMZ hacia el D-Link

### 2. En el D-Link (Ya está bien, pero verifica):
- Port Forwarding: `8443` → `192.168.100.101:8443` ✓
- Inbound Filter: "Allow All"
- Firewall: TCP Endpoint Filtering = "Address Restricted"

---

## 🎯 RECOMENDACIÓN

**NO cambies la configuración WAN del D-Link** a menos que:
1. Sepas la configuración exacta del router Orange
2. Quieras configurar IP estática (opcional)

**Lo que SÍ debes hacer:**
1. **Accede al router Orange** (normalmente `192.168.1.1` o `192.168.0.1`)
2. **Configura Port Forwarding:** `8443` → IP del D-Link: `8443`
3. **Reinicia ambos routers**
4. **Prueba desde Internet:** `https://92.186.17.227:8443`

---

## 📋 RESUMEN

- ✅ La configuración WAN del D-Link está correcta
- ❌ El problema NO está aquí
- ✅ La solución está en configurar Port Forwarding en el **router Orange**

---

## 🔍 CÓMO SABER LA IP DEL D-LINK EN EL ROUTER ORANGE

1. En el D-Link, ve a "STATUS" → "INTERNET" o "WAN STATUS"
2. Mira la IP que tiene (ej: `192.168.1.100`)
3. Esa es la IP que debes usar en el Port Forwarding del router Orange

O:

1. Accede al router Orange
2. Ve a "DHCP" → "Client List" o "Connected Devices"
3. Busca el D-Link (por MAC Address o nombre)
4. Anota su IP

---

## ✅ DESPUÉS DE CONFIGURAR TODO

1. Port Forwarding en router Orange: `8443` → IP del D-Link: `8443`
2. Port Forwarding en D-Link: `8443` → `192.168.100.101:8443` ✓
3. Reinicia ambos routers
4. Prueba: `https://92.186.17.227:8443`

