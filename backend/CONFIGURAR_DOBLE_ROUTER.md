# 🔧 CONFIGURACIÓN: Doble Router (Orange + D-Link)

## 📋 Situación Actual

- **Router de Orange (ONT):** Recibe la IP pública `92.186.17.227`
- **D-Link:** Está detrás del router de Orange, tiene IP privada `192.168.100.1`
- **Servidor:** IP `192.168.100.101` conectado al D-Link

## ❌ Problema

El Port Forwarding solo en el D-Link NO funciona porque el router de Orange está bloqueando el tráfico entrante.

## ✅ SOLUCIÓN: Configurar Port Forwarding en AMBOS routers

### PASO 1: Configurar Port Forwarding en el Router de Orange

1. **Accede al router de Orange:**
   - Normalmente: `http://192.168.1.1` o `http://192.168.0.1`
   - O busca la IP en la etiqueta del router

2. **Ve a "Port Forwarding" o "Virtual Server" o "Reenvío de Puertos"**

3. **Crea una nueva regla:**
   - **Name:** `Backend HTTPS`
   - **External Port:** `8443`
   - **Internal IP:** `192.168.100.1` (IP del D-Link)
   - **Internal Port:** `8443`
   - **Protocol:** `TCP`
   - **Status:** `Enabled` ✓

4. **Guarda y reinicia el router de Orange**

### PASO 2: Verificar Port Forwarding en el D-Link

Ya está configurado, pero verifica:
- **TCP:** `8443`
- **IP Address:** `192.168.100.101`
- **Checkbox:** Marcado ✓

### PASO 3: Reiniciar ambos routers

1. Reinicia el router de Orange (30 segundos desconectado)
2. Reinicia el D-Link (30 segundos desconectado)
3. Espera 2-3 minutos a que ambos arranquen

### PASO 4: Probar desde Internet

Desde tu móvil con datos (4G/5G, sin WiFi):
```
https://92.186.17.227:8443
```

---

## 🎯 ALTERNATIVA: Usar DMZ en el Router de Orange

Si el Port Forwarding no funciona, usa DMZ:

1. **Accede al router de Orange**
2. **Ve a "DMZ" o "Zona Desmilitarizada"**
3. **Habilita DMZ**
4. **Pon la IP del D-Link:** `192.168.100.1`
5. **Guarda y reinicia**

⚠️ **NOTA:** DMZ expone el D-Link completamente a Internet. Asegúrate de que el D-Link tenga firewall activo.

---

## 📋 RESUMEN DE CONFIGURACIÓN

### Router de Orange:
- Port Forwarding: `8443` → `192.168.100.1:8443` (hacia el D-Link)

### D-Link:
- Port Forwarding: `8443` → `192.168.100.101:8443` (hacia el servidor)

### Flujo del tráfico:
```
Internet → Router Orange (8443) → D-Link (8443) → Servidor (192.168.100.101:8443)
```

---

## 🔍 CÓMO ENCONTRAR LA IP DEL ROUTER DE ORANGE

Si no sabes la IP del router de Orange:

1. En el servidor, ejecuta:
   ```powershell
   ipconfig | findstr "Puerta de enlace"
   ```
   Si dice `192.168.100.1` → Es el D-Link (no el de Orange)

2. Mira la etiqueta del router de Orange (suele tener la IP de acceso)

3. O prueba estas IPs comunes:
   - `192.168.1.1`
   - `192.168.0.1`
   - `192.168.2.1`

---

## ✅ DESPUÉS DE CONFIGURAR

1. Reinicia ambos routers
2. Espera 2-3 minutos
3. Prueba desde móvil con datos: `https://92.186.17.227:8443`
4. Si funciona → ✅ ¡Listo!
5. Si NO funciona → Contacta con Orange (pueden estar bloqueando puertos)

