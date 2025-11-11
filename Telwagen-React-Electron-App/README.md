# 🚗 Telwagen React + Electron App

Una aplicación de escritorio moderna para la gestión de facturas, construida con React, TypeScript, Tailwind CSS y Electron, completamente integrada con una base de datos SQLite.

## ✨ Características

- **🖥️ Aplicación de Escritorio**: Electron para distribución multiplataforma
- **⚛️ Frontend Moderno**: React 18 con TypeScript y Tailwind CSS
- **🗄️ Base de Datos**: SQLite con backend Express.js
- **🎨 UI Profesional**: Componentes Radix UI accesibles
- **📊 Gestión Completa**: Clientes, coches, empresas y facturas
- **🔍 Búsqueda Avanzada**: Filtros y paginación
- **📱 Responsive**: Interfaz adaptable
- **🔒 Seguridad**: Comunicación segura entre procesos

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Backend ejecutándose en `../backend`

### Instalación

1. **Clonar e instalar dependencias**:
   ```bash
   cd Telwagen-React-Electron-App
   npm install
   ```

2. **Iniciar el backend** (en otra terminal):
   ```bash
   cd ../backend
   npm start
   ```

3. **Iniciar la aplicación**:
   ```bash
   npm run dev
   ```

### Scripts Automatizados

#### Windows (PowerShell):
```powershell
.\start-app.ps1
```

#### Linux/Mac (Bash):
```bash
chmod +x start-app.sh
./start-app.sh
```

## 📋 Comandos Disponibles

### Desarrollo
- `npm run dev` - Desarrollo completo (React + Electron)
- `npm run dev:react` - Solo servidor React (puerto 5173)
- `npm run dev:electron` - Solo Electron

### Producción
- `npm run build` - Build completo
- `npm run build:react` - Solo build React
- `npm run dist` - Crear distribución ejecutable

## 🏗️ Arquitectura

```
Telwagen-React-Electron-App/
├── electron/              # Proceso principal de Electron
│   ├── main.js           # Configuración de Electron
│   └── preload.js        # Script de precarga seguro
├── src/                  # Código fuente React
│   ├── components/       # Componentes UI
│   │   ├── ui/          # Biblioteca de componentes
│   │   └── screens/     # Pantallas principales
│   ├── services/         # Servicios API
│   ├── hooks/           # Hooks personalizados
│   ├── config/          # Configuración
│   └── App.tsx          # Componente principal
├── assets/              # Recursos estáticos
└── dist/               # Build de producción
```

## 🔗 Integración con Backend

### Endpoints Disponibles

- **Clientes**: `/api/clientes`
- **Coches**: `/api/coches`
- **Empresas**: `/api/empresas`
- **Facturas**: `/api/facturas`

### Servicios Implementados

- ✅ `clienteService` - Gestión completa de clientes
- ✅ `cocheService` - Gestión de vehículos
- ✅ `empresaService` - Gestión de empresas
- ✅ `facturaService` - Gestión de facturas

### Hooks Personalizados

- ✅ `useClientes` - Estado y operaciones de clientes
- ✅ `useCoches` - Estado y operaciones de coches
- ✅ `useEmpresas` - Estado y operaciones de empresas
- ✅ `useFacturas` - Estado y operaciones de facturas

## 🎯 Funcionalidades

### Dashboard
- Vista general del sistema
- Estadísticas en tiempo real
- Estado de conexión con backend
- Navegación rápida

### Gestión de Clientes
- ✅ Listado completo de clientes
- ✅ Crear, editar y eliminar clientes
- ✅ Búsqueda por nombre, CIF o email
- ✅ Validación de campos requeridos

### Gestión de Coches
- ✅ Listado de todos los coches
- ✅ Coches disponibles y vendidos
- ✅ CRUD completo
- ✅ Búsqueda y filtros

### Gestión de Empresas
- ✅ Listado paginado
- ✅ Gestión de certificados digitales
- ✅ Estadísticas de empresas
- ✅ Búsqueda avanzada

### Gestión de Facturas
- ✅ Listado con filtros avanzados
- ✅ Generación automática de números
- ✅ Estadísticas de ingresos
- ✅ Filtros por fecha, cliente, empresa

## 🔧 Configuración

### Variables de Entorno

```typescript
// Configuración del backend
API_BASE_URL = 'http://localhost:3000'
TIMEOUT = 10000
CACHE_TTL = 300000
```

### Configuración de Electron

```javascript
// electron/main.js
const isDev = process.env.NODE_ENV === 'development';
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
});
```

## 📦 Distribución

### Crear Instaladores

```bash
# Windows
npm run dist

# Solo empaquetar (sin instalador)
npm run pack
```

### Plataformas Soportadas

- **Windows**: Instalador NSIS
- **macOS**: App Bundle
- **Linux**: AppImage

## 🐛 Solución de Problemas

### Error de ES Modules
Si ves el error `require is not defined in ES module scope`:
- Los archivos de Electron ya están convertidos a ES modules
- Verifica que `"type": "module"` esté en package.json

### Error de Conexión con Backend
Si el backend no se conecta:
1. Verifica que el backend esté ejecutándose en puerto 3000
2. Revisa la configuración en `src/config/backend.ts`
3. Usa el componente `BackendStatus` para monitorear la conexión

### Error de Build
Si el build falla:
1. Verifica que todas las dependencias estén instaladas
2. Revisa las importaciones en los componentes
3. Ejecuta `npm run build:react` para ver errores específicos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Ejecuta las pruebas
5. Envía un pull request

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación
2. Verifica los logs del backend
3. Usa el componente BackendStatus para diagnosticar conexiones
4. Abre un issue en el repositorio

---

**¡Disfruta usando Telwagen React + Electron App!** 🎉