# Análisis Completo del Proyecto Telwagen - Generador de Facturas

## 📋 Resumen Ejecutivo

**Telwagen** es un sistema completo de generación de facturas para empresas del sector automovilístico, desarrollado como aplicación de escritorio multiplataforma (Windows, macOS, Linux) usando Electron y React, con un backend Node.js/Express que cumple con la **Ley Antifraude española** y normativas fiscales.

---

## 🏗️ Arquitectura del Sistema

### Estructura General

```
generador de facturas/
├── backend/                    # API REST Node.js/Express
│   ├── modules/               # Módulos del sistema
│   ├── config/                # Configuración
│   ├── database/              # Base de datos SQLite/PostgreSQL
│   ├── migrations/            # Migraciones de BD
│   └── server.js              # Servidor principal
│
└── Telwagen-React-Electron-App/  # Aplicación de escritorio
    ├── src/
    │   ├── components/        # Componentes React
    │   ├── services/          # Servicios API
    │   ├── config/            # Configuración frontend
    │   └── App.tsx            # Componente principal
    └── electron/              # Configuración Electron
```

---

## 🔧 Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Base de Datos**: 
  - SQLite3 (desarrollo/pruebas)
  - PostgreSQL 13+ (producción)
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: 
  - Helmet
  - express-rate-limit
  - bcryptjs para hash de contraseñas
- **Procesamiento**: 
  - xlsx (importación/exportación Excel)
  - xml2js (VeriFactu)
  - jsPDF (generación PDFs)

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.3.5
- **Desktop**: Electron 28.0.0
- **UI Components**: Radix UI (sistema completo de componentes)
- **Estilos**: Tailwind CSS 3.3.5
- **Formularios**: React Hook Form + Zod
- **HTTP Client**: Axios
- **PDFs**: jsPDF + html2canvas
- **QR Codes**: qrcode

---

## 📊 Base de Datos

### Tablas Principales

1. **`empresas`**
   - Información de empresas emisoras
   - CIF, dirección, contacto
   - Certificados digitales asociados

2. **`clientes`**
   - Datos de clientes
   - Identificación fiscal (NIF/CIF)
   - Información de contacto completa

3. **`coches`**
   - Inventario de vehículos
   - Matrícula, chasis, modelo, marca, color, km

4. **`productos`**
   - Catálogo de productos/servicios
   - Precios, stock, categorías

5. **`facturas`**
   - Facturas emitidas
   - Campos de Ley Antifraude:
     - `hash_documento` (SHA-256)
     - `numero_serie`
     - `sellado_temporal`
     - `codigo_verifactu`
   - Estados: pendiente, pagada, anulada

6. **`detalles_factura`**
   - Líneas de detalle de cada factura
   - Relación con productos y coches

7. **`proformas`**
   - Presupuestos sin validez fiscal
   - Pueden convertirse en facturas

8. **`usuarios`**
   - Sistema de autenticación
   - Roles: admin, user
   - Control de acceso

9. **`audit_log`**
   - Trazabilidad completa (Ley Antifraude)
   - Registro inalterable de operaciones

10. **`sellados_temporales`**
    - Sellados criptográficos temporales
    - Cumplimiento normativo

---

## 🔐 Sistema de Seguridad

### Módulos de Seguridad Implementados

1. **`sistemaIntegridad.js`**
   - Generación de hash SHA-256 para documentos
   - Números de serie únicos
   - Sellados temporales criptográficos

2. **`sistemaAuditoria.js`**
   - Registro completo de operaciones
   - Trazabilidad inalterable
   - Historial de cambios

3. **`sistemaControlAcceso.js`**
   - Control de acceso basado en roles (RBAC)
   - Gestión de sesiones
   - Bloqueo por intentos fallidos

4. **`sistemaLogsSeguridad.js`**
   - Logs de seguridad
   - Registro de accesos
   - Detección de anomalías

5. **`securityMonitor.js`**
   - Monitoreo en tiempo real
   - Alertas de seguridad
   - Estadísticas de seguridad

