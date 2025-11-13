# 🎯 CONFIGURACIÓN FINAL: Router Orange

## 📊 INFORMACIÓN CRÍTICA DEL D-LINK

### WAN (Conexión al Router Orange):
- **IP Address del D-Link:** `192.168.1.114` ← **ESTA ES LA IP QUE NECESITAS**
- **Gateway (Router Orange):** `192.168.1.1`
- **Subnet Mask:** `255.255.255.0`

### LAN (Red Local del D-Link):
- **IP del D-Link:** `192.168.100.1`
- **Servidor:** `192.168.100.101` (verificar que sea esta IP)

---

## ✅ CONFIGURACIÓN EN EL ROUTER ORANGE

### Paso 1: Acceder al Router Orange

1. Abre el navegador
2. Ve a: `http://192.168.1.1` (IP del Gateway)
3. Inicia sesión (usuario/contraseña del router Orange)

### Paso 2: Configurar Port Forwarding

**Ubicación:** "Port Forwarding" o "Virtual Server" o "Reenvío de Puertos"

**Configuración:**
- **Name:** `Backend HTTPS`
- **External Port:** `8443`
- **Internal IP:** `192.168.1.114` ← **IP del D-Link (MUY IMPORTANTE)**
- **Internal Port:** `8443`
- **Protocol:** `TCP`
- **Status:** `Enabled` ✓

### Paso 3: Guardar y Reiniciar

1. **Guarda** la configuración
2. **Reinicia el router Orange** (30 segundos desconectado)
3. **Reinicia el D-Link** (30 segundos desconectado)
4. Espera 2-3 minutos a que ambos arranquen

---

## 🔍 VERIFICAR IP DEL SERVIDOR

El router muestra "SERVER" con IP `192.168.100.100`, pero necesitamos verificar que el servidor realmente tenga IP `192.168.100.101`.

**En el servidor, ejecuta:**
```powershell
ipconfig | findstr "IPv4"
```

**Debe mostrar:** `192.168.100.101`

**Si muestra otra IP:**
- Actualiza el Port Forwarding del D-Link con la IP correcta
- O configura IP estática en el servidor

---

## 📋 FLUJO COMPLETO DEL TRÁFICO

```
Internet
   ↓
[Router Orange] IP: 192.168.1.1
   Port Forwarding: 8443 → 192.168.1.114:8443 (D-Link)
   ↓
[D-Link] IP WAN: 192.168.1.114, IP LAN: 192.168.100.1
   Port Forwarding: 8443 → 192.168.100.101:8443 (Servidor)
   ↓
[Servidor] IP: 192.168.100.101
   Backend escuchando en puerto 8443
   ✅ Conexión exitosa
```

---

## ✅ CHECKLIST COMPLETO

### Router Orange:
- [ ] Acceso: `http://192.168.1.1`
- [ ] Port Forwarding configurado: `8443` → `192.168.1.114:8443`
- [ ] Port Forwarding habilitado
- [ ] Router reiniciado

### D-Link:
- [ ] Port Forwarding configurado: `8443` → `192.168.100.101:8443`
- [ ] Port Forwarding habilitado
- [ ] Inbound Filter: "Allow All"
- [ ] Firewall: TCP Endpoint Filtering = "Address Restricted"
- [ ] Router reiniciado

### Servidor:
- [ ] IP verificada: `192.168.100.101`
- [ ] Backend corriendo en puerto 8443
- [ ] Firewall de Windows permite puerto 8443

---

## 🧪 PRUEBA FINAL

Después de configurar todo:

1. **Reinicia ambos routers** (Orange y D-Link)
2. **Espera 2-3 minutos**
3. **Desde tu móvil con datos (4G/5G, sin WiFi):**
   ```
   https://92.186.17.227:8443
   ```
4. **Si funciona** → ✅ ¡Listo!
5. **Si NO funciona** → Verifica los logs del D-Link o contacta con Orange

---

## 🎯 RESUMEN

**La IP más importante es:**
- **`192.168.1.114`** ← IP del D-Link en la red del router Orange
- Esta es la IP que debes usar en el Port Forwarding del router Orange

**Configuración en Router Orange:**
- Port Forwarding: `8443` → `192.168.1.114:8443`

**Configuración en D-Link (ya está):**
- Port Forwarding: `8443` → `192.168.100.101:8443`

