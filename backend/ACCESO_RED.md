# Configuración para Acceso desde Otros Ordenadores

## ✅ Configuración Aplicada

El servidor ha sido configurado para aceptar peticiones desde otros ordenadores y servidores.

### Cambios Realizados

1. **HOST cambiado a `0.0.0.0`**: El servidor ahora escucha en todas las interfaces de red
2. **CORS configurado**: Permite peticiones desde cualquier origen en producción y desde la red local en desarrollo
3. **Puerto**: `3000` (configurable)

## 🔍 Obtener la IP de tu Ordenador

### Windows (PowerShell)
```powershell
ipconfig | findstr /i "IPv4"
```

### Windows (CMD)
```cmd
ipconfig
```

Busca la línea que dice "Dirección IPv4" o "IPv4 Address". Generalmente será algo como:
- `192.168.1.100`
- `10.0.0.50`
- `172.16.0.10`

## 📡 URLs para Acceso desde Otros Ordenadores

Una vez que tengas tu IP, otros ordenadores pueden acceder usando:

```
http://TU_IP:3000
```

Por ejemplo:
- `http://192.168.1.100:3000`
- `http://10.0.0.50:3000`

### Endpoints de Ejemplo

- `http://TU_IP:3000/api/clientes`
- `http://TU_IP:3000/api/facturas`
- `http://TU_IP:3000/api/productos`

## 🔥 Configurar Firewall de Windows

Para permitir conexiones entrantes en el puerto 3000:

### Opción 1: PowerShell (como Administrador)
```powershell
New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Opción 2: Interfaz Gráfica
1. Abre "Firewall de Windows Defender" desde el Panel de Control
2. Click en "Configuración avanzada"
3. Click en "Reglas de entrada" → "Nueva regla"
4. Selecciona "Puerto" → Siguiente
5. Selecciona "TCP" y escribe `3000` → Siguiente
6. Selecciona "Permitir la conexión" → Siguiente
7. Marca todos los perfiles → Siguiente
8. Nombre: "Node.js Backend" → Finalizar

## 🧪 Probar desde Otro Ordenador

### Desde otro ordenador en la misma red:

```bash
# cURL
curl http://TU_IP:3000/api/clientes

# O desde un navegador
http://TU_IP:3000
```

### Desde JavaScript (en otro proyecto)
```javascript
fetch('http://TU_IP:3000/api/clientes')
    .then(response => response.json())
    .then(data => console.log(data));
```

## ⚙️ Configuración Avanzada

### Cambiar el Puerto

Edita el archivo `.env`:
```env
PORT=3001
HOST=0.0.0.0
```

### Restringir CORS (Solo IPs Específicas)

Si quieres restringir el acceso solo a ciertos orígenes, edita `backend/config/config.js` y modifica la función `origin` en la sección `cors`.

### Acceso desde Internet (No Recomendado sin Seguridad)

⚠️ **ADVERTENCIA**: Exponer el servidor directamente a Internet sin seguridad adicional NO es recomendado.

Si necesitas acceso desde Internet:
1. Usa un servidor proxy (nginx, Apache)
2. Configura HTTPS/SSL
3. Implementa autenticación robusta
4. Considera usar un servicio como ngrok para desarrollo

## 🔒 Seguridad

- El servidor ahora acepta conexiones desde cualquier IP en la red local
- En producción, CORS permite todos los orígenes (puedes restringirlo)
- Asegúrate de tener autenticación configurada para endpoints sensibles
- Considera usar HTTPS en producción

## 📝 Notas

- La IP puede cambiar si usas DHCP. Considera configurar una IP estática si necesitas acceso permanente
- Si tienes problemas de conexión, verifica:
  1. Que el firewall permita el puerto 3000
  2. Que ambos ordenadores estén en la misma red
  3. Que el servidor esté ejecutándose
  4. Que no haya otro firewall (router, antivirus) bloqueando