6. **`sistemaCifrado.js`**
   - Cifrado AES-256-GCM
   - Protección de datos sensibles

7. **`sistemaValidacionFiscal.js`**
   - Validación de datos fiscales
   - Cumplimiento normativo

8. **`sistemaFirmaDigital.js`**
   - Integración con certificados digitales
   - Detección automática en Windows
   - Firma de documentos

---

## 📄 Funcionalidades Principales

### 1. Gestión de Facturas
- ✅ Creación de facturas con productos/coches
- ✅ Numeración automática correlativa
- ✅ Cálculo automático de IGIC (9.5%)
- ✅ Generación de PDFs con QR VeriFactu
- ✅ Estados: pendiente, pagada, anulada
- ✅ Campos de Ley Antifraude integrados
- ✅ Exportación a Excel

### 2. Gestión de Clientes
- ✅ CRUD completo de clientes
- ✅ Búsqueda y filtrado
- ✅ Importación desde Excel
- ✅ Exportación a Excel
- ✅ Validación de datos fiscales

### 3. Gestión de Coches
- ✅ Inventario de vehículos
- ✅ Búsqueda por matrícula, chasis, modelo
- ✅ Asociación con facturas
- ✅ Importación/exportación Excel
- ✅ Campos: marca, modelo, color, km, matrícula, chasis

### 4. Gestión de Empresas
- ✅ Múltiples empresas emisoras
- ✅ Configuración de datos fiscales
- ✅ Asociación de certificados digitales
- ✅ Logos personalizados

### 5. Proformas
- ✅ Creación de presupuestos
- ✅ Conversión a facturas
- ✅ Gestión de estados
- ✅ Generación de PDFs

### 6. Certificados Digitales
- ✅ Detección automática en Windows
- ✅ Gestión de certificados
- ✅ Firma digital de documentos

### 7. Historial y Auditoría
- ✅ Historial completo de operaciones
- ✅ Trazabilidad de cambios
- ✅ Logs de seguridad
- ✅ Búsqueda y filtrado avanzado

### 8. Dashboard
- ✅ Estadísticas en tiempo real
- ✅ Métricas de facturación
- ✅ Gráficos y visualizaciones
- ✅ Resumen de actividad

---

## 🎨 Interfaz de Usuario

### Pantallas Principales

1. **Dashboard**
   - Estadísticas generales
   - Resumen de facturas
   - Métricas clave

2. **FacturasScreen**
   - Listado de facturas
   - Creación/edición
   - Generación de PDFs
   - Filtros avanzados

3. **ClientesScreen**
   - Gestión de clientes
   - Búsqueda y filtrado
   - Importación/exportación

4. **CochesScreen**
   - Inventario de vehículos
   - Gestión completa
   - Búsqueda avanzada

5. **EmpresasScreen**
   - Configuración de empresas
   - Datos fiscales
   - Certificados

6. **ProformasScreen**
   - Gestión de presupuestos
   - Conversión a facturas

7. **HistorialScreen**
   - Auditoría completa
   - Trazabilidad
   - Logs de seguridad

8. **GestionCertificadosScreen**
   - Gestión de certificados digitales
   - Detección automática

### Componentes UI
- Sistema completo de componentes Radix UI
- Diseño responsive
- Tema claro/oscuro (next-themes)
- Formularios con validación (React Hook Form + Zod)
- Tablas con paginación
- Modales y diálogos
- Notificaciones (Sonner)

---

## 🔌 API REST

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Refrescar token
- `GET /api/auth/verify` - Verificar token

#### Facturas
- `GET /api/facturas` - Listar (con paginación y filtros)
- `GET /api/facturas/:id` - Obtener por ID
- `POST /api/facturas` - Crear (con validación Ley Antifraude)
- `PUT /api/facturas/:id` - Actualizar
- `DELETE /api/facturas/:id` - Eliminar (soft delete)
- `GET /api/facturas/:id/pdf` - Generar PDF
- `GET /api/facturas/:id/auditoria` - Historial de auditoría

