# 🔍 PROBLEMA: Ordenadores en Redes Diferentes

## ❌ El Problema

- **Servidor:** IP `192.168.100.101` (red `192.168.100.x`)
- **Otro ordenador:** IP `192.168.1.131` (red `192.168.1.x`)

**Están en redes diferentes**, por eso no pueden comunicarse directamente.

---

## ✅ SOLUCIÓN 1: Conectar el otro ordenador a la misma red

El otro ordenador debe estar conectado al **mismo router D-Link** (WiFi o cable) para tener IP `192.168.100.x`.

### Pasos:
1. En el otro ordenador, desconecta de la red actual
2. Conéctalo al WiFi del D-Link (o por cable al D-Link)
3. Verifica su nueva IP:
   ```powershell
   ipconfig | findstr "IPv4"
   ```
   Debe ser `192.168.100.x` (ej: `192.168.100.102`)
4. Prueba: `https://192.168.100.101:8443`

---

## ✅ SOLUCIÓN 2: Verificar que el backend funciona localmente

Antes de probar desde otros ordenadores, verifica que funciona en el mismo servidor:

### Prueba 1: Desde el navegador del servidor
```
https://localhost:8443
```
o
```
https://127.0.0.1:8443
```

### Prueba 2: Desde PowerShell del servidor
```powershell
# Ignorar certificado autofirmado
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$response = Invoke-WebRequest -Uri "https://localhost:8443" -UseBasicParsing
$response.StatusCode
```

Si esto NO funciona, el backend no está corriendo o hay un problema con el servidor.

---

## ✅ SOLUCIÓN 3: Verificar que el backend está corriendo

### Verificar proceso:
```powershell
# Ver si hay un proceso Node.js escuchando en 8443
netstat -ano | findstr :8443
```

Debe mostrar:
```
TCP    0.0.0.0:8443           0.0.0.0:0              LISTENING       [PID]
```

### Si NO está corriendo:
1. Ve al directorio del backend:
   ```powershell
   cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend"
   ```

2. Inicia el backend:
   ```powershell
   npm run start
   ```
   o
   ```powershell
   npm run start:prod
   ```

3. Espera a ver este mensaje:
   ```
   🔒 Servidor HTTPS ejecutándose en https://0.0.0.0:8443
   ```

---

## ✅ SOLUCIÓN 4: Verificar Firewall de Windows

Aunque ya configuramos el firewall, verifica que la regla está activa:

```powershell
netsh advfirewall firewall show rule name="Node.js Backend - Puerto 8443"
```

Debe mostrar:
```
Habilitada:                           Sí
```

Si dice "No", habilítala:
```powershell
netsh advfirewall firewall set rule name="Node.js Backend - Puerto 8443" new enable=yes
```

---

## 📋 CHECKLIST ANTES DE PROBAR DESDE OTRO ORDENADOR

- [ ] Backend corriendo (ver `netstat -ano | findstr :8443`)
- [ ] Funciona desde localhost: `https://localhost:8443`
- [ ] Firewall de Windows permite puerto 8443
- [ ] Otro ordenador conectado al mismo router D-Link
- [ ] Otro ordenador tiene IP `192.168.100.x` (NO `192.168.1.x`)
- [ ] Prueba desde otro ordenador: `https://192.168.100.101:8443`

---

## 🎯 ORDEN DE PRUEBAS

1. **Primero:** Verifica que funciona en el mismo servidor
   ```
   https://localhost:8443
   ```

2. **Segundo:** Verifica que el otro ordenador está en la misma red
   - IP debe ser `192.168.100.x`

3. **Tercero:** Prueba desde el otro ordenador
   ```
   https://192.168.100.101:8443
   ```

4. **Cuarto:** Si todo lo anterior funciona, prueba desde Internet
   ```
   https://92.186.17.227:8443
   ```

