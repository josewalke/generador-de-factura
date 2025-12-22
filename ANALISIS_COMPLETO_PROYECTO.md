# 📊 Análisis Completo del Proyecto Telwagen - Generador de Facturas

**Fecha de Análisis**: $(date)  
**Versión del Proyecto**: Backend 1.0.0 | Frontend 1.0.6

---

## 🎯 Resumen Ejecutivo

**Telwagen** es un sistema completo de generación de facturas para empresas del sector automovilístico, desarrollado como aplicación de escritorio multiplataforma (Windows, macOS, Linux) usando **Electron** y **React**, con un backend **Node.js/Express** que cumple con la **Ley Antifraude española** y normativas fiscales.

### Estado General del Proyecto
- ✅ **Funcionalidad**: Sistema completo y operativo
- ✅ **Arquitectura**: Bien estructurada y modular
- ✅ **Seguridad**: Múltiples capas de seguridad implementadas
- ✅ **Cumplimiento Normativo**: 90% completo (falta código QR en PDFs)
- ⚠️ **Testing**: No se encontraron tests automatizados
- ✅ **Documentación**: Buena documentación de uso

---

## 🏗️ Arquitectura del Sistema

### Estructura de Directorios

```
generador de facturas/
├── backend/                          # API REST Node.js/Express
│   ├── modules/                      # 20 módulos especializados
│   │   ├── sistemaIntegridad.js     # Hash SHA-256, sellados temporales
│   │   ├── sistemaAuditoria.js      # Trazabilidad completa
│   │   ├── sistemaControlAcceso.js  # RBAC, sesiones
│   │   ├── sistemaCifrado.js        # AES-256-GCM
│   │   ├── sistemaValidacionFiscal.js # Validación CIF/NIF/NIE
│   │   ├── sistemaFirmaDigital.js   # Certificados digitales
│   │   ├── generadorVeriFactu.js    # XML VeriFactu
│   │   ├── sistemaBackup.js         # Backups automáticos
│   │   ├── sistemaCache.js          # Caché en memoria
│   │   ├── sistemaPaginacion.js     # Paginación eficiente
│   │   ├── importadorExcel.js       # Importación/exportación Excel
│   │   ├── database.js              # Gestión de BD
│   │   ├── sqlAdapter.js            # Adaptador SQLite→PostgreSQL
│   │   ├── authService.js           # Autenticación JWT
│   │   ├── roleManager.js           # Gestión de roles
│   │   ├── securityMonitor.js       # Monitoreo de seguridad
│   │   ├── sistemaLogging.js        # Sistema de logs
│   │   ├── sistemaLogsSeguridad.js  # Logs de seguridad
│   │   ├── httpsManager.js          # Gestión HTTPS
│   │   └── detectorCertificadosWindows.js # Detección certificados
│   ├── config/                       # Configuración centralizada
│   │   └── config.js                 # ConfigManager con .env
│   ├── database/                     # Base de datos SQLite
│   ├── migrations/                   # Migraciones SQL
│   ├── scripts/                      # Scripts de utilidad
│   ├── logs/                         # Archivos de log
│   ├── backups/                      # Backups automáticos
│   ├── certificados/                 # Certificados digitales
│   ├── firmas/                       # Firmas digitales guardadas
│   └── server.js                     # Servidor principal (7008 líneas)
│
└── Telwagen-React-Electron-App/      # Aplicación de escritorio
    ├── src/
    │   ├── components/              # 55+ componentes React
    │   │   ├── screens/             # 8 pantallas principales
    │   │   ├── forms/               # Formularios
    │   │   └── ui/                  # Componentes Radix UI
    │   ├── services/                # 13 servicios API
    │   ├── hooks/                   # 8 hooks personalizados
    │   ├── config/                  # Configuración frontend
    │   └── App.tsx                  # Componente principal
    └── electron/                    # Configuración Electron
        ├── main.js                  # Proceso principal
        └── preload.js               # Preload script
```

---

