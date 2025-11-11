# 🐘 Configuración de PostgreSQL - Guía Rápida

## ✅ Cambios Implementados

El sistema ahora soporta **PostgreSQL** además de SQLite. Puedes elegir qué base de datos usar mediante configuración.

## 📦 Instalación

### 1. Instalar dependencia

```bash
cd backend
npm install pg
```

### 2. Crear base de datos en PostgreSQL

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE telwagen;

-- (Opcional) Crear usuario específico
CREATE USER telwagen_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE telwagen TO telwagen_user;
```

### 3. Configurar variables de entorno

Crea o edita el archivo `.env` en `backend/`:

```env
# Tipo de base de datos: 'postgresql' o 'sqlite'
DB_TYPE=postgresql

# Configuración PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telwagen
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_MAX_CONNECTIONS=20
```

### 4. Iniciar el servidor

```bash
npm start
```

El sistema detectará automáticamente que debe usar PostgreSQL y:
- Se conectará a la base de datos
- Creará todas las tablas necesarias
- Adaptará las queries SQL automáticamente
- Insertará datos de ejemplo

## 🔄 Volver a SQLite

Si quieres volver a usar SQLite, simplemente cambia en `.env`:

```env
DB_TYPE=sqlite
DB_PATH=./telwagen.db
```

## 📝 Notas Técnicas

### Conversión Automática

El sistema convierte automáticamente:
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `DATETIME` → `TIMESTAMP`
- `REAL` → `NUMERIC`
- `?` (parámetros SQLite) → `$1, $2, ...` (parámetros PostgreSQL)
- `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`

### Compatibilidad

- ✅ Todas las queries existentes funcionan sin cambios
- ✅ El código usa un wrapper compatible con SQLite
- ✅ Los callbacks funcionan igual que antes
- ✅ Las transacciones están soportadas

## 🐛 Solución de Problemas

### Error: "Módulo pg no está instalado"
```bash
npm install pg
```

### Error: "password authentication failed"
- Verifica usuario y contraseña en `.env`
- Verifica que PostgreSQL esté ejecutándose

### Error: "database does not exist"
- Crea la base de datos: `CREATE DATABASE telwagen;`

### Error: "permission denied"
- Verifica permisos del usuario en PostgreSQL

## 📊 Ventajas de PostgreSQL

- ✅ Mejor rendimiento con múltiples conexiones
- ✅ Transacciones más robustas
- ✅ Mejor escalabilidad
- ✅ Funciones avanzadas de SQL
- ✅ Mejor para producción

---

**¡Listo!** Tu aplicación ahora puede usar PostgreSQL. 🎉

