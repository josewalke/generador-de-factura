# 🔧 INSTRUCCIONES PARA CONFIGURAR EL FIREWALL DEL ROUTER

## 📋 PASO A PASO - MUY DETALLADO

### PASO 1: Abre la configuración del Firewall

1. Abre tu navegador (Chrome, Edge, etc.)
2. Ve a: `http://192.168.100.1`
3. Si te pide usuario/contraseña, entra con tus credenciales
4. En el menú de la izquierda, haz clic en **"FIREWALL SETTINGS"**
   - Ya deberías estar ahí si ves la página que me mostraste

---

### PASO 2: Habilita SPI (Stateful Packet Inspection)

1. Busca la sección que dice **"FIREWALL SETTINGS"**
2. Verás un checkbox que dice **"Enable SPI:"**
3. **Marca ese checkbox** (haz clic para que quede con una ✓)
4. Esto activa el firewall mejorado

---

### PASO 3: Cambia el NAT TCP Filtering

1. Busca la sección que dice **"NAT ENDPOINT FILTERING"**
2. Dentro de esa sección, busca **"TCP Endpoint Filtering:"**
3. Verás 3 opciones (botones circulares):
   - ○ Endpoint Independent
   - ○ Address Restricted
   - ● Port And Address Restricted (esta está seleccionada ahora)
4. **Haz clic en "Endpoint Independent"** (el primer botón circular)
5. Esto permitirá conexiones desde Internet

---

### PASO 4: Guarda los cambios

1. **MUY IMPORTANTE:** Haz clic en el botón **"Save Settings"** (abajo de la página)
2. Espera a que la página confirme que se guardaron los cambios
3. Si no hay confirmación, espera 10 segundos

---

### PASO 5: Reinicia el router

1. **Desconecta el router de la corriente eléctrica**
   - Desenchúfalo completamente
2. **Espera 30 segundos** (cuenta hasta 30)
3. **Vuelve a conectar el router a la corriente**
4. **Espera 2-3 minutos** para que el router arranque completamente
   - Verás que las luces del router se encienden y parpadean
   - Espera hasta que todas las luces estén estables

---

### PASO 6: Verifica que funciona

1. Espera 2-3 minutos después de que el router arranque
2. Abre el navegador en **otro ordenador** (o desde tu móvil con datos móviles)
3. Ve a: `https://92.186.17.227:8443`
4. Si funciona, verás la página del backend
5. Si no funciona, espera 1 minuto más y prueba de nuevo

---

## ✅ RESUMEN DE CAMBIOS

En la página "Firewall Settings" debes cambiar:

1. ✅ **Enable SPI:** Marcar el checkbox
2. ✅ **TCP Endpoint Filtering:** Cambiar a "Endpoint Independent"
3. ✅ **Save Settings:** Hacer clic en el botón
4. ✅ **Reiniciar router:** Desconectar 30 seg, reconectar, esperar 2-3 min

---

## 🆘 SI SIGUE SIN FUNCIONAR

Si después de hacer todo esto sigue sin funcionar:

1. Verifica que el Port Forwarding sigue activo:
   - Ve a "Virtual Server"
   - Verifica que el checkbox de "Backend HTTPS" esté marcado
   - Si no está marcado, márcalo y haz "Save Settings"

2. Prueba desde otro ordenador en otra red (no la misma WiFi):
   - Usa datos móviles en el móvil
   - O prueba desde otro lugar con otra conexión a Internet

3. Contacta a tu proveedor de Internet (ISP):
   - Algunos ISPs bloquean ciertos puertos
   - Pregunta si el puerto 8443 está bloqueado

---

## 📞 NOTAS IMPORTANTES

- **NO cambies nada más** en el router, solo lo indicado arriba
- **Guarda siempre** después de cada cambio
- **Reinicia el router** después de guardar cambios importantes
- El servidor backend ya está funcionando correctamente, el problema es solo el router

