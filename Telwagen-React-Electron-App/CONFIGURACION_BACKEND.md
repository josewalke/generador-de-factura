# Configuración del Backend para Acceso desde Red Local

## URL del Backend

La aplicación está configurada para usar la **IP pública de red local** en lugar de `localhost`, permitiendo conexiones desde otros ordenadores.

### URL Actual

```
http://192.168.100.101:3000
```

## Configuración

### Archivo: `src/config/backend.ts`

La URL del backend se configura en este archivo. Tiene dos formas de configurarse:

1. **Variable de entorno** (prioridad alta):
   ```env
   VITE_BACKEND_URL=http://192.168.100.101:3000
   ```

2. **Valor por defecto** en el código:
   ```typescript
   const PUBLIC_IP = '192.168.100.101';
   const PORT = '3000';
   ```

### Cambiar la IP del Backend

Si tu IP de red cambia o quieres usar otra IP:

**Opción 1: Variable de entorno (recomendado)**

Crea un archivo `.env` en la raíz de `Telwagen-React-Electron-App/`:

```env
VITE_BACKEND_URL=http://TU_IP:3000
```

**Opción 2: Editar directamente**

Edita `src/config/backend.ts` y cambia:
```typescript
const PUBLIC_IP = 'TU_IP_AQUI';
```

## Content Security Policy (CSP)

El CSP ha sido configurado para permitir conexiones a:
- `localhost` (desarrollo local)
- `192.168.*.*` (redes privadas clase C)
- `10.*.*.*` (redes privadas clase A)
- `172.16-31.*.*` (redes privadas clase B)

Esto permite que la aplicación se conecte al backend desde cualquier ordenador en la misma red local.

## Verificar la Conexión

### Desde la Aplicación

La aplicación verifica automáticamente la conexión al iniciar. Si hay problemas, verás un mensaje de error.

### Desde el Navegador (DevTools)

Abre las DevTools (F12) y en la consola verás:
- ✅ Si la conexión es exitosa
- ❌ Si hay errores de conexión

### Desde la Terminal

```bash
# Verificar que el backend responde
curl http://192.168.100.101:3000

# O desde PowerShell
Invoke-WebRequest -Uri http://192.168.100.101:3000
```

## Solución de Problemas

### Error: "Failed to fetch" o "Network Error"

1. **Verifica que el backend esté ejecutándose**:
   ```bash
   # En el servidor backend
   npm run start:prod
   ```

2. **Verifica la IP**:
   ```bash
   # En el servidor backend
   ipconfig | findstr IPv4
   ```

3. **Verifica el firewall**:
   - El puerto 3000 debe estar abierto en el firewall del servidor
   - Ejecuta `.\configurar-firewall.ps1` en el backend

4. **Verifica que ambos ordenadores estén en la misma red**

### Error: "CSP blocked"

Si ves errores de CSP, verifica que:
- La IP esté en el rango permitido (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- El CSP en `index.html` y `electron/main.js` incluya tu IP

## Notas

- La IP puede cambiar si usas DHCP. Considera configurar una IP estática en el servidor
- Para producción, considera usar un dominio o IP estática
- El backend debe estar configurado con `HOST=0.0.0.0` para aceptar conexiones externas