## 🔧 Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.18.2 | Framework web |
| **SQLite3** | 5.1.6 | BD desarrollo |
| **PostgreSQL** | 13+ | BD producción |
| **JWT** | 9.0.2 | Autenticación |
| **Helmet** | 7.1.0 | Seguridad HTTP |
| **express-rate-limit** | 8.1.0 | Rate limiting |
| **bcryptjs** | 3.0.2 | Hash contraseñas |
| **xlsx** | 0.18.5 | Excel import/export |
| **xml2js** | 0.6.2 | VeriFactu XML |
| **node-cache** | 5.1.2 | Sistema de caché |
| **morgan** | 1.10.0 | HTTP logging |
| **multer** | 2.0.2 | Upload archivos |
| **pg** | 8.11.3 | Cliente PostgreSQL |

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 18.3.1 | Framework UI |
| **TypeScript** | 5.2.2 | Tipado estático |
| **Vite** | 6.3.5 | Build tool |
| **Electron** | 28.0.0 | Desktop app |
| **Radix UI** | Latest | Componentes UI |
| **Tailwind CSS** | 3.3.5 | Estilos |
| **React Hook Form** | 7.55.0 | Formularios |
| **Zod** | 4.1.11 | Validación |
| **Axios** | 1.11.0 | HTTP client |
| **jsPDF** | 3.0.3 | Generación PDFs |
| **html2canvas** | 1.4.1 | Captura HTML |
| **qrcode** | 1.5.4 | Códigos QR |
| **recharts** | 2.15.2 | Gráficos |
| **sonner** | 2.0.3 | Notificaciones |

---

## 📊 Base de Datos

### Esquema de Tablas

#### 1. **`empresas`**
- Información de empresas emisoras
- Campos: `id`, `nombre`, `cif`, `direccion`, `telefono`, `email`, `logo`, `certificado_thumbprint`, `codigo_pais`, `provincia`, `pais`, `codigo_postal`, `regimen_fiscal`
- Relaciones: 1:N con `facturas`, `usuarios`

#### 2. **`clientes`**
- Datos de clientes
- Campos: `id`, `nombre`, `direccion`, `codigo_postal`, `identificacion` (NIF/CIF), `email`, `telefono`, `tipo_identificacion`, `codigo_pais`, `provincia`, `pais`, `regimen_fiscal`
- Relaciones: 1:N con `facturas`

#### 3. **`coches`**
- Inventario de vehículos
- Campos: `id`, `matricula` (UNIQUE), `chasis`, `color`, `kms`, `modelo`, `marca`, `activo`
- Relaciones: N:M con `facturas` (vía `detalles_factura`)

#### 4. **`productos`**
- Catálogo de productos/servicios
- Campos: `id`, `codigo`, `descripcion`, `precio`, `stock`, `categoria`, `activo`
- Relaciones: N:M con `facturas` (vía `detalles_factura`)

#### 5. **`facturas`** ⭐ (Tabla principal)
- Facturas emitidas con campos de Ley Antifraude
- Campos principales:
  - Identificación: `id`, `numero_factura` (UNIQUE), `empresa_id`, `cliente_id`
  - Fechas: `fecha_emision`, `fecha_vencimiento`, `fecha_operacion`
  - Totales: `subtotal`, `igic`, `total`
  - Estado: `estado` (pendiente/pagada/anulada), `estado_fiscal`
  - **Ley Antifraude**:
    - `hash_documento` (SHA-256)
    - `numero_serie` (único)
    - `sellado_temporal` (timestamp criptográfico)
    - `codigo_verifactu` (VF-XXXXXXXXXXXX)
  - VeriFactu: `tipo_documento`, `metodo_pago`, `referencia_operacion`, `respuesta_aeat`
- Relaciones: 1:N con `detalles_factura`

