# 🚗 Generador de Facturas Telwagen

Sistema completo de facturación para Telwagen Car Ibérica con aplicación de escritorio y backend API.

## 📁 Estructura del Proyecto

```
Generador De Facturas Telwagen/
├── 📱 electron-app/          # Aplicación de escritorio (Electron)
│   ├── src/                  # Código fuente de Electron
│   │   ├── main.js          # Proceso principal
│   │   ├── config.js        # Configuración API
│   │   └── apiService.js    # Servicio API
│   ├── public/              # Interfaz de usuario (HTML/CSS/JS)
│   └── package.json         # Dependencias de Electron
│
├── 🖥️ backend/               # Backend API (Node.js + Express)
│   ├── server.js            # Servidor principal
│   ├── config.js            # Configuración del backend
│   ├── database/            # Base de datos del backend (SQLite)
│   ├── README.md            # Documentación del backend
│   └── package.json         # Dependencias del backend
│
└── 📄 README.md            # Documentación principal
```

## 🎯 Características Principales

### 📱 **Aplicación de Escritorio (Electron)**
- ✅ Interfaz moderna y responsive
- ✅ Formularios completos para facturas
- ✅ Vista previa de facturas en tiempo real
- ✅ Base de datos local SQLite
- ✅ Comunicación con backend API
- ✅ Generación automática de números de factura

### 🖥️ **Backend API (Node.js)**
- ✅ API REST completa
- ✅ Base de datos SQLite
- ✅ Autenticación y seguridad
- ✅ Logging y monitoreo
- ✅ CORS habilitado
- ✅ Datos de ejemplo incluidos

## 🚀 Instalación y Configuración

### 1. **Instalar Backend**
```bash
cd backend
npm install
npm run dev
```

### 2. **Instalar Aplicación de Escritorio**
```bash
cd electron-app
npm install
npm start
```

## 📡 API Endpoints

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `POST /api/clientes` - Crear nuevo cliente
- `GET /api/clientes/buscar/:identificacion` - Buscar cliente

### Productos
- `GET /api/productos` - Obtener todos los productos
- `POST /api/productos` - Crear nuevo producto
- `GET /api/productos/buscar/:codigo` - Buscar producto

### Facturas
- `GET /api/facturas` - Obtener todas las facturas
- `POST /api/facturas` - Crear nueva factura
- `GET /api/facturas/:id` - Obtener factura por ID
- `GET /api/facturas/siguiente-numero` - Generar número automático

## 🔄 Automatizaciones

### 📅 **Números de Factura**
- Formato automático: C001/2024, C002/2024, etc.
- Secuencial por año
- Sin duplicados

### 🚗 **Productos Predefinidos**
- NISSAN MICRA 1.0 IGT ACENTA 92-100 CV
- NISSAN QASHQAI 1.3 DIG-T ACENTA 140 CV
- NISSAN LEAF 40 kWh ACENTA
- NISSAN JUKE 1.0 DIG-T ACENTA 117 CV

### 👤 **Gestión de Clientes**
- Búsqueda automática por identificación
- Auto-completado de datos
- Historial de facturas

### 💰 **Cálculos Automáticos**
- Subtotales automáticos
- IGIC automático (9.5%)
- Totales automáticos
- Fechas de vencimiento

## 🗄️ Base de Datos

### **Backend API**
- `database/telwagen.db` - Base de datos del servidor con todas las tablas

### **Tablas Principales**
- `clientes` - Información de clientes
- `productos` - Catálogo de vehículos
- `facturas` - Facturas principales
- `detalles_factura` - Detalles de productos

## 🎨 Interfaz de Usuario

### **Formularios**
- 📋 Datos de la factura
- 🏢 Datos de la empresa
- 👤 Datos del cliente
- 🚗 Productos/vehículos
- 🏦 Detalles bancarios

### **Funcionalidades**
- ✅ Agregar/eliminar productos
- ✅ Vista previa en tiempo real
- ✅ Generación de facturas
- ✅ Guardado en base de datos
- ✅ Carga de facturas anteriores

## 🔧 Configuración

### **Backend**
- Puerto: 3000 (configurable)
- Base de datos: SQLite
- CORS: Habilitado
- Logging: Morgan

### **Electron App**
- Tamaño ventana: 1200x800
- Base de datos: SQLite local
- Comunicación: IPC + HTTP

## 📊 Datos de Ejemplo

El sistema incluye productos de ejemplo con precios reales y especificaciones técnicas de vehículos Nissan.

## 🚀 Uso Rápido

1. **Iniciar Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Iniciar Aplicación:**
   ```bash
   cd electron-app
   npm start
   ```

3. **Usar la aplicación:**
   - Completar formularios
   - Agregar productos
   - Generar vista previa
   - Guardar factura

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, crea un issue en el repositorio.

---

**Desarrollado para Telwagen Car Ibérica, S.L.**
*Sistema de facturación profesional para concesionario de vehículos*
