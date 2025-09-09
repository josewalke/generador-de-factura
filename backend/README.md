# Backend API - Generador de Facturas Telwagen

## 🚀 Descripción
Backend REST API desarrollado con Node.js y SQLite para el sistema de facturación de Telwagen Car Ibérica.

## 📋 Características
- ✅ API REST completa
- ✅ Base de datos SQLite
- ✅ Autenticación y seguridad
- ✅ Logging y monitoreo
- ✅ CORS habilitado
- ✅ Manejo de errores
- ✅ Datos de ejemplo incluidos

## 🗄️ Base de Datos
- **SQLite** con las siguientes tablas:
  - `clientes` - Información de clientes
  - `productos` - Catálogo de vehículos/productos
  - `facturas` - Facturas principales
  - `detalles_factura` - Detalles de productos en facturas

## 📡 Endpoints API

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `POST /api/clientes` - Crear nuevo cliente
- `GET /api/clientes/buscar/:identificacion` - Buscar cliente por identificación

### Productos
- `GET /api/productos` - Obtener todos los productos
- `POST /api/productos` - Crear nuevo producto
- `GET /api/productos/buscar/:codigo` - Buscar producto por código

### Facturas
- `GET /api/facturas` - Obtener todas las facturas
- `POST /api/facturas` - Crear nueva factura
- `GET /api/facturas/:id` - Obtener factura por ID con detalles
- `GET /api/facturas/siguiente-numero` - Generar siguiente número de factura

## 🛠️ Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

3. **Ejecutar en producción:**
   ```bash
   npm start
   ```

## 🔧 Configuración

- **Puerto:** 3000 (configurable con variable de entorno PORT)
- **Base de datos:** SQLite en `database/telwagen.db`
- **CORS:** Habilitado para todas las origenes
- **Logging:** Morgan para logs de acceso

## 📊 Datos de Ejemplo

El sistema incluye productos de ejemplo:
- NISSAN MICRA 1.0 IGT ACENTA 92-100 CV
- NISSAN QASHQAI 1.3 DIG-T ACENTA 140 CV
- NISSAN LEAF 40 kWh ACENTA
- NISSAN JUKE 1.0 DIG-T ACENTA 117 CV

## 🔒 Seguridad

- Helmet para headers de seguridad
- Validación de datos de entrada
- Sanitización de consultas SQL
- Manejo seguro de errores

## 📝 Ejemplos de Uso

### Crear un cliente
```bash
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "GRUPO MIGUEL LEON S.L.",
    "direccion": "C/. ALFREDO MARTIN REYES N° 7, LAS PALMAS DE G.C.",
    "identificacion": "876233865",
    "email": "info@miguelleon.com",
    "telefono": "928123456"
  }'
```

### Obtener siguiente número de factura
```bash
curl http://localhost:3000/api/facturas/siguiente-numero
```

### Buscar producto por código
```bash
curl http://localhost:3000/api/productos/buscar/NISSAN-MICRA-1.0
```

## 🚀 Inicio Rápido

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Inicia el servidor: `npm run dev`
4. Accede a la API: `http://localhost:3000`

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, crea un issue en el repositorio.