#### 6. **`detalles_factura`**
- Líneas de detalle de cada factura
- Campos: `id`, `factura_id`, `producto_id`, `coche_id`, `descripcion`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`
- Relaciones: N:1 con `facturas`, `productos`, `coches`

#### 7. **`proformas`**
- Presupuestos sin validez fiscal
- Campos similares a `facturas` pero sin campos de Ley Antifraude
- Relaciones: 1:N con `detalles_proforma`, puede convertirse en `factura`

#### 8. **`usuarios`**
- Sistema de autenticación
- Campos: `id`, `username` (UNIQUE), `password_hash`, `role` (admin/user), `empresa_id`, `activo`, `ultimo_acceso`
- Relaciones: N:1 con `empresas`

#### 9. **`audit_log`** 🔐
- Trazabilidad completa (Ley Antifraude)
- Campos: `id`, `tabla`, `registro_id`, `accion`, `usuario_id`, `datos_anteriores`, `datos_nuevos`, `fecha`, `ip`, `user_agent`
- Registro inalterable de todas las operaciones

#### 10. **`sellados_temporales`** 🔐
- Sellados criptográficos temporales
- Campos: `id`, `factura_id`, `sellado`, `fecha_creacion`, `valido_hasta`
- Cumplimiento normativo

#### 11. **`logs_seguridad`** 🔐
- Logs de seguridad
- Campos: `id`, `tipo`, `usuario_id`, `ip`, `user_agent`, `detalles`, `fecha`, `severidad`

#### 12. **`sesiones`** 🔐
- Gestión de sesiones de usuario
- Campos: `id`, `usuario_id`, `token`, `ip`, `user_agent`, `fecha_creacion`, `fecha_expiracion`, `activa`

#### 13. **`empresa_certificados`** 🔐
- Asociación de certificados digitales con empresas
- Campos: `id`, `empresa_id`, `thumbprint`, `nombre`, `fecha_creacion`, `activo`

### Índices y Optimizaciones

- Índices en campos de búsqueda frecuente
- Índices en claves foráneas
- Índices en campos de Ley Antifraude para auditoría
- Optimización de queries con `EXPLAIN`

---

## 🔐 Sistema de Seguridad

### Módulos de Seguridad Implementados

#### 1. **`sistemaIntegridad.js`** ✅
- **Hash SHA-256** para documentos
- **Números de serie únicos**
- **Sellados temporales criptográficos**
- **Códigos VeriFactu** (VF-XXXXXXXXXXXX)
- Métodos principales:
  - `generarHashIntegridad(documento)` → SHA-256
  - `generarNumeroSerie()` → UUID único
  - `generarSelladoTemporal()` → Timestamp criptográfico
  - `generarCodigoVeriFactu()` → Código VeriFactu

#### 2. **`sistemaAuditoria.js`** ✅
- **Registro completo de operaciones**
- **Trazabilidad inalterable**
- **Historial de cambios**
- Métodos principales:
  - `registrarCreacion(tabla, registroId, datos, usuarioId)`
  - `registrarModificacion(tabla, registroId, datosAnteriores, datosNuevos, usuarioId)`
  - `registrarEliminacion(tabla, registroId, datos, usuarioId)`
  - `obtenerHistorial(tabla, registroId)`

#### 3. **`sistemaControlAcceso.js`** ✅
- **Control de acceso basado en roles (RBAC)**
- **Gestión de sesiones**
- **Bloqueo por intentos fallidos**
- Métodos principales:
  - `verificarPermiso(usuarioId, recurso, accion)`
  - `crearSesion(usuarioId, ip, userAgent)`
  - `cerrarSesion(sesionId)`
  - `bloquearUsuario(usuarioId, razon)`

#### 4. **`sistemaLogsSeguridad.js`** ✅
- **Logs de seguridad estructurados**
- **Registro de accesos**
- **Detección de anomalías**
- Métodos principales:
  - `registrarAcceso(usuarioId, ip, userAgent, exito)`
  - `registrarIntentoFallido(usuarioId, ip, razon)`
  - `obtenerLogsSeguridad(filtros)`

#### 5. **`securityMonitor.js`** ✅
- **Monitoreo en tiempo real**
- **Alertas de seguridad**
- **Estadísticas de seguridad**
- Métodos principales:
  - `monitorearAccesos()`
  - `detectarAnomalias()`
  - `generarAlertas()`
  - `obtenerEstadisticas()`

#### 6. **`sistemaCifrado.js`** ✅
- **Cifrado AES-256-GCM**
- **Protección de datos sensibles**
- Métodos principales:
  - `cifrar(datos, clave)` → Datos cifrados
  - `descifrar(datosCifrados, clave)` → Datos originales

#### 7. **`sistemaValidacionFiscal.js`** ✅
- **Validación de datos fiscales**
- **Cumplimiento normativo**
- Métodos principales:
  - `validarNIF(nif)` → Validación con dígito de control
  - `validarCIF(cif)` → Validación con dígito de control
  - `validarNIE(nie)` → Validación con letra de control
  - `validarIdentificacionFiscal(identificacion)` → Detección automática

#### 8. **`sistemaFirmaDigital.js`** ✅
- **Integración con certificados digitales**
- **Detección automática en Windows**
- **Firma de documentos**
- Métodos principales:
  - `detectarCertificadosWindows()` → Lista de certificados
  - `firmarDocumento(documento, thumbprint)` → Documento firmado
  - `verificarFirma(documento, firma)` → Verificación

#### 9. **`authService.js`** ✅
- **Autenticación JWT**
- **Gestión de tokens**
- Métodos principales:
  - `login(username, password)` → Token JWT
  - `verificarToken(token)` → Datos del usuario
  - `refreshToken(token)` → Nuevo token

#### 10. **`roleManager.js`** ✅
- **Gestión de roles y permisos**
- Métodos principales:
  - `obtenerRoles()` → Lista de roles
  - `obtenerPermisos(role)` → Permisos del rol
  - `asignarRol(usuarioId, role)` → Asignación

### Configuración de Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado para permitir acceso remoto (ngrok)
- **Rate Limiting**: 
  - General: 100 requests / 15 minutos
  - Login: 5 intentos / 15 minutos
- **JWT**: Expiración de 1 hora
- **Cifrado**: AES-256-GCM para datos sensibles
- **HTTPS**: Certificados SSL/TLS (auto-generados o reales)

---

## 📄 Funcionalidades Principales

### 1. Gestión de Facturas ✅

- ✅ Creación de facturas con productos/coches
- ✅ Numeración automática correlativa (formato: `C{numero}/{año}`)
- ✅ Cálculo automático de IGIC (9.5% configurable)
- ✅ Generación de PDFs con QR VeriFactu (⚠️ QR pendiente)
- ✅ Estados: pendiente, pagada, anulada
- ✅ Campos de Ley Antifraude integrados:
  - Hash SHA-256
  - Número de serie único
  - Sellado temporal
  - Código VeriFactu
- ✅ Exportación a Excel
- ✅ Filtros avanzados (fecha, cliente, empresa, búsqueda)
- ✅ Paginación eficiente
- ✅ Historial de auditoría completo

### 2. Gestión de Clientes ✅

- ✅ CRUD completo de clientes
- ✅ Búsqueda y filtrado avanzado
- ✅ Validación de datos fiscales (NIF/CIF/NIE)
- ✅ Importación desde Excel
- ✅ Exportación a Excel
- ✅ Campos fiscales completos (regimen_fiscal, codigo_pais, provincia)

### 3. Gestión de Coches ✅

- ✅ Inventario de vehículos
- ✅ Búsqueda por matrícula, chasis, modelo, marca
- ✅ Asociación con facturas
- ✅ Importación/exportación Excel
- ✅ Filtros avanzados (modelo, color, kms)
- ✅ Campos: marca, modelo, color, km, matrícula, chasis

### 4. Gestión de Empresas ✅

- ✅ Múltiples empresas emisoras
- ✅ Configuración de datos fiscales
- ✅ Asociación de certificados digitales
- ✅ Logos personalizados
- ✅ Campos fiscales completos

### 5. Proformas ✅

- ✅ Creación de presupuestos
- ✅ Conversión a facturas
- ✅ Gestión de estados
- ✅ Generación de PDFs
- ✅ Relación padre-hijo (proformas hijas)

### 6. Certificados Digitales ✅

- ✅ Detección automática en Windows
- ✅ Gestión de certificados
- ✅ Firma digital de documentos
- ✅ Asociación con empresas

### 7. Historial y Auditoría ✅

- ✅ Historial completo de operaciones
- ✅ Trazabilidad de cambios
- ✅ Logs de seguridad
- ✅ Búsqueda y filtrado avanzado
- ✅ Exportación de logs

### 8. Dashboard ✅

- ✅ Estadísticas en tiempo real
- ✅ Métricas de facturación
- ✅ Gráficos y visualizaciones (Recharts)
- ✅ Resumen de actividad
- ✅ Responsive design

### 9. Importación/Exportación Excel ✅

- ✅ Importar clientes desde Excel
- ✅ Importar coches desde Excel
- ✅ Importar productos desde Excel
- ✅ Exportar clientes a Excel
- ✅ Exportar coches a Excel (con filtros)
- ✅ Exportar productos a Excel
- ✅ Validación de datos durante importación

---

## 🔌 API REST

### Estadísticas de Endpoints

- **Total de endpoints**: ~112 rutas
- **Métodos HTTP**: GET, POST, PUT, DELETE, PATCH
- **Autenticación**: JWT Bearer Token
- **Formato**: JSON

### Endpoints Principales

#### Autenticación
```
POST   /api/auth/login              # Inicio de sesión
POST   /api/auth/refresh            # Refrescar token
GET    /api/auth/verify             # Verificar token
```

#### Facturas
```
GET    /api/facturas                # Listar (paginación, filtros)
GET    /api/facturas/:id            # Obtener por ID
POST   /api/facturas                # Crear (con validación Ley Antifraude)
PUT    /api/facturas/:id            # Actualizar
DELETE /api/facturas/:id            # Eliminar (soft delete)
GET    /api/facturas/:id/pdf        # Generar PDF
GET    /api/facturas/:id/verifactu # Generar XML VeriFactu
POST   /api/facturas/:id/enviar-verifactu # Enviar a AEAT (simulado)
GET    /api/facturas/:id/auditoria  # Historial de auditoría
```

#### Clientes
```
GET    /api/clientes                # Listar (paginación, búsqueda)
GET    /api/clientes/:id            # Obtener por ID
POST   /api/clientes                # Crear
PUT    /api/clientes/:id            # Actualizar
DELETE /api/clientes/:id            # Eliminar
```

#### Coches
```
GET    /api/coches                  # Listar (paginación, filtros)
GET    /api/coches/:id              # Obtener por ID
POST   /api/coches                  # Crear
PUT    /api/coches/:id              # Actualizar
DELETE /api/coches/:id              # Eliminar
```

#### Empresas
```
GET    /api/empresas                 # Listar (paginación, búsqueda)
GET    /api/empresas/:id             # Obtener por ID
POST   /api/empresas                 # Crear
PUT    /api/empresas/:id             # Actualizar
```

#### Proformas
```
GET    /api/proformas                # Listar
GET    /api/proformas/:id            # Obtener por ID
POST   /api/proformas                # Crear
PUT    /api/proformas/:id            # Actualizar
POST   /api/proformas/:id/convertir  # Convertir a factura
GET    /api/proformas/:id/pdf        # Generar PDF
```

#### Importación/Exportación
```
POST   /api/importar/clientes        # Importar clientes desde Excel
POST   /api/importar/coches          # Importar coches desde Excel
POST   /api/importar/productos       # Importar productos desde Excel
GET    /api/exportar/clientes        # Exportar clientes a Excel
GET    /api/exportar/coches          # Exportar coches a Excel (con filtros)
GET    /api/exportar/productos       # Exportar productos a Excel
```

#### Estadísticas
```
GET    /api/stats/dashboard          # Estadísticas del dashboard
GET    /api/stats/facturas           # Estadísticas de facturas
```

#### Seguridad
```
GET    /api/security/logs            # Logs de seguridad
GET    /api/security/stats           # Estadísticas de seguridad
```

#### Certificados
```
GET    /api/certificados             # Listar certificados disponibles
GET    /api/certificados/detectar    # Detectar certificados Windows
POST   /api/certificados/asociar     # Asociar certificado con empresa
```

---

## 🎨 Interfaz de Usuario

### Pantallas Principales

#### 1. **Dashboard** (`Dashboard.tsx`)
- Estadísticas generales
- Resumen de facturas (pendientes, pagadas, anuladas)
- Métricas clave (total facturado, clientes, coches)
- Gráficos de facturación (Recharts)
- Actividad reciente
- **Responsive**: ✅ Completo

#### 2. **FacturasScreen** (`FacturasScreen.tsx`)
- Listado de facturas con paginación
- Creación/edición de facturas
- Generación de PDFs
- Filtros avanzados (fecha, cliente, empresa, búsqueda)
- Estados de facturas
- Exportación a Excel

#### 3. **ClientesScreen** (`ClientesScreen.tsx`)
- Gestión completa de clientes
- Búsqueda y filtrado
- Importación/exportación Excel
- Validación de datos fiscales
- Formularios con React Hook Form + Zod

#### 4. **CochesScreen** (`CochesScreen.tsx`)
- Inventario de vehículos
- Gestión completa (CRUD)
- Búsqueda avanzada (matrícula, chasis, modelo, marca)
- Filtros (modelo, color, kms)
- Importación/exportación Excel

#### 5. **EmpresasScreen** (`EmpresasScreen.tsx`)
- Configuración de empresas
- Datos fiscales
- Asociación de certificados digitales
- Logos personalizados

#### 6. **ProformasScreen** (`ProformasScreen.tsx`)
- Gestión de presupuestos
- Conversión a facturas
- Estados de proformas
- Generación de PDFs

#### 7. **HistorialScreen** (`HistorialScreen.tsx`)
- Auditoría completa
- Trazabilidad de cambios
- Logs de seguridad
- Búsqueda y filtrado avanzado

#### 8. **GestionCertificadosScreen** (`GestionCertificadosScreen.tsx`)
- Gestión de certificados digitales
- Detección automática en Windows
- Asociación con empresas

### Componentes UI

- **Sistema completo de componentes Radix UI**:
  - Accordion, Alert Dialog, Avatar, Badge, Button, Card, Checkbox
  - Dialog, Dropdown Menu, Form, Input, Label, Pagination
  - Popover, Progress, Radio Group, Select, Separator
  - Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea
  - Toggle, Tooltip, Scroll Area, Navigation Menu, etc.
- **Diseño responsive**: ✅ Completo
- **Tema claro/oscuro**: ✅ next-themes
- **Formularios**: React Hook Form + Zod validation
- **Tablas**: Con paginación y ordenamiento
- **Modales y diálogos**: Radix UI
- **Notificaciones**: Sonner (toast notifications)
- **Gráficos**: Recharts

---

## 📦 Sistema de Módulos del Backend

### Módulos de Rendimiento

#### 1. **`sistemaCache.js`** ✅
- Caché en memoria (node-cache)
- Precalentamiento de datos frecuentes
- TTL configurable (5 minutos por defecto)
- Invalidación automática
- Métodos: `get()`, `set()`, `del()`, `delPattern()`, `preheat()`

#### 2. **`sistemaPaginacion.js`** ✅
- Paginación eficiente
- Índices optimizados
- Límites configurables (default: 20, max: 100)
- Soporte para SQLite y PostgreSQL
- Métodos: `getPaginatedData()`, `getTotalCount()`

#### 3. **`importadorExcel.js`** ✅
- Importación desde Excel (xlsx)
- Validación de datos
- Exportación a Excel
- Soporte para clientes, coches, productos
- Filtros en exportación

### Módulos de Infraestructura

#### 1. **`database.js`** ✅
- Conexión PostgreSQL/SQLite
- Pool de conexiones (PostgreSQL)
- Transacciones
- Manejo de errores
- Métodos: `query()`, `get()`, `all()`, `run()`, `transaction()`

#### 2. **`sqlAdapter.js`** ✅
- Adaptación de queries SQLite → PostgreSQL
- Conversión de parámetros (`?` → `$1, $2...`)
- Soporte para diferentes sintaxis SQL
- Métodos: `adaptQuery()`, `adaptParams()`

#### 3. **`sistemaLogging.js`** ✅
- Sistema de logs estructurado
- Rotación de archivos
- Niveles de log (info, warn, error, debug)
- Archivos separados por tipo
- Métodos: `info()`, `warn()`, `error()`, `systemEvent()`

#### 4. **`sistemaBackup.js`** ✅
- Backups automáticos
- Compresión
- Retención configurable (4 años por defecto)
- Programación automática (24 horas)
- Métodos: `crearBackup()`, `restaurarBackup()`, `listarBackups()`

#### 5. **`httpsManager.js`** ✅
- Gestión de certificados HTTPS
- Generación automática (selfsigned)
- Configuración SSL
- Métodos: `generarCertificado()`, `obtenerCertificado()`

---

## 🚀 Despliegue y Distribución

### Desarrollo

```bash
# Backend
cd backend
npm install
npm run dev        # Nodemon con hot-reload

