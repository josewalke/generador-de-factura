# 🐘 Migración a PostgreSQL - Guía Completa

## 📋 Requisitos Previos

1. **PostgreSQL instalado** en tu sistema
2. **Base de datos creada** llamada `telwagen` (o el nombre que prefieras)
3. **Usuario con permisos** para crear tablas y realizar operaciones

## 🚀 Pasos para la Migración

### 1. Instalar Dependencias

```bash
cd backend
npm install pg
```

### 2. Crear Base de Datos en PostgreSQL

Conéctate a PostgreSQL y crea la base de datos:

```sql
-- Conectarse a PostgreSQL como superusuario
psql -U postgres

-- Crear base de datos
CREATE DATABASE telwagen;

-- Crear usuario (opcional)
CREATE USER telwagen_user WITH PASSWORD 'tu_password_seguro';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE telwagen TO telwagen_user;
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` con la siguiente configuración:

```env
# Tipo de base de datos
DB_TYPE=postgresql

# Configuración PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telwagen
DB_USER=postgres
DB_PASSWORD=tu_password
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=2000
DB_IDLE_TIMEOUT=30000
```

O copia el archivo de ejemplo:
```bash
cp .env.example.postgresql .env
```

Y edita los valores según tu configuración.

### 4. Iniciar el Servidor

El sistema detectará automáticamente que debe usar PostgreSQL y creará las tablas necesarias:

```bash
npm start
```

## 🔄 Diferencias entre SQLite y PostgreSQL

### Tipos de Datos Convertidos Automáticamente

- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `DATETIME` → `TIMESTAMP`
- `REAL` → `NUMERIC`
- `TEXT` → `TEXT` (compatible)
- `BOOLEAN` → `BOOLEAN` (compatible)

### Funcionalidades

- ✅ **Transacciones**: Soporte completo
- ✅ **Foreign Keys**: Funcionan igual
- ✅ **Índices**: Se crean automáticamente
- ✅ **Queries**: Compatibles con la mayoría de sintaxis SQLite

## 📊 Verificar la Migración

### 1. Verificar Conexión

El servidor mostrará en los logs:
```
✅ Base de datos PostgreSQL conectada exitosamente
```

### 2. Verificar Tablas

Conéctate a PostgreSQL y verifica las tablas:

```sql
\c telwagen
\dt
```

Deberías ver todas las tablas:
- clientes
- empresas
- usuarios
- coches
- productos
- facturas
- detalles_factura
- audit_log
- sellados_temporales

### 3. Verificar Datos

```sql
SELECT COUNT(*) FROM clientes;
SELECT COUNT(*) FROM empresas;
SELECT COUNT(*) FROM facturas;
```

## 🔙 Volver a SQLite

Si necesitas volver a SQLite, simplemente cambia en `.env`:

```env
DB_TYPE=sqlite
DB_PATH=./telwagen.db
```

## ⚠️ Notas Importantes

1. **Backup**: Antes de migrar, haz un backup de tu base de datos SQLite
2. **Migración de Datos**: Si ya tienes datos en SQLite, necesitarás exportarlos e importarlos a PostgreSQL
3. **Rendimiento**: PostgreSQL es más potente para aplicaciones con muchas conexiones concurrentes
4. **Configuración**: Ajusta `maxConnections` según tu servidor PostgreSQL

## 🐛 Solución de Problemas

### Error: "password authentication failed"
- Verifica que el usuario y contraseña sean correctos
- Revisa `pg_hba.conf` si es necesario

### Error: "database does not exist"
- Crea la base de datos: `CREATE DATABASE telwagen;`

### Error: "permission denied"
- Verifica que el usuario tenga permisos: `GRANT ALL PRIVILEGES ON DATABASE telwagen TO usuario;`

### Error: "module 'pg' not found"
- Instala la dependencia: `npm install pg`

## 📞 Soporte

Si encuentras problemas durante la migración, revisa los logs en `logs/error.log` para más detalles.

