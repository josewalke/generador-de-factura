# 📋 Estructura de Tablas: Proformas y Relación con Facturas

## ✅ Estado Actual

**Todas las tablas necesarias están creadas y configuradas correctamente.**

---

## 📊 Tabla: `proformas`

### Estructura

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NOT NULL | AUTO_INCREMENT | ID único (Primary Key) |
| `numero_proforma` | TEXT | NOT NULL | - | Número único de proforma |
| `empresa_id` | INTEGER | NOT NULL | - | ID de la empresa emisora (FK → empresas.id) |
| `cliente_id` | INTEGER | NULL | - | ID del cliente (FK → clientes.id) |
| `coche_id` | INTEGER | NULL | - | ID del coche principal (FK → coches.id) |
| `fecha_emision` | DATE | NOT NULL | - | Fecha de emisión |
| `fecha_validez` | DATE | NULL | - | Fecha de validez |
| `subtotal` | NUMERIC | NOT NULL | - | Subtotal sin impuestos |
| `igic` | NUMERIC | NOT NULL | - | Impuesto IGIC |
| `total` | NUMERIC | NOT NULL | - | Total con impuestos |
| `estado` | TEXT | NULL | 'pendiente' | Estado: pendiente, facturada, anulado |
| `notas` | TEXT | NULL | - | Notas adicionales |
| `fecha_creacion` | TIMESTAMP | NULL | CURRENT_TIMESTAMP | Fecha de creación |
| `activo` | BOOLEAN | NULL | true | Si está activa o no |

### Constraints

- **Primary Key**: `id`
- **Unique**: `(numero_proforma, empresa_id)` - El número de proforma debe ser único por empresa
- **Foreign Keys**:
  - `empresa_id` → `empresas.id`
  - `cliente_id` → `clientes.id`
  - `coche_id` → `coches.id`

### Índices

- `proformas_pkey` (Primary Key)
- `proformas_numero_proforma_empresa_id_key` (Unique constraint)

### Estadísticas

- **Total de proformas**: 2
- **Proformas activas**: Verificar con `SELECT COUNT(*) FROM proformas WHERE activo = true`

---

## 📊 Tabla: `detalles_proforma`

### Estructura

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NOT NULL | AUTO_INCREMENT | ID único (Primary Key) |
| `proforma_id` | INTEGER | NOT NULL | - | ID de la proforma (FK → proformas.id) |
| `producto_id` | INTEGER | NULL | - | ID del producto (FK → productos.id) |
| `coche_id` | INTEGER | NULL | - | ID del coche (FK → coches.id) |
| `cantidad` | INTEGER | NOT NULL | - | Cantidad |
| `precio_unitario` | NUMERIC | NOT NULL | - | Precio unitario |
| `subtotal` | NUMERIC | NOT NULL | - | Subtotal (precio_unitario × cantidad) |
| `igic` | NUMERIC | NOT NULL | - | Impuesto IGIC |
| `total` | NUMERIC | NOT NULL | - | Total (subtotal + igic) |
| `descripcion` | TEXT | NULL | - | Descripción del detalle |
| `tipo_impuesto` | TEXT | NULL | 'igic' | Tipo de impuesto |

### Constraints

- **Primary Key**: `id`
- **Foreign Keys**:
  - `proforma_id` → `proformas.id` (ON DELETE CASCADE)
  - `producto_id` → `productos.id`
  - `coche_id` → `coches.id`

### Índices

- `detalles_proforma_pkey` (Primary Key)

### Estadísticas

- **Total de detalles**: 4

---

## 🔗 Relación: `facturas` → `proformas`

### Campo de Relación

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `proforma_id` | INTEGER | NULL | ID de la proforma relacionada (FK → proformas.id) |

### Constraint

- **Foreign Key**: `fk_facturas_proforma`
  - `facturas.proforma_id` → `proformas.id`

### Índice

- `idx_facturas_proforma_id` - Para mejorar rendimiento de consultas

### Estadísticas

- **Facturas relacionadas con proformas**: 0 (las facturas existentes se crearon antes de implementar la relación)

---

## 📝 Uso de la Relación

### 1. Crear Factura desde Proforma

```javascript
POST /api/facturas
{
  "numero_factura": "TEC004/2025",
  "empresa_id": 1,
  "cliente_id": 1,
  "proforma_id": 23,  // ← ID de la proforma relacionada
  "fecha_emision": "2025-12-06",
  "subtotal": 20000,
  "igic": 1900,
  "total": 21900,
  "productos": [...]
}
```

### 2. Dividir Factura

Cuando se divide una factura que tiene `proforma_id`, todas las facturas hijas **heredan automáticamente** el mismo `proforma_id`.

### 3. Consultar Facturas con Proforma

Los endpoints GET de facturas ahora incluyen:
- `proforma_id_relacionada`: ID de la proforma
- `proforma_numero`: Número de la proforma
- `proforma_estado`: Estado de la proforma

---

## ✅ Verificación de Integridad

### Scripts de Verificación

1. **`verificar_crear_tabla_proformas.js`** - Verifica y crea las tablas si no existen
2. **`verificar_estructura_completa_proformas.js`** - Verifica la estructura completa
3. **`ejecutar_migracion_proforma_id.js`** - Ejecuta la migración de relación

### Comandos Útiles

```bash
# Verificar estructura
node verificar_estructura_completa_proformas.js

# Verificar y crear tablas si faltan
node verificar_crear_tabla_proformas.js

# Ejecutar migración de relación
node ejecutar_migracion_proforma_id.js
```

---

## 🎯 Resumen

✅ **Tabla `proformas`**: Creada y funcionando (2 proformas)  
✅ **Tabla `detalles_proforma`**: Creada y funcionando (4 detalles)  
✅ **Campo `proforma_id` en `facturas`**: Creado y configurado  
✅ **Foreign Key Constraint**: Configurado correctamente  
✅ **Índices**: Creados para optimizar consultas  
✅ **Endpoints API**: Actualizados para soportar la relación  

**Todo está listo para relacionar facturas con proformas.** 🚀









