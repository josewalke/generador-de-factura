# 🚀 Guía de Migración: SQLite → PostgreSQL

## 📋 Resumen

Este script migra **todos los datos** de tu base de datos SQLite a PostgreSQL, incluyendo:
- ✅ Todas las tablas
- ✅ Todos los registros
- ✅ Todas las relaciones
- ✅ Índices para optimización

## 🎯 Requisitos Previos

1. **PostgreSQL instalado y ejecutándose**
2. **Base de datos creada** en PostgreSQL
3. **Dependencia `pg` instalada**: `npm install pg`
4. **Archivo SQLite existente** en `backend/database/telwagen.db`

## 📝 Paso a Paso

### 1. Crear Base de Datos en PostgreSQL

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE telwagen;

-- (Opcional) Crear usuario específico
CREATE USER telwagen_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE telwagen TO telwagen_user;
```

### 2. Configurar Variables de Entorno

Crea o edita el archivo `.env` en `backend/`:

```env
# Configuración PostgreSQL
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telwagen
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
```

### 3. Ejecutar Migración

```bash
cd backend
npm run migrate:postgresql
```

O directamente:

```bash
node migrar_a_postgresql.js
```

## 📊 Qué Hace el Script

1. **Conecta a SQLite** (solo lectura)
2. **Conecta a PostgreSQL**
3. **Crea todas las tablas** en PostgreSQL con el esquema correcto
4. **Migra todos los datos** tabla por tabla
5. **Crea índices** para optimizar consultas
6. **Verifica la migración** contando registros
7. **Muestra un resumen** completo

## 🔍 Tablas que se Migran

- `empresas` - Datos de empresas
- `usuarios` - Usuarios del sistema
- `clientes` - Clientes
- `coches` - Inventario de vehículos
- `productos` - Catálogo de productos
- `facturas` - Facturas (con todos los campos de Ley Antifraude)
- `detalles_factura` - Detalles de productos en facturas
- `audit_log` - Logs de auditoría
- `sellados_temporales` - Sellados temporales (Ley Antifraude)

## ⚙️ Características del Script

- ✅ **Conversión automática** de tipos de datos
- ✅ **Manejo de duplicados** (ON CONFLICT DO NOTHING)
- ✅ **Progreso en tiempo real**
- ✅ **Manejo de errores** robusto
- ✅ **Verificación post-migración**
- ✅ **Creación automática de índices**

## 🔄 Después de la Migración

1. **Verificar datos**:
   ```sql
   \c telwagen
   SELECT COUNT(*) FROM facturas;
   SELECT COUNT(*) FROM clientes;
   SELECT COUNT(*) FROM empresas;
   ```

2. **Configurar aplicación**:
   - Asegúrate de que `.env` tenga `DB_TYPE=postgresql`
   - Reinicia el servidor: `npm start`

3. **Verificar funcionamiento**:
   - Prueba crear una factura
   - Verifica que los datos se guarden correctamente
   - Revisa los logs en `logs/database.log`

## ⚠️ Notas Importantes

- **No elimina datos de SQLite**: El archivo SQLite se mantiene intacto
- **Maneja duplicados**: Si ejecutas el script varias veces, no duplicará registros
- **Preserva relaciones**: Las foreign keys se mantienen correctamente
- **Conversión automática**: Los tipos de datos se convierten automáticamente

## 🐛 Solución de Problemas

### Error: "Módulo pg no instalado"
```bash
npm install pg
```

### Error: "password authentication failed"
- Verifica usuario y contraseña en `.env`
- Verifica `pg_hba.conf` si es necesario

### Error: "database does not exist"
```sql
CREATE DATABASE telwagen;
```

### Error: "permission denied"
```sql
GRANT ALL PRIVILEGES ON DATABASE telwagen TO tu_usuario;
```

### Algunos registros no se migran
- Verifica los logs del script
- Algunos pueden ser duplicados (se ignoran automáticamente)
- Revisa los errores mostrados en consola

## 📈 Rendimiento

- **Migración en lotes**: Procesa 100 registros a la vez
- **Progreso visible**: Muestra el progreso en tiempo real
- **Índices al final**: Se crean después de migrar datos para mejor rendimiento

## ✅ Verificación Post-Migración

Después de migrar, verifica:

```sql
-- Contar registros por tabla
SELECT 'empresas' as tabla, COUNT(*) as registros FROM empresas
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'facturas', COUNT(*) FROM facturas
UNION ALL
SELECT 'coches', COUNT(*) FROM coches
UNION ALL
SELECT 'productos', COUNT(*) FROM productos;

-- Verificar una factura completa
SELECT f.*, c.nombre as cliente_nombre, e.nombre as empresa_nombre
FROM facturas f
LEFT JOIN clientes c ON f.cliente_id = c.id
LEFT JOIN empresas e ON f.empresa_id = e.id
LIMIT 1;
```

---

**¡Listo!** Tus datos ahora están en PostgreSQL. 🎉

