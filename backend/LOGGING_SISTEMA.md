# 📋 Sistema de Logging Completo - Backend Telwagen

## 🎯 Descripción

Sistema de logging mejorado y detallado para el backend que registra todas las operaciones, errores, peticiones API, operaciones de base de datos, y eventos de seguridad.

## 📁 Estructura de Archivos de Log

El sistema crea archivos de log separados por categoría en el directorio `logs/`:

- **`app.log`** - Log general del sistema
- **`access.log`** - Logs de acceso y peticiones HTTP
- **`error.log`** - Solo errores del sistema
- **`operations.log`** - Operaciones CRUD y de negocio
- **`security.log`** - Eventos de seguridad y autenticación
- **`database.log`** - Queries y operaciones de base de datos
- **`cache.log`** - Operaciones de caché
- **`api.log`** - Peticiones API detalladas

## 🔧 Configuración

La configuración se encuentra en `backend/config/config.js`:

```javascript
logging: {
    level: 'info',        // Niveles: error, warn, info, debug, trace
    format: 'combined',
    file: './logs/app.log',
    maxSize: '10m',        // Tamaño máximo antes de rotar
    maxFiles: 5            // Número de archivos rotados a mantener
}
```

## 📊 Niveles de Log

1. **ERROR** - Errores críticos que requieren atención
2. **WARN** - Advertencias y situaciones anómalas
3. **INFO** - Información general del sistema
4. **DEBUG** - Información detallada para debugging
5. **TRACE** - Información muy detallada (solo desarrollo)

## 🎨 Tipos de Logs Implementados

### 1. Logs de API
- Todas las peticiones HTTP con método, URL, código de estado, tiempo de respuesta
- IP del cliente, User-Agent
- Body de peticiones (sanitizado)
- Errores HTTP detallados

### 2. Logs de Base de Datos
- Todas las queries SQL con tiempo de ejecución
- Número de filas afectadas
- Parámetros de las queries
- Alertas para queries lentas (>1s)

### 3. Logs de Operaciones CRUD
- Creación de registros (clientes, coches, facturas, etc.)
- Actualización de registros
- Eliminación de registros
- Lectura de registros con filtros

### 4. Logs de Seguridad
- Intentos de login (exitosos y fallidos)
- Logouts
- Eventos de seguridad
- Accesos no autorizados

### 5. Logs de Importación/Exportación
- Importación de Excel (coches, productos, clientes)
- Exportación de datos
- Errores de importación
- Estadísticas de registros procesados

### 6. Logs de Facturación
- Creación de facturas
- Actualización de facturas
- Generación de códigos VeriFactu
- Firmas digitales

### 7. Logs de Caché
- Operaciones de caché (GET, SET, DELETE)
- Cache HIT/MISS
- TTL de caché

## 📝 Ejemplos de Uso

### En el código:

```javascript
// Log simple
logger.info('Operación completada', { userId: 123 }, 'operations');

// Log de operación CRUD
logger.operationCreate('cliente', 456, { nombre: 'Juan', email: 'juan@example.com' });

// Log de API
logger.apiRequest('POST', '/api/facturas', 201, 150, req);

// Log de base de datos
logger.databaseQuery('SELECT * FROM clientes', 45, 10, [param1, param2]);

// Log de error
logger.error('Error procesando factura', { 
    error: err.message, 
    facturaId: 789,
    stack: err.stack 
}, 'operations');

// Log de seguridad
logger.authLogin(123, 'usuario', true, null);
logger.securityEvent('intento_acceso_no_autorizado', { ip: '192.168.1.1' }, 'high');
```

## 🔍 Consultar Logs

### Ver logs en tiempo real:

```bash
# Log general
tail -f logs/app.log

# Solo errores
tail -f logs/error.log

# Operaciones
tail -f logs/operations.log

# API
tail -f logs/api.log

# Base de datos
tail -f logs/database.log
```

### Buscar en logs:

```bash
# Buscar errores de facturas
grep "factura" logs/error.log

# Buscar peticiones lentas (>1000ms)
grep "1000ms" logs/api.log

# Buscar queries lentas
grep "Slow" logs/database.log
```

## 📊 Estadísticas de Logs

Obtener estadísticas de logs mediante API:

```bash
GET /api/logs/stats
Authorization: Bearer <token>
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "total": 12345,
    "byLevel": {
      "error": 23,
      "warn": 156,
      "info": 8900,
      "debug": 3266
    },
    "byCategory": {
      "api": 4500,
      "operations": 3200,
      "database": 2800,
      "security": 150
    },
    "uptime": 86400,
    "memory": {
      "heapUsed": 45678901,
      "heapTotal": 67108864
    }
  }
}
```

## 🔄 Rotación de Logs

Los logs se rotan automáticamente cuando alcanzan el tamaño máximo:

- Archivo actual: `app.log`
- Rotado 1: `app.log.1`
- Rotado 2: `app.log.2`
- ...
- Rotado N: `app.log.N` (se elimina el más antiguo)

## 🧹 Limpieza Automática

El sistema limpia automáticamente logs antiguos cada 24 horas:

- Mantiene logs de los últimos 30 días
- Elimina logs más antiguos automáticamente
- Se ejecuta en segundo plano sin afectar el rendimiento

## 🔒 Seguridad

- **Sanitización automática**: Los datos sensibles (passwords, tokens, etc.) se ocultan automáticamente
- **Logs de seguridad separados**: Eventos de seguridad en archivo dedicado
- **Control de acceso**: Estadísticas de logs solo para administradores

## 📈 Monitoreo

### Métricas importantes a monitorear:

1. **Errores por hora**: `grep ERROR logs/error.log | wc -l`
2. **Peticiones lentas**: `grep ">1000ms" logs/api.log`
3. **Queries lentas**: `grep "Slow" logs/database.log`
4. **Intentos de login fallidos**: `grep "FAILED" logs/security.log`

## 🚀 Mejores Prácticas

1. **Usar niveles apropiados**: No usar `error` para warnings
2. **Incluir contexto**: Siempre agregar metadata relevante
3. **Sanitizar datos**: El sistema lo hace automáticamente, pero verificar
4. **No loguear datos sensibles**: El sistema los oculta, pero evitar incluirlos
5. **Revisar logs regularmente**: Especialmente `error.log` y `security.log`

## 🐛 Debugging

Para debugging detallado, cambiar el nivel de log a `debug` o `trace`:

```javascript
// En config/config.js
logging: {
    level: 'debug'  // o 'trace' para máximo detalle
}
```

## 📞 Soporte

Para problemas con el sistema de logging:
1. Verificar permisos del directorio `logs/`
2. Verificar espacio en disco
3. Revisar `logs/error.log` para errores del sistema de logging
4. Verificar configuración en `config/config.js`

---

**Última actualización**: Sistema de logging completo implementado con categorías separadas, rotación automática y limpieza de logs antiguos.

