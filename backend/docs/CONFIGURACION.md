# 📋 Guía de Configuración - Generador de Facturas

## Descripción General

Este documento describe la configuración completa del sistema, incluyendo variables de entorno, configuración de base de datos, seguridad y rendimiento.

---

## 🔧 Variables de Entorno

### Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto `backend/` basándote en `env.example`.

### Variables Principales

#### Servidor
```env
PORT=3000                    # Puerto del servidor
HOST=0.0.0.0                # Host (0.0.0.0 para acceso externo)
NODE_ENV=production         # Entorno: development, production
```

#### Base de Datos
```env
DATABASE_TYPE=sqlite        # Tipo: sqlite o postgresql
DATABASE_PATH=./database/telwagen.db  # Ruta para SQLite
DATABASE_HOST=localhost     # Host para PostgreSQL
DATABASE_PORT=5432          # Puerto para PostgreSQL
DATABASE_NAME=telwagen      # Nombre de la base de datos
DATABASE_USER=postgres      # Usuario de PostgreSQL
DATABASE_PASSWORD=password  # Contraseña de PostgreSQL
```

#### Seguridad
```env
JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRES_IN=8h           # Tiempo de expiración del token
BCRYPT_ROUNDS=10            # Rondas de bcrypt
```

#### Caché
```env
CACHE_TTL=3600              # TTL del caché en segundos (1 hora)
CACHE_MAX_SIZE=100          # Máximo de claves en caché
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000 # Ventana de tiempo (15 minutos)
RATE_LIMIT_MAX=100          # Máximo de requests por ventana
RATE_LIMIT_LOGIN_MAX=5      # Máximo de intentos de login
```

---

## 🗄️ Configuración de Base de Datos

### SQLite (Por Defecto)

SQLite es la opción por defecto y no requiere configuración adicional. La base de datos se crea automáticamente en `backend/database/telwagen.db`.

**Ventajas:**
- ✅ No requiere servidor de base de datos
- ✅ Fácil de usar en desarrollo
- ✅ Archivo único portable

**Desventajas:**
- ⚠️ Menor rendimiento en alta concurrencia
- ⚠️ Limitaciones en operaciones complejas

### PostgreSQL

Para usar PostgreSQL, configura las variables de entorno y ejecuta:

```bash
npm run migrate:postgresql
```

**Ventajas:**
- ✅ Mejor rendimiento
- ✅ Soporte para alta concurrencia
- ✅ Funciones avanzadas

---

## 🔒 Configuración de Seguridad

### JWT (JSON Web Tokens)

```javascript
{
  secret: process.env.JWT_SECRET,
  expiresIn: '8h',
  algorithm: 'HS256'
}
```

### Helmet.js

Configuración de headers de seguridad:
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- XSS Protection
- No Sniff

### Rate Limiting

- **General**: 100 requests / 15 minutos
- **Login**: 5 intentos / 15 minutos
- **Protección**: Bloqueo automático después de intentos fallidos

---

## ⚡ Configuración de Rendimiento

### Compresión

```javascript
{
  level: 6,        // Nivel de compresión (0-9)
  threshold: 1024  // Solo comprimir > 1KB
}
```

### Caché

```javascript
{
  ttl: 3600,       // 1 hora
  maxSize: 100     // Máximo de claves
}
```

### Índices de Base de Datos

Los índices se crean automáticamente al inicializar la base de datos. Ver `migrations/006_indices_rendimiento.sql`.

---

## 📝 Configuración de Logging

### Niveles de Log

- `ERROR`: Errores críticos
- `WARN`: Advertencias
- `INFO`: Información general
- `DEBUG`: Información de depuración

### Archivos de Log

- `logs/app.log`: Log general
- `logs/api.log`: Log de API
- `logs/error.log`: Errores
- `logs/security.log`: Eventos de seguridad
- `logs/database.log`: Operaciones de base de datos

---

## 🚀 Configuración de Producción

### PM2

```bash
npm run pm2:start    # Iniciar con PM2
npm run pm2:stop     # Detener
npm run pm2:restart  # Reiniciar
npm run pm2:logs     # Ver logs
```

### Variables de Producción

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_TYPE=postgresql  # Recomendado para producción
```

---

## 📚 Referencias

- [Documentación de Express](https://expressjs.com/)
- [Documentación de SQLite](https://www.sqlite.org/docs.html)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)

---

**Última actualización**: 2025-01-27

