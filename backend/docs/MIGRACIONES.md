# 🔄 Guía de Migraciones - Generador de Facturas

## Descripción General

Este documento describe el sistema de migraciones de base de datos y cómo aplicarlas.

---

## 📁 Estructura de Migraciones

Las migraciones se encuentran en `backend/migrations/` y se ejecutan automáticamente al inicializar la base de datos.

### Archivos de Migración

1. **001_ley_antifraude_fields.sql**
   - Campos adicionales para cumplir con Ley Antifraude española
   - Campos: `numero_serie`, `fecha_operacion`, `hash_documento`, etc.

2. **002_sellados_temporales.sql**
   - Tabla `sellados_temporales` para sellos temporales
   - Índices para optimización

3. **003_indices_antifraude.sql**
   - Índices para campos de Ley Antifraude
   - Optimización de queries relacionadas

4. **004_relacion_facturas_proformas.sql**
   - Relación entre facturas y proformas
   - Campo `proforma_id` en facturas

5. **005_tabla_abonos.sql**
   - Tabla `abonos` y `detalles_abono`
   - Estructura completa de abonos

6. **006_indices_rendimiento.sql**
   - 30+ índices optimizados para rendimiento
   - Cobertura completa de queries frecuentes

---

## 🔄 Aplicación de Migraciones

### Automática

Las migraciones se aplican automáticamente al inicializar el servidor:

```javascript
// En server.js - initDatabase()
await applyPerformanceIndexes(isPostgreSQL);
```

### Manual

Para aplicar migraciones manualmente:

#### SQLite
```bash
sqlite3 database/telwagen.db < migrations/006_indices_rendimiento.sql
```

#### PostgreSQL
```bash
psql -U usuario -d telwagen -f migrations/006_indices_rendimiento.sql
```

---

## 📋 Orden de Ejecución

Las migraciones se ejecutan en orden numérico:

1. `001_ley_antifraude_fields.sql`
2. `002_sellados_temporales.sql`
3. `003_indices_antifraude.sql`
4. `004_relacion_facturas_proformas.sql`
5. `005_tabla_abonos.sql`
6. `006_indices_rendimiento.sql`

---

## ⚠️ Precauciones

### Antes de Aplicar Migraciones

1. **Backup**: Siempre haz backup de la base de datos antes de aplicar migraciones
2. **Entorno de Pruebas**: Prueba las migraciones en un entorno de desarrollo primero
3. **Revisión**: Revisa el contenido de las migraciones antes de aplicarlas

### Errores Comunes

#### Índice ya existe
```
Error: index already exists
```
**Solución**: El sistema ignora automáticamente estos errores. Es seguro.

#### Columna duplicada
```
Error: duplicate column name
```
**Solución**: El sistema ignora automáticamente estos errores. Es seguro.

---

## 🔍 Verificación de Migraciones

### Verificar Índices

```sql
-- SQLite
SELECT name FROM sqlite_master WHERE type='index';

-- PostgreSQL
SELECT indexname FROM pg_indexes WHERE tablename = 'facturas';
```

### Verificar Tablas

```sql
-- SQLite
SELECT name FROM sqlite_master WHERE type='table';

-- PostgreSQL
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## 📝 Crear Nueva Migración

### Formato del Nombre

```
XXX_descripcion.sql
```

Donde `XXX` es un número secuencial (007, 008, etc.)

### Estructura

```sql
-- Descripción de la migración
-- Fecha: YYYY-MM-DD
-- Autor: Nombre

-- Crear tabla
CREATE TABLE IF NOT EXISTS nueva_tabla (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campo TEXT NOT NULL
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_nueva_tabla_campo ON nueva_tabla(campo);
```

### Aplicar Nueva Migración

1. Crear archivo en `migrations/`
2. Añadir lógica de aplicación en `server.js` si es necesario
3. Probar en entorno de desarrollo
4. Aplicar en producción

---

## 🔄 Migración a PostgreSQL

Para migrar de SQLite a PostgreSQL:

```bash
npm run migrate:postgresql
```

Este script:
1. Crea las tablas en PostgreSQL
2. Migra los datos de SQLite
3. Aplica todas las migraciones

---

## 📚 Referencias

- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [PostgreSQL Migrations](https://www.postgresql.org/docs/current/ddl-alter.html)

---

**Última actualización**: 2025-01-27

