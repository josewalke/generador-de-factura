# 🚀 CONFIGURACIÓN NGROK - LEE PRIMERO

## ✅ Scripts Creados

He creado estos scripts para facilitar el uso de ngrok:

1. **`instalar-ngrok.ps1`** - Instala ngrok automáticamente
2. **`configurar-ngrok-token.ps1`** - Configura tu authtoken de ngrok
3. **`iniciar-ngrok.ps1`** - Inicia solo ngrok
4. **`iniciar-backend-con-ngrok.ps1`** - Inicia backend + ngrok juntos

---

## 📋 PASOS PARA USAR NGROK

### PASO 1: Instalar ngrok

```powershell
cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend"
.\instalar-ngrok.ps1
```

Esto descargará e instalará ngrok en `C:\ngrok\`

---

### PASO 2: Crear Cuenta y Obtener Token

1. **Regístrate en ngrok (gratis):**
   - Ve a: https://dashboard.ngrok.com/signup
   - Crea una cuenta

2. **Obtén tu authtoken:**
   - Ve a: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copia tu authtoken

---

### PASO 3: Configurar Token

```powershell
.\configurar-ngrok-token.ps1
```

Pega tu authtoken cuando te lo pida.

---

### PASO 4: Iniciar Backend + ngrok

```powershell
.\iniciar-backend-con-ngrok.ps1
```

Esto iniciará:
- El backend en una ventana
- ngrok en otra ventana

**Copia la URL HTTPS** que aparece (ej: `https://abc123.ngrok.io`)

---

### PASO 5: Actualizar Frontend

**Opción A: Variable de entorno (Recomendado)**

Crea un archivo `.env` en `Telwagen-React-Electron-App/`:

```
VITE_BACKEND_URL=https://TU_URL_NGROK.ngrok.io
```

**Opción B: Editar código**

Edita `Telwagen-React-Electron-App/src/config/backend.ts` y cambia la URL.

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

## 🎯 VENTAJAS

- ✅ No necesitas tocar el router Orange
- ✅ Funciona inmediatamente
- ✅ HTTPS incluido
- ✅ Gratis para desarrollo

---

## 📝 NOTAS

- Para producción, considera un plan de pago de ngrok (URL fija)
- O contacta con Orange para configurar Port Forwarding permanente

