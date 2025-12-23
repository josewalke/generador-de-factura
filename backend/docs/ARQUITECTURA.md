# 🏗️ Arquitectura del Sistema - Generador de Facturas

## Descripción General

El sistema utiliza una arquitectura **MVC (Model-View-Controller)** con separación clara de responsabilidades.

---

## 📐 Patrón Arquitectónico

### MVC (Model-View-Controller)

```
Request → Routes → Controllers → Services → Database
                ↓
            Response
```

#### Capas

1. **Routes** (`routes/`)
   - Define endpoints de API
   - Valida estructura de requests
   - Delega a controladores

2. **Controllers** (`controllers/`)
   - Maneja request/response
   - Valida datos de entrada
   - Llama a servicios
   - Maneja errores HTTP

3. **Services** (`services/`)
   - Lógica de negocio
   - Acceso a base de datos
   - Transformación de datos
   - Reglas de negocio

4. **Modules** (`modules/`)
   - Funcionalidades del sistema
   - Sistemas de seguridad
   - Utilidades compartidas

---

## 🔄 Flujo de Datos

### Ejemplo: Crear Factura

```
1. POST /api/facturas
   ↓
2. Routes (facturasRoutes.js)
   - Valida método HTTP
   - Registra ruta
   ↓
3. Controller (facturaController.js)
   - Valida datos de request
   - Extrae parámetros
   ↓
4. Service (facturaService.js)
   - Aplica reglas de negocio
   - Valida integridad
   - Calcula totales
   ↓
5. Database
   - Inserta datos
   - Aplica transacciones
   ↓
6. Response
   - Retorna factura creada
```

---

## 🗂️ Estructura de Carpetas

### Routes (`routes/`)
- Define endpoints de API
- Un archivo por entidad
- Ejemplo: `facturasRoutes.js`

### Controllers (`controllers/`)
- Maneja HTTP requests/responses
- Valida entrada
- Formatea salida
- Ejemplo: `facturaController.js`

### Services (`services/`)
- Lógica de negocio
- Acceso a datos
- Transformaciones
- Ejemplo: `facturaService.js`

### Modules (`modules/`)
- Sistemas del framework
- Utilidades compartidas
- Integraciones externas
- Ejemplo: `sistemaCache.js`

### Middlewares (`middlewares/`)
- Procesamiento de requests
- Autenticación
- Validación
- Logging
- Ejemplo: `auth.middleware.js`

---

## 🔐 Sistemas de Seguridad

### Módulos Implementados

1. **SistemaIntegridad**
   - Hashes de integridad
   - Verificación de datos

2. **SistemaAuditoria**
   - Log de operaciones
   - Trazabilidad completa

3. **SistemaCifrado**
   - Cifrado AES-256
   - Protección de datos sensibles

4. **SistemaControlAcceso**
   - Control de roles (RBAC)
   - Permisos granulares

5. **SistemaLogsSeguridad**
   - Logs de seguridad
   - Detección de amenazas

6. **SistemaValidacionFiscal**
   - Validación fiscal
   - Cumplimiento legal

7. **SistemaFirmaDigital**
   - Firma digital PKCS#7
   - Certificados digitales

---

## ⚡ Optimizaciones de Rendimiento

### Caché
- Sistema de caché en memoria
- Precalentamiento automático
- Invalidación inteligente

### Paginación
- Paginación automática
- Límites configurables
- Optimización de queries

### Compresión
- GZIP automático
- Reducción ~70% de tamaño

### Índices
- 30+ índices optimizados
- Queries 90% más rápidas

---

## 📊 Base de Datos

### Soporte Multi-DB
- SQLite (por defecto)
- PostgreSQL (producción)

### Adaptador SQL
- Abstracción de queries
- Compatibilidad automática
- Migraciones unificadas

---

## 🔄 Versionado de API

### Estrategia Actual
- Rutas sin versión: `/api/*` (compatibilidad)
- Rutas versionadas: `/api/v1/*` (preparado, opcional)

### Migración Futura
- Migración gradual posible
- Sin romper compatibilidad
- Versiones paralelas

---

## 📝 Mejores Prácticas

### Código
- ✅ Separación de responsabilidades
- ✅ Dependency Injection
- ✅ Error handling consistente
- ✅ Logging estructurado

### Seguridad
- ✅ Validación de entrada
- ✅ Sanitización de datos
- ✅ Autenticación JWT
- ✅ Rate limiting

### Rendimiento
- ✅ Caché inteligente
- ✅ Paginación
- ✅ Compresión
- ✅ Índices optimizados

---

## 🔗 Referencias

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Última actualización**: 2025-01-27

