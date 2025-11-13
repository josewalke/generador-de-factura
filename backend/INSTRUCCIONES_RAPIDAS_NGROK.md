# 🚀 INSTRUCCIONES RÁPIDAS: Usar ngrok

## ✅ TODO LISTO

- ✅ ngrok instalado
- ✅ Scripts creados
- ✅ Frontend configurado para usar variable de entorno

---

## 📋 PASOS RÁPIDOS

### PASO 1: Configurar Token (Solo la primera vez)

1. **Crea cuenta:** https://dashboard.ngrok.com/signup
2. **Obtén token:** https://dashboard.ngrok.com/get-started/your-authtoken
3. **Ejecuta:**
   ```powershell
   cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend"
   .\configurar-ngrok-token.ps1
   ```
4. Pega tu token cuando te lo pida

---

### PASO 2: Iniciar Todo (Cada vez que quieras usar)

**Ejecuta este comando:**

```powershell
cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\backend"
.\iniciar-todo-ngrok.ps1
```

**Esto hará automáticamente:**
1. ✅ Inicia el backend
2. ✅ Inicia ngrok
3. ✅ Obtiene la URL externa
4. ✅ Actualiza el frontend con esa URL

**Verás algo como:**
```
🌐 URL Pública: https://abc123.ngrok.io
✅ Frontend actualizado con URL: https://abc123.ngrok.io
```

---

### PASO 3: Reiniciar Frontend

```powershell
cd "C:\Users\Administrador\Desktop\Proyectos\generador-de-factura\Telwagen-React-Electron-App"
npm run dev
```

El frontend usará automáticamente la URL de ngrok desde el archivo `.env`.

---

## 🎯 USO DIARIO

**Cada vez que quieras usar el backend desde Internet:**

1. Ejecuta: `.\iniciar-todo-ngrok.ps1`
2. Copia la URL que aparece
3. Reinicia el frontend
4. Listo ✅

---

## 📁 ARCHIVOS CREADOS

- `backend/iniciar-todo-ngrok.ps1` ⭐ **USA ESTE** - Inicia todo automáticamente
- `backend/iniciar-con-ngrok.ps1` - Solo inicia backend + ngrok
- `backend/actualizar-frontend-ngrok.ps1` - Actualiza frontend manualmente
- `backend/configurar-ngrok-token.ps1` - Configura token (solo primera vez)

---

## ⚠️ IMPORTANTE

- **Mantén las ventanas abiertas** (backend y ngrok)
- **La URL cambia cada vez** que reinicias ngrok
- **Ejecuta el script de nuevo** si reinicias para actualizar el frontend

---

## 🔍 VERIFICAR QUE FUNCIONA

1. Ejecuta `.\iniciar-todo-ngrok.ps1`
2. Copia la URL (ej: `https://abc123.ngrok.io`)
3. Abre en el navegador: `https://abc123.ngrok.io`
4. Deberías ver el JSON del backend ✅

---

## 🆘 SI ALGO FALLA

**No se obtiene la URL automáticamente:**
- Abre: http://localhost:4040
- Copia la URL manualmente
- Ejecuta: `.\actualizar-frontend-ngrok.ps1`
- Pega la URL cuando te la pida