#### Clientes
- `GET /api/clientes` - Listar
- `GET /api/clientes/:id` - Obtener por ID
- `POST /api/clientes` - Crear
- `PUT /api/clientes/:id` - Actualizar
- `DELETE /api/clientes/:id` - Eliminar

#### Coches
- `GET /api/coches` - Listar
- `GET /api/coches/:id` - Obtener por ID
- `POST /api/coches` - Crear
- `PUT /api/coches/:id` - Actualizar
- `DELETE /api/coches/:id` - Eliminar

#### Empresas
- `GET /api/empresas` - Listar
- `GET /api/empresas/:id` - Obtener por ID
- `POST /api/empresas` - Crear
- `PUT /api/empresas/:id` - Actualizar

#### Proformas
- `GET /api/proformas` - Listar
- `GET /api/proformas/:id` - Obtener por ID
- `POST /api/proformas` - Crear
- `PUT /api/proformas/:id` - Actualizar
- `POST /api/proformas/:id/convertir` - Convertir a factura

#### Importación/Exportación
- `POST /api/importar/clientes` - Importar clientes desde Excel
- `POST /api/importar/coches` - Importar coches desde Excel
- `POST /api/importar/productos` - Importar productos desde Excel
- `GET /api/exportar/clientes` - Exportar clientes a Excel
- `GET /api/exportar/coches` - Exportar coches a Excel
- `GET /api/exportar/productos` - Exportar productos a Excel

#### Estadísticas
- `GET /api/stats/dashboard` - Estadísticas del dashboard
- `GET /api/stats/facturas` - Estadísticas de facturas

#### Seguridad
- `GET /api/security/logs` - Logs de seguridad
- `GET /api/security/stats` - Estadísticas de seguridad

---

## 📦 Sistema de Módulos del Backend

### Módulos de Rendimiento

1. **`sistemaCache.js`**
   - Caché en memoria (node-cache)
   - Precalentamiento de datos frecuentes
   - TTL configurable

2. **`sistemaPaginacion.js`**
   - Paginación eficiente
   - Índices optimizados
   - Límites configurables

3. **`importadorExcel.js`**
   - Importación desde Excel
   - Validación de datos
   - Exportación a Excel

### Módulos de Infraestructura

1. **`database.js`**
   - Conexión PostgreSQL/SQLite
   - Pool de conexiones
   - Transacciones

2. **`sqlAdapter.js`**
   - Adaptación de queries SQLite → PostgreSQL
   - Conversión de parámetros (? → $1, $2...)

3. **`sistemaLogging.js`**
   - Sistema de logs estructurado
   - Rotación de archivos
   - Niveles de log

4. **`sistemaBackup.js`**
   - Backups automáticos
   - Compresión
   - Retención configurable

5. **`httpsManager.js`**
   - Gestión de certificados HTTPS
   - Generación automática
   - Configuración SSL

---

## 🚀 Despliegue y Distribución

### Desarrollo
```bash
# Backend
cd backend
npm run dev        # Nodemon con hot-reload

# Frontend
cd Telwagen-React-Electron-App
npm run dev        # Vite dev server
npm run dev:electron  # Electron en desarrollo
```

### Producción

#### Backend
- **PM2**: Gestión de procesos
- **PostgreSQL**: Base de datos de producción
- **HTTPS**: Certificados SSL/TLS
- **Ngrok**: Túnel para acceso remoto (opcional)

#### Frontend/Electron
- **Build React**: `npm run build:react`
- **Build Electron**: `npm run build:electron`
- **Builds específicos**:
  - Windows: `npm run build:win` (.exe, .msi)
  - macOS: `npm run build:mac` (.dmg)
  - Linux: `npm run build:linux` (AppImage, .deb)

### Configuración
- Variables de entorno en `.env`
- Configuración centralizada en `config/config.js`
- Detección automática de backend (ngrok/localhost)

---

## ✅ Cumplimiento Normativo

### Ley Antifraude Española

