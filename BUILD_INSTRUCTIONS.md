# Instrucciones para Crear el Ejecutable

## Requisitos Previos

1. Asegúrate de tener Node.js instalado
2. Instala las dependencias del proyecto:
   ```bash
   cd Telwagen-React-Electron-App
   npm install
   ```

## Comandos para Crear el Ejecutable

### Para Windows (NSIS Installer)
```bash
cd Telwagen-React-Electron-App
npm run build:win
```

O si quieres solo generar el ejecutable sin publicar:
```bash
npm run dist:win
```

### Para macOS (DMG)
```bash
cd Telwagen-React-Electron-App
npm run build:mac
```

O:
```bash
npm run dist:mac
```

### Para Linux (AppImage y DEB)
```bash
cd Telwagen-React-Electron-App
npm run build:linux
```

O:
```bash
npm run dist:linux
```

## Ubicación del Ejecutable

Una vez completado el build, encontrarás el ejecutable en:
- **Windows**: `Telwagen-React-Electron-App/dist/Generador de Facturas Telwagen Setup [version].exe`
- **macOS**: `Telwagen-React-Electron-App/dist/Generador de Facturas Telwagen-[version].dmg`
- **Linux**: `Telwagen-React-Electron-App/dist/` (AppImage y DEB)

## Proceso Completo

El proceso de build incluye:
1. **Incremento automático de versión** (ejecuta `increment-version.js`)
2. **Build de React** (compila la aplicación React con Vite)
3. **Build de Electron** (crea el ejecutable con electron-builder)

## Notas Importantes

- El backend se incluye automáticamente en el ejecutable (carpeta `extraResources`)
- El ejecutable incluye todas las dependencias necesarias
- El tamaño del ejecutable será considerable (~100-200 MB) debido a que incluye Chromium y Node.js

## Solución de Problemas

Si encuentras errores durante el build:
1. Asegúrate de tener todas las dependencias instaladas: `npm install`
2. Verifica que el icono existe en `assets/icon.png` y `assets/icon.ico`
3. Revisa que el backend esté en la ubicación correcta (`../backend`)



