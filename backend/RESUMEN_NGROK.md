# ✅ NGROK INSTALADO Y CONFIGURADO

## 🎉 Estado Actual

- ✅ **ngrok instalado** en `C:\ngrok\ngrok.exe`
- ✅ **Versión:** 3.33.0
- ✅ **Scripts creados** para facilitar el uso
- ✅ **Frontend actualizado** con IP correcta (`192.168.100.100`)

---

## 📋 PRÓXIMOS PASOS

### PASO 1: Crear Cuenta y Obtener Token

1. **Regístrate en ngrok (gratis):**
   - Ve a: https://dashboard.ngrok.com/signup
   - Crea una cuenta

2. **Obtén tu authtoken:**
   - Ve a: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copia tu authtoken

### PASO 2: Configurar Token

Ejecuta en PowerShell:

```powershell
cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend"
.\configurar-ngrok-token.ps1
```

Pega tu authtoken cuando te lo pida.

### PASO 3: Iniciar Backend + ngrok

Ejecuta:

```powershell
.\iniciar-backend-con-ngrok.ps1
```

Esto abrirá:
- **Ventana 1:** Backend corriendo
- **Ventana 2:** ngrok con la URL pública

**Copia la URL HTTPS** que aparece (ej: `https://abc123.ngrok.io`)

### PASO 4: Actualizar Frontend

**Opción A: Variable de entorno (Recomendado)**

Crea un archivo `.env` en `Telwagen-React-Electron-App/`:

```
VITE_BACKEND_URL=https://TU_URL_NGROK.ngrok.io
```

**Opción B: Editar código temporalmente**

Edita `Telwagen-React-Electron-App/src/config/backend.ts` y cambia la línea 24:

```typescript
return 'https://TU_URL_NGROK.ngrok.io';
```

---

## 🔄 USO DIARIO

Cada vez que quieras usar el backend desde Internet:

1. Ejecuta: `.\iniciar-backend-con-ngrok.ps1`
2. Copia la nueva URL de ngrok
3. Actualiza el frontend con esa URL
4. Listo ✅

---

## ⚠️ IMPORTANTE

- **La URL de ngrok cambia cada vez** que reinicias (a menos que uses plan de pago)
- **Debes actualizar el frontend** cada vez que cambies la URL
- **ngrok debe estar corriendo** mientras uses el backend desde Internet
- **Mantén las ventanas abiertas** (backend y ngrok)

---

## 📁 ARCHIVOS CREADOS

- `backend/instalar-ngrok.ps1` - Instala ngrok
- `backend/configurar-ngrok-token.ps1` - Configura authtoken
- `backend/iniciar-ngrok.ps1` - Inicia solo ngrok
- `backend/iniciar-backend-con-ngrok.ps1` - Inicia backend + ngrok
- `backend/LEER_PRIMERO_NGROK.md` - Guía completa
- `backend/RESUMEN_NGROK.md` - Este archivo

---

## 🎯 VENTAJAS

- ✅ No necesitas tocar el router Orange
- ✅ Funciona inmediatamente
- ✅ HTTPS incluido
- ✅ Gratis para desarrollo

---

## 📝 NOTAS

- Para producción, considera un plan de pago de ngrok (URL fija)
- O contacta con Orange para configurar Port Forwarding permanente

