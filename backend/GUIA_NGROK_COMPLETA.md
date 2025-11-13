# 🚀 GUÍA COMPLETA: ngrok para Acceso desde Internet

## ✅ VENTAJAS

- ✅ No necesitas tocar el router Orange
- ✅ Funciona inmediatamente
- ✅ HTTPS incluido (gratis)
- ✅ Fácil de configurar

---

## 📥 PASO 1: Instalar ngrok

### Opción A: Descarga Manual

1. Ve a: https://ngrok.com/download
2. Descarga "Windows (64-bit)"
3. Extrae el archivo `ngrok.exe`
4. Colócalo en una carpeta (ej: `C:\ngrok\`)
5. Agrega esa carpeta al PATH de Windows

### Opción B: Chocolatey (Si lo tienes)

```powershell
choco install ngrok
```

### Opción C: Scoop (Si lo tienes)

```powershell
scoop install ngrok
```

---

## 🔐 PASO 2: Crear Cuenta y Autenticarte

1. **Regístrate en ngrok:**
   - Ve a: https://dashboard.ngrok.com/signup
   - Crea una cuenta (gratis)

2. **Obtén tu authtoken:**
   - Ve a: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copia tu authtoken

3. **Configura ngrok:**
   ```powershell
   ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```

---

## 🚀 PASO 3: Iniciar el Túnel

1. **Asegúrate de que el backend esté corriendo:**
   ```powershell
   cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend"
   npm run start:prod
   ```

2. **Inicia ngrok en otra terminal:**
   ```powershell
   ngrok http 8443
   ```

3. **Verás algo como:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:8443
   ```

4. **Copia la URL HTTPS** (ej: `https://abc123.ngrok.io`)

---

## 🔧 PASO 4: Actualizar el Frontend

Actualiza el archivo `Telwagen-React-Electron-App/src/config/backend.ts`:

```typescript
const getBackendURL = (): string => {
  // Prioridad 1: Variable de entorno
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Prioridad 2: URL de ngrok (para acceso desde Internet)
  // Obtén esta URL ejecutando: ngrok http 8443
  return 'https://TU_URL_NGROK.ngrok.io';
};
```

**O usa variable de entorno:**

Crea un archivo `.env` en `Telwagen-React-Electron-App/`:

```
VITE_BACKEND_URL=https://TU_URL_NGROK.ngrok.io
```

---

## 🔄 PASO 5: Mantener ngrok Corriendo

**Opción A: Terminal Manual**
- Deja ngrok corriendo en una terminal
- Cada vez que reinicies, ejecuta: `ngrok http 8443`

**Opción B: Script Automático**

Crea un archivo `iniciar-ngrok.ps1`:

```powershell
# Iniciar backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend'; npm run start:prod"

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Iniciar ngrok
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 8443"
```

---

## 📋 VENTAJAS Y DESVENTAJAS

### ✅ Ventajas:
- Funciona sin tocar routers
- HTTPS incluido
- Fácil de configurar
- Gratis para desarrollo

### ⚠️ Desventajas:
- URL cambia cada vez (a menos que uses plan de pago)
- Límite de conexiones en plan gratis
- Dependes de un servicio externo
- No es ideal para producción

---

## 🎯 PARA PRODUCCIÓN

Si necesitas una solución permanente para producción:

1. **Plan de pago de ngrok:** URL fija y más conexiones
2. **Contactar con Orange:** Que configuren Port Forwarding
3. **Servicio VPS:** Mover el backend a un servidor en la nube
4. **Cloudflare Tunnel:** Alternativa gratuita con URL fija

---

## 🔍 VERIFICAR QUE FUNCIONA

1. Inicia ngrok: `ngrok http 8443`
2. Copia la URL HTTPS (ej: `https://abc123.ngrok.io`)
3. Abre en el navegador: `https://abc123.ngrok.io`
4. Deberías ver el JSON del backend ✅

---

## 📝 NOTAS IMPORTANTES

- **La URL de ngrok cambia cada vez** (a menos que uses plan de pago)
- **Debes actualizar el frontend** cada vez que cambies la URL
- **ngrok debe estar corriendo** mientras uses el backend desde Internet
- **Para desarrollo está bien**, para producción considera otras opciones

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "ngrok: command not found"
- ngrok no está en el PATH
- Ejecuta desde la carpeta donde está ngrok.exe
- O agrega la carpeta al PATH de Windows

### Error: "authtoken required"
- Necesitas autenticarte primero
- Ejecuta: `ngrok config add-authtoken TU_TOKEN`

### La URL no funciona
- Verifica que el backend esté corriendo en puerto 8443
- Verifica que ngrok esté apuntando al puerto correcto
- Revisa los logs de ngrok para ver errores

