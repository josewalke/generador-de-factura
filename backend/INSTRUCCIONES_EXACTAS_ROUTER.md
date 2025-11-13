# 🔧 INSTRUCCIONES EXACTAS PARA TU ROUTER D-Link

## 📋 CONFIGURACIÓN PASO A PASO

### PASO 1: Enable SPI
1. Busca **"Enable SPI:"** (arriba en la página)
2. **Marca el checkbox** (haz clic para que quede ✓)
3. Esto activa el firewall mejorado

---

### PASO 2: UDP Endpoint Filtering
1. Busca **"UDP Endpoint Filtering:"**
2. Selecciona: **"Endpoint Independent"**
3. (Esta es la opción más permisiva y permite conexiones)

---

### PASO 3: TCP Endpoint Filtering (MUY IMPORTANTE)
1. Busca **"TCP Endpoint Filtering:"**
2. Verás estas opciones:
   - ○ Address Restricted
   - ● Port And Address Restricted (probablemente está seleccionada)
3. **Selecciona: "Address Restricted"**
   - Esta es menos restrictiva que "Port And Address Restricted"
   - Permitirá conexiones entrantes desde Internet

---

### PASO 4: Anti-Spoof Checking
1. Busca **"Enable anti-spoof checking:"**
2. **Marca el checkbox** (haz clic para que quede ✓)
3. Esto mejora la seguridad sin bloquear el Port Forwarding

---

### PASO 5: Guardar
1. **Baja hasta el final de la página**
2. Haz clic en **"Save Settings"**
3. Espera 10 segundos para confirmar

---

### PASO 6: Reiniciar el Router
1. **Desconecta el router** de la corriente (desenchúfalo)
2. **Espera 30 segundos** (cuenta hasta 30)
3. **Vuelve a enchufar** el router
4. **Espera 2-3 minutos** hasta que todas las luces estén estables

---

### PASO 7: Probar
1. Espera 2-3 minutos después de que el router arranque
2. Abre el navegador en **otro ordenador** (o móvil con datos)
3. Ve a: `https://92.186.17.227:8443`
4. Si funciona, verás la página del backend ✅

---

## ✅ RESUMEN DE CAMBIOS

En "Firewall Settings" debes cambiar:

1. ✅ **Enable SPI:** Marcar checkbox
2. ✅ **UDP Endpoint Filtering:** "Endpoint Independent"
3. ✅ **TCP Endpoint Filtering:** "Address Restricted" (cambiar de "Port And Address Restricted")
4. ✅ **Enable anti-spoof checking:** Marcar checkbox
5. ✅ **Save Settings:** Hacer clic
6. ✅ **Reiniciar router:** Desconectar 30 seg, reconectar, esperar 2-3 min

---

## 🎯 CAMBIO MÁS IMPORTANTE

El cambio **MÁS IMPORTANTE** es:
- **TCP Endpoint Filtering:** Cambiar a **"Address Restricted"**

Esto es lo que probablemente está bloqueando las conexiones desde Internet.

