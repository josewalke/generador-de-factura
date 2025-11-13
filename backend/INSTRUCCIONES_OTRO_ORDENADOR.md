# 🖥️ INSTRUCCIONES PARA USAR EN OTRO ORDENADOR

## 📋 Requisitos Previos

1. **Node.js instalado** (versión 18 o superior)
2. **Git instalado**
3. **Conexión a Internet**

---

## 🚀 Pasos para Configurar

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd generador-de-factura
```

### 2. Instalar Dependencias del Frontend

```bash
cd Telwagen-React-Electron-App
npm install
```

### 3. Configurar URL del Backend

El frontend está configurado para usar la URL de ngrok automáticamente desde la variable de entorno.

**Opción A: Usar variable de entorno (Recomendado)**

Crea un archivo `.env` en `Telwagen-React-Electron-App/`:

```env
VITE_BACKEND_URL=https://unencountered-fabiola-constrictedly.ngrok-free.dev
```

**Opción B: La URL ya está configurada por defecto**

El archivo `src/config/backend.ts` ya tiene la URL de ngrok como fallback.

### 4. Iniciar el Frontend

```bash
npm run dev
```

El frontend se abrirá en `http://localhost:5173`

---

## ⚠️ IMPORTANTE: Primera Vez con ngrok

**La primera vez que uses la URL de ngrok desde un navegador nuevo:**

1. Abre en el navegador: `https://unencountered-fabiola-constrictedly.ngrok-free.dev`
2. Verás una página de advertencia de ngrok
3. Haz clic en **"Visit Site"** o **"Continue"**
4. Después de esto, el frontend funcionará correctamente

**Nota:** Solo necesitas hacer esto una vez por navegador/sesión.

---

## 🔄 Si la URL de ngrok Cambia

Si el servidor reinicia ngrok y obtiene una nueva URL:

1. El servidor actualizará automáticamente el archivo `.env` del frontend
2. O actualiza manualmente el archivo `.env` con la nueva URL
3. Reinicia el frontend

---

## 📝 Verificar Conexión

Para verificar que todo funciona:

1. Abre el frontend en el navegador
2. Deberías ver el dashboard sin errores
3. Si hay errores, verifica la consola del navegador (F12)

---

## 🆘 Solución de Problemas

### Error: "No se pudo conectar con el servidor"

- Verifica que el backend esté corriendo en el servidor
- Verifica que ngrok esté activo
- Verifica la URL en el archivo `.env`

### Error: "CORS policy"

- El backend ya está configurado para permitir CORS
- Si persiste, verifica que el backend esté reiniciado

### Error: "ngrok está bloqueando la petición"

- Visita la URL de ngrok en el navegador primero
- Haz clic en "Visit Site"
- Reinicia el frontend

---

## ✅ Estado Actual

- **Backend URL:** `https://unencountered-fabiola-constrictedly.ngrok-free.dev`
- **Frontend:** Configurado para usar ngrok automáticamente
- **CORS:** Configurado correctamente
- **Headers:** Configurados para ngrok

---

## 📞 Soporte

Si tienes problemas, verifica:
1. Que el backend esté corriendo en el servidor
2. Que ngrok esté activo
3. Que hayas visitado la URL de ngrok en el navegador al menos una vez

