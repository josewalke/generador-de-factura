# Electron App - Aplicación de Escritorio

## Descripción
Esta es una aplicación de escritorio desarrollada con Electron que proporciona una base sólida para crear aplicaciones multiplataforma.

## Características
- ✅ Aplicación de escritorio nativa
- ✅ Interfaz moderna y responsive
- ✅ Menús nativos del sistema operativo
- ✅ Acceso a APIs del sistema
- ✅ Notificaciones del sistema
- ✅ Configuración para empaquetado

## Estructura del Proyecto
```
electron-app/
├── src/
│   └── main.js          # Proceso principal de Electron
├── public/
│   ├── index.html       # Interfaz de usuario
│   ├── styles.css       # Estilos CSS
│   └── renderer.js      # Lógica del renderer process
├── dist/                # Archivos de distribución
└── package.json         # Configuración del proyecto
```

## Instalación

1. **Instalar dependencias:**
   ```bash
   cd electron-app
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm start
   ```

3. **Ejecutar con DevTools:**
   ```bash
   npm run dev
   ```

## Scripts Disponibles

- `npm start` - Ejecuta la aplicación
- `npm run dev` - Ejecuta con herramientas de desarrollo
- `npm run build` - Construye la aplicación para distribución
- `npm run pack` - Empaqueta la aplicación
- `npm run dist` - Crea instaladores

## Desarrollo

### Agregar Nuevas Funcionalidades

1. **Para funcionalidades del sistema:** Edita `src/main.js`
2. **Para la interfaz de usuario:** Edita `public/index.html`
3. **Para estilos:** Edita `public/styles.css`
4. **Para lógica del cliente:** Edita `public/renderer.js`

### Comunicación entre Procesos

- **Main → Renderer:** Usa `webContents.send()`
- **Renderer → Main:** Usa `ipcRenderer.send()`

## Empaquetado

La aplicación está configurada para crear instaladores para:
- macOS (.dmg)
- Windows (.exe)
- Linux (.AppImage)

## Personalización

1. **Cambiar el nombre:** Edita `package.json` → `name` y `productName`
2. **Cambiar el icono:** Reemplaza `public/icon.png`
3. **Modificar la ventana:** Edita las opciones en `src/main.js`
4. **Personalizar menús:** Modifica el template en `src/main.js`

## Tecnologías Utilizadas

- **Electron:** Framework para aplicaciones de escritorio
- **Node.js:** Runtime de JavaScript
- **HTML/CSS/JavaScript:** Frontend
- **electron-builder:** Herramienta de empaquetado

## Licencia

MIT License - Libre para uso comercial y personal.

## Soporte

Para reportar bugs o solicitar nuevas funcionalidades, crea un issue en el repositorio.
