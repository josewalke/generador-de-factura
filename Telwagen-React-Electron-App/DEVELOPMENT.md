# Configuración de desarrollo para Telwagen React + Electron

## Comandos disponibles:

### Desarrollo
- `npm run dev` - Ejecuta React y Electron en modo desarrollo
- `npm run dev:react` - Solo servidor de desarrollo React (puerto 5173)
- `npm run dev:electron` - Solo Electron (requiere React corriendo)

### Producción
- `npm run build` - Construye React y prepara Electron
- `npm run build:react` - Solo build de React
- `npm run build:electron` - Solo build de Electron
- `npm run dist` - Crea distribución ejecutable
- `npm run pack` - Crea paquete sin instalador

## Estructura del proyecto:

```
Telwagen-React-Electron-App/
├── electron/           # Archivos de Electron
│   ├── main.js        # Proceso principal
│   └── preload.js     # Script de precarga seguro
├── src/               # Código fuente React
│   ├── components/    # Componentes UI
│   ├── App.tsx        # Componente principal
│   └── main.tsx       # Punto de entrada
├── dist/              # Build de producción
└── assets/            # Recursos estáticos
```

## Características implementadas:

✅ React 18 con TypeScript
✅ Tailwind CSS para estilos
✅ Radix UI para componentes
✅ Electron para aplicación de escritorio
✅ Configuración de build completa
✅ Menú de aplicación nativo
✅ Comunicación segura entre procesos
✅ Integración con backend existente

## Próximos pasos:

1. Corregir importaciones incorrectas en componentes UI
2. Probar todas las funcionalidades
3. Optimizar el tamaño del bundle
4. Crear instaladores para diferentes plataformas