# Frontend
cd Telwagen-React-Electron-App
npm install
npm run dev        # Vite dev server (http://localhost:5173)
npm run dev:electron  # Electron en desarrollo
```

### Producción

#### Backend
- **PM2**: Gestión de procesos (`npm run pm2:start`)
- **PostgreSQL**: Base de datos de producción
- **HTTPS**: Certificados SSL/TLS
- **Ngrok**: Túnel para acceso remoto (opcional)
- **Variables de entorno**: `.env` para configuración

#### Frontend/Electron
- **Build React**: `npm run build:react`
- **Build Electron**: `npm run build:electron`
- **Builds específicos**:
  - Windows: `npm run build:win` (.exe, .msi)
  - macOS: `npm run build:mac` (.dmg)
  - Linux: `npm run build:linux` (AppImage, .deb)
- **Auto-incremento de versión**: Antes de cada build

### Configuración

- **Variables de entorno**: `.env` en `backend/`
- **Configuración centralizada**: `backend/config/config.js`
- **Detección automática de backend**: ngrok/localhost
- **Headers ngrok**: `ngrok-skip-browser-warning: true`

---

## ✅ Cumplimiento Normativo

### Ley Antifraude Española

#### Implementado ✅

1. **Hash del documento** (SHA-256) ✅
   - Ubicación: `sistemaIntegridad.js`
   - Campo: `hash_documento`
   - Generación automática al crear factura

2. **Número de serie único** ✅
   - Ubicación: `sistemaIntegridad.js`
   - Campo: `numero_serie`
   - Generación automática

3. **Sellado temporal** ✅
   - Ubicación: `sistemaIntegridad.js`
   - Campo: `sellado_temporal`
   - Timestamp criptográfico

4. **Registro de trazabilidad inalterable** ✅
   - Ubicación: `sistemaAuditoria.js`
   - Tabla: `audit_log`
   - Historial completo de cambios

5. **Conservación en formato electrónico** ✅
   - Base de datos + sistema de backup
   - Retención de 4 años
   - Backups automáticos

6. **Código VeriFactu** ✅
   - Ubicación: `sistemaIntegridad.js`
   - Campo: `codigo_verifactu`
   - Formato: `VF-XXXXXXXXXXXX`

7. **XML VeriFactu** ✅
   - Ubicación: `generadorVeriFactu.js`
   - Campos obligatorios incluidos
   - Validación de XML

8. **Validación CIF/NIF/NIE** ✅
   - Ubicación: `sistemaValidacionFiscal.js`
   - Validación con dígitos de control

#### Pendiente ⚠️

1. **Código QR en PDF** ❌
   - **Prioridad**: ALTA
   - **Estado**: NO IMPLEMENTADO
   - **Descripción**: Generar código QR que incluya:
     - Número de factura
     - Fecha de emisión
     - Importe total
     - Código VeriFactu
     - Hash del documento
   - **Ubicación sugerida**: `backend/modules/generadorQR.js` y en PDF de facturas

2. **Envío Real a AEAT** ⚠️
   - **Prioridad**: MEDIA
   - **Estado**: Simulado
   - **Descripción**: Actualmente es simulado. Necesita:
     - Integración con API real de AEAT
     - Certificados digitales válidos
     - Autenticación con AEAT

### VeriFactu

- ✅ Generación de códigos VeriFactu
- ✅ Formato XML según normativa
- ✅ Campos obligatorios incluidos
- ✅ Validación de XML
- ⚠️ Envío real a AEAT (simulado actualmente)

---

## 🔍 Características Técnicas Destacadas

### 1. Multiplataforma ✅
- Windows, macOS, Linux
- Electron Builder para empaquetado
- Auto-updater configurado
- Iconos personalizados

### 2. Multi-Base de Datos ✅
- Soporte SQLite (desarrollo)
- Soporte PostgreSQL (producción)
- Adaptador SQL transparente
- Migraciones automáticas

### 3. Seguridad Robusta ✅
- JWT para autenticación
- Rate limiting
- Cifrado de datos sensibles (AES-256-GCM)
- Logs de seguridad
- Control de acceso por roles (RBAC)
- Helmet para headers de seguridad
- Validación de datos fiscales

### 4. Rendimiento ✅
- Sistema de caché (node-cache)
- Paginación eficiente
- Índices optimizados
- Precalentamiento de datos
- Pool de conexiones (PostgreSQL)

### 5. Auditoría Completa ✅
- Trazabilidad de todas las operaciones
- Logs inalterables
- Historial de cambios
- Cumplimiento normativo

### 6. Importación/Exportación ✅
- Excel (clientes, coches, productos)
- PDFs de facturas
- Validación de datos
- Filtros en exportación

### 7. Certificados Digitales ✅
- Detección automática en Windows
- Firma digital de documentos
- Asociación con empresas

---

## 📝 Archivos de Configuración Clave

### Backend

- `backend/config/config.js` - Configuración centralizada (ConfigManager)
- `backend/package.json` - Dependencias y scripts
- `backend/server.js` - Servidor principal (7008 líneas)
- `backend/ecosystem.config.js` - Configuración PM2
- `backend/.env` - Variables de entorno (crear desde `env.example`)
- `backend/nodemon.json` - Configuración Nodemon

### Frontend

- `Telwagen-React-Electron-App/package.json` - Dependencias y build
- `Telwagen-React-Electron-App/src/config/backend.ts` - Configuración API
- `Telwagen-React-Electron-App/electron/main.js` - Proceso principal Electron
- `Telwagen-React-Electron-App/electron/preload.js` - Preload script
- `Telwagen-React-Electron-App/vite.config.ts` - Configuración Vite
- `Telwagen-React-Electron-App/electron-builder.config.js` - Configuración Electron Builder
- `Telwagen-React-Electron-App/tailwind.config.js` - Configuración Tailwind

---

## 🐛 Áreas de Mejora Identificadas

### 1. Código QR en PDFs ❌
- **Prioridad**: ALTA
- **Estado**: NO IMPLEMENTADO
- **Impacto**: Cumplimiento normativo incompleto
- **Solución**: Implementar generación de QR con qrcode y añadir al PDF

### 2. Testing ⚠️
- **Prioridad**: MEDIA
- **Estado**: No se encontraron tests automatizados
- **Impacto**: Riesgo de regresiones
- **Solución**: Añadir tests unitarios e integración (Jest, Supertest)

### 3. Documentación de API ⚠️
- **Prioridad**: MEDIA
- **Estado**: No hay documentación Swagger/OpenAPI
- **Impacto**: Dificulta integración
- **Solución**: Añadir Swagger/OpenAPI con swagger-ui-express

### 4. Manejo de Errores ⚠️
- **Prioridad**: MEDIA
- **Estado**: Mejorable
- **Impacto**: UX mejorable
- **Solución**: 
  - Mejorar mensajes de error al usuario
  - Implementar error boundaries en React
  - Centralizar manejo de errores

### 5. Optimización ⚠️
- **Prioridad**: BAJA
- **Estado**: Funcional pero mejorable
- **Impacto**: Rendimiento
- **Solución**:
  - Lazy loading de componentes React
  - Code splitting
  - Optimización de queries SQL

### 6. Envío Real a AEAT ⚠️
- **Prioridad**: MEDIA
- **Estado**: Simulado
- **Impacto**: Funcionalidad incompleta
- **Solución**: Integrar con API real de AEAT cuando esté disponible

---

## 📊 Estadísticas del Proyecto

### Código

- **Backend**: ~7000+ líneas (solo `server.js`)
- **Módulos Backend**: 20 módulos especializados
- **Frontend**: Múltiples componentes React
- **Pantallas Frontend**: 8 pantallas principales
- **Servicios Frontend**: 13 servicios API
- **Componentes UI**: 55+ componentes (Radix UI)
- **Hooks personalizados**: 8 hooks
- **Endpoints API**: ~112 rutas

### Base de Datos

- **Tablas principales**: 13 tablas
- **Índices**: Múltiples índices optimizados
- **Migraciones**: 3 migraciones SQL
- **Soporte**: SQLite + PostgreSQL

### Seguridad

- **Módulos de seguridad**: 10 módulos
- **Niveles de seguridad**: Múltiples capas
- **Cumplimiento normativo**: 90% (falta QR)

---

## 🎯 Conclusión

**Telwagen** es un sistema robusto y completo para la gestión de facturación en el sector automovilístico, con:

### Fortalezas ✅

- ✅ Arquitectura bien estructurada y modular
- ✅ Cumplimiento normativo avanzado (Ley Antifraude)
- ✅ Seguridad implementada en múltiples capas
- ✅ Interfaz moderna y responsive
- ✅ Multiplataforma (Electron)
- ✅ Escalable (PostgreSQL)
- ✅ Auditoría completa
- ✅ Sistema de caché y optimizaciones
- ✅ Importación/exportación Excel
- ✅ Certificados digitales

### Áreas de Mejora ⚠️

- ⚠️ Código QR en PDFs (ALTA prioridad)
- ⚠️ Tests automatizados
- ⚠️ Documentación API (Swagger)
- ⚠️ Envío real a AEAT (simulado actualmente)

### Estado General

El proyecto está en un **estado avanzado y funcional**, con una base sólida para producción. Las mejoras pendientes son principalmente:
1. Implementar código QR en PDFs (crítico para cumplimiento)
2. Añadir tests automatizados (calidad)
3. Documentar API (integración)

---

## 📚 Documentación Adicional

- `README.md` - Guía rápida de inicio
- `ANALISIS_PROYECTO.md` - Análisis previo del proyecto
- `backend/VERIFICACION_VERIFACTU.md` - Estado de cumplimiento VeriFactu
- `SISTEMA_ACTUALIZACION_AUTOMATICA.md` - Sistema de actualizaciones
- `HOME_RESPONSIVE_COMPLETO.md` - Responsividad del dashboard
- `ERROR_RECURSION_CORREGIDO.md` - Corrección de errores

---

## 🔗 Enlaces Útiles

- **Backend URL**: Configurado en `Telwagen-React-Electron-App/src/config/backend.ts`
- **Ngrok**: `https://unencountered-fabiola-constrictedly.ngrok-free.dev`
- **Puerto Backend**: 3000 (HTTP) / 8443 (HTTPS)
- **Puerto Frontend**: 5173 (Vite dev server)

---

*Análisis generado automáticamente - Proyecto Telwagen Generador de Facturas*









