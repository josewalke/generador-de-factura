# Guía Rápida de Telwagen

Este documento resume cómo preparar el entorno, arrancar cada servicio y generar builds de la aplicación Telwagen (backend Node.js + frontend React/Electron).

---

## 1. Requisitos previos

- **Node.js 18+** y **npm** instalados en el sistema.
- **Git** para clonar o actualizar el repositorio.
- **PostgreSQL 13+** si vas a usar la base de datos en modo producción (el backend puede funcionar en SQLite para pruebas).
- **OpenSSL / mkcert** si deseas certificados HTTPS locales (opcional).
- En Windows, se recomienda usar **PowerShell** o **Windows Terminal** con permisos de administrador para scripts que necesiten puertos <1024.

---

## 2. Configurar el backend (`/backend`)

```bash
cd backend
npm install
```

1. **Configurar la base de datos**  
   - Edita `config/config.js` y define `database.type` (`sqlite` o `postgresql`).  
   - Para PostgreSQL, actualiza `host`, `port`, `database`, `user`, `password`.

2. **Migraciones iniciales (opcional)**  
   - PostgreSQL: `npm run migrate:postgresql`.

3. **Variables opcionales**  
   - Crea un `.env` si necesitas sobreescribir puertos (`SERVER_PORT`, `SERVER_HOST`) o claves JWT.

4. **Arrancar en desarrollo**  
   ```bash
   npm run dev          # nodemon, útil para iteración rápida
   # o
   npm start            # nodos en modo clásico
   ```

5. **Arrancar en producción simple**  
   ```bash
   npm run start:prod   # NODE_ENV=production
   ```

6. **Con PM2 (servidor permanente)**  
   ```bash
   npm run pm2:start
   npm run pm2:restart
   npm run pm2:stop
   npm run pm2:logs
   ```

### 2.1 Exponer el backend con ngrok

1. Inicia sesión en ngrok y configura tu token (una sola vez):  
   ```bash
   ngrok config add-authtoken TU_TOKEN
   ```
2. Desde la carpeta `backend`, levanta el túnel apuntando al HTTPS interno del servidor (8443):  
   ```bash
   cd backend
   ngrok http https://localhost:8443 --host-header=rewrite
   ```
3. Copia la URL pública que muestra ngrok (algo como `https://xxxxx.ngrok-free.dev`) y actualiza `Telwagen-React-Electron-App/src/config/backend.ts` o las variables de entorno que uses para que el frontend apunte a esa URL. Recuerda mantener el header `ngrok-skip-browser-warning: true` en tus peticiones (ya lo hace el cliente actual).

> Nota: si prefieres reutilizar tu comando habitual de PowerShell, puedes ejecutar directamente  
> `C:\ngrok\ngrok.exe http 3000`  
> (equivale a exponer `http://localhost:3000`; ajusta el puerto si tu backend corre en otro).

---

## 3. Configurar el frontend/Electron (`/Telwagen-React-Electron-App`)

```bash
cd Telwagen-React-Electron-App
npm install
```

### 3.1 Desarrollo web (Vite)

```bash
npm run dev            # arranca Vite en http://localhost:5173
```

El frontend detecta el backend automáticamente si `backend/src/config/backend.ts` apunta a la URL correcta. Si usas ngrok u otra URL externa, ajusta ese archivo o las variables que carga.

### 3.2 Desarrollo Electron

```bash
npm run dev            # Vite
npm run dev:electron   # abre la app Desktop (requiere Vite corriendo)
```

> `dev:electron` espera a que Vite esté listo (http://localhost:5173) y luego ejecuta `electron .`.

### 3.3 Builds de escritorio

- **Build genérica (React + Electron Builder)**  
  ```bash
  npm run build
  ```
  Equivale a `npm run build:react` + `npm run build:electron`.

- **Targets específicos**  
  ```bash
  npm run build:win     # .exe / .msi (requiere Windows)
  npm run build:mac     # .dmg (requiere macOS)
  npm run build:linux   # AppImage + deb
  ```

- **Distribución firmada o con versionado automático**  
  ```bash
  npm run version:increment   # actualiza package.json
  npm run dist:win            # build Windows sin publicar
  npm run dist:mac            # idem para macOS
  npm run dist:linux          # idem Linux
  ```

Los artefactos se generan en `Telwagen-React-Electron-App/dist`. Electron Builder empaqueta también el backend (ver `extraResources` en `package.json`).

---

## 4. Puesta en marcha completa

1. **Backend**  
   ```bash
   cd backend
   npm run dev        # o npm start
   ```

2. **Frontend web** (para pruebas rápidas)  
   ```bash
   cd Telwagen-React-Electron-App
   npm run dev
   ```
   Accede a `http://localhost:5173`. Asegúrate de que `src/config/backend.ts` apunte al host/puerto donde corre el backend (local o ngrok).

3. **Aplicación Desktop**  
   - Con Vite en marcha, abre Electron con `npm run dev:electron`, o  
   - Usa una build generada (`dist/`) y distribúyela según el SO.

---

## 5. Scripts y tareas útiles

| Contexto | Script | Descripción |
|----------|--------|-------------|
| Backend  | `npm run dev` | Nodemon en caliente |
| Backend  | `npm run start:prod` | Modo producción simple |
| Backend  | `npm run pm2:*` | Gestor PM2 (start/stop/restart/logs) |
| Backend  | `npm run migrate:postgresql` | Migra datos de SQLite → PostgreSQL |
| Frontend | `npm run dev` | Vite + React |
| Frontend | `npm run dev:electron` | Lanza Electron tras levantar Vite |
| Frontend | `npm run build` | Build React + empaquetado Electron |
| Frontend | `npm run build:win` / `build:mac` / `build:linux` | Paquetes específicos |
| Frontend | `npm run dist:win` | Genera instalador Windows sin publicar |

---

## 6. Consejos finales

- **Logs**: el backend guarda trazas en `backend/logs`. Limpia periódicamente en producción.
- **Certificados HTTPS**: si no usas ngrok, puedes generar certificados locales con `npm run cert:generate` (backend).
- **Ngrok / URL externas**: actualiza `backend/src/config/backend.ts` (frontend) para incluir la URL pública y la cabecera `ngrok-skip-browser-warning`.
- **Backups**: la carpeta `backend/backups` puede crecer rápidamente; automatiza su rotación si corres tareas de respaldo.

Con estos pasos tienes control sobre la build, el arranque y la distribución de toda la plataforma Telwagen. Si necesitas documentación adicional (API, diseño de base de datos, etc.), crea nuevos archivos según sea necesario. ¡Buen trabajo!