#### Implementado ✅
1. **Hash del documento** (SHA-256)
2. **Número de serie único**
3. **Sellado temporal**
4. **Registro de trazabilidad inalterable**
5. **Conservación en formato electrónico**
6. **Código VeriFactu** (generación)

#### Pendiente ⚠️
1. **Código QR en PDF** - Marcado como pendiente en `VERIFICACION_VERIFACTU.md`

### VeriFactu
- Generación de códigos VeriFactu
- Integración con Agencia Tributaria
- Formato XML según normativa

---

## 🔍 Características Técnicas Destacadas

### 1. Multiplataforma
- Windows, macOS, Linux
- Electron Builder para empaquetado
- Auto-updater configurado

### 2. Multi-Base de Datos
- Soporte SQLite (desarrollo)
- Soporte PostgreSQL (producción)
- Adaptador SQL transparente

### 3. Seguridad Robusta
- JWT para autenticación
- Rate limiting
- Cifrado de datos sensibles
- Logs de seguridad
- Control de acceso por roles

### 4. Rendimiento
- Sistema de caché
- Paginación eficiente
- Índices optimizados
- Precalentamiento de datos

### 5. Auditoría Completa
- Trazabilidad de todas las operaciones
- Logs inalterables
- Historial de cambios
- Cumplimiento normativo

### 6. Importación/Exportación
- Excel (clientes, coches, productos)
- PDFs de facturas
- Validación de datos

---

## 📝 Archivos de Configuración Clave

### Backend
- `backend/config/config.js` - Configuración centralizada
- `backend/package.json` - Dependencias y scripts
- `backend/server.js` - Servidor principal (6922 líneas)
- `backend/ecosystem.config.js` - Configuración PM2

### Frontend
- `Telwagen-React-Electron-App/package.json` - Dependencias y build
- `Telwagen-React-Electron-App/src/config/backend.ts` - Configuración API
- `Telwagen-React-Electron-App/electron/main.js` - Proceso principal Electron
- `Telwagen-React-Electron-App/vite.config.ts` - Configuración Vite

---

## 🐛 Áreas de Mejora Identificadas

1. **Código QR en PDFs**
   - Pendiente de implementación según `VERIFICACION_VERIFACTU.md`

2. **Testing**
   - No se encontraron tests automatizados
   - Recomendación: Añadir tests unitarios e integración

3. **Documentación de API**
   - No hay documentación Swagger/OpenAPI
   - Recomendación: Añadir documentación API

4. **Manejo de Errores**
   - Mejorar mensajes de error al usuario
   - Implementar error boundaries en React

5. **Optimización**
   - Lazy loading de componentes
   - Code splitting en React
   - Optimización de queries SQL

---

## 📊 Estadísticas del Proyecto

- **Backend**: ~7000 líneas de código (server.js)
- **Frontend**: Múltiples componentes React
- **Módulos Backend**: 18 módulos especializados
- **Pantallas Frontend**: 8 pantallas principales
- **Servicios Frontend**: 13 servicios API
- **Componentes UI**: 50+ componentes Radix UI

---

## 🎯 Conclusión

**Telwagen** es un sistema robusto y completo para la gestión de facturación en el sector automovilístico, con:

✅ Arquitectura bien estructurada
✅ Cumplimiento normativo (Ley Antifraude)
✅ Seguridad implementada
✅ Interfaz moderna y responsive
✅ Multiplataforma (Electron)
✅ Escalable (PostgreSQL)
✅ Auditoría completa

El proyecto está en un estado avanzado y funcional, con algunas mejoras pendientes (principalmente el código QR en PDFs) pero con una base sólida para producción.

---

## 📚 Documentación Adicional

- `README.md` - Guía rápida de inicio
- `VERIFICACION_VERIFACTU.md` - Estado de cumplimiento VeriFactu
- `SISTEMA_ACTUALIZACION_AUTOMATICA.md` - Sistema de actualizaciones
- `HOME_RESPONSIVE_COMPLETO.md` - Responsividad del dashboard

---

*Análisis generado el: $(date)*

