# 📝 Cómo Configurar PostgreSQL en el archivo .env

## 🔑 Datos que necesitas de PostgreSQL

Para configurar la conexión a PostgreSQL, necesitas estos datos:

1. **DB_HOST** - Dirección del servidor (normalmente `localhost`)
2. **DB_PORT** - Puerto (normalmente `5432`)
3. **DB_NAME** - Nombre de la base de datos (ej: `telwagen`)
4. **DB_USER** - Usuario de PostgreSQL (normalmente `postgres`)
5. **DB_PASSWORD** - Contraseña de PostgreSQL

## 📋 Ejemplo de configuración

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telwagen
DB_USER=postgres
DB_PASSWORD=mi_password_seguro
```

## 🔍 Cómo obtener estos datos

### Si instalaste PostgreSQL localmente:

1. **Host y Puerto**: Normalmente son `localhost` y `5432`
2. **Usuario**: Normalmente es `postgres` (el usuario por defecto)
3. **Contraseña**: La que configuraste durante la instalación
4. **Base de datos**: Puedes usar `telwagen` o crear una nueva

### Crear la base de datos (si no existe):

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear la base de datos
CREATE DATABASE telwagen;

-- (Opcional) Crear un usuario específico
CREATE USER telwagen_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE telwagen TO telwagen_user;
```

## ✅ Verificar la conexión

Puedes probar la conexión con:

```bash
psql -h localhost -p 5432 -U postgres -d telwagen
```

## 🛠️ Actualizar el archivo .env

1. Abre el archivo `.env` en la raíz del proyecto
2. Busca la sección `CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL`
3. Actualiza los valores según tu configuración
4. Guarda el archivo

---

**Nota de seguridad**: Nunca compartas tu contraseña de PostgreSQL públicamente. Si me la proporcionas aquí, solo la usaré para actualizar el archivo `.env` local.

