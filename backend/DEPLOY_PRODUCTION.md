# 🚀 Guía de Despliegue en Producción

## 📋 Requisitos Previos

- ✅ Node.js v20+ instalado
- ✅ PostgreSQL instalado y ejecutándose
- ✅ Base de datos `telwagen` creada
- ✅ Todas las dependencias instaladas (`npm install`)

## 🔧 Configuración Inicial

### 1. Configurar Variables de Entorno

Copia el archivo de producción y ajusta según necesites:

```bash
cp .env.production .env
```

**IMPORTANTE**: Edita `.env` y cambia:
- `JWT_SECRET`: Genera una clave segura
- `ENCRYPTION_KEY`: Genera una clave segura
- `DB_PASSWORD`: Tu contraseña de PostgreSQL
- `PORT`: Puerto donde correrá el servidor (default: 3000)

### 2. Generar Claves Seguras

```bash
# En Windows (PowerShell)
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$encKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# En Linux/Mac
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para ENCRYPTION_KEY
```

## 🚀 Opciones de Inicio

### Opción 1: Inicio Simple (Desarrollo/Testing)

**Windows:**
```bash
start-production.bat
```

**Linux/Mac:**
```bash
chmod +x start-production.sh
./start-production.sh
```

**O con npm:**
```bash
npm run start:prod
```

### Opción 2: Con PM2 (Recomendado para Producción)

PM2 es un gestor de procesos que mantiene la aplicación corriendo y la reinicia automáticamente.

#### Instalar PM2
```bash
npm install -g pm2
```

#### Iniciar con PM2
```bash
npm run pm2:start
```

#### Comandos PM2 útiles
```bash
# Ver estado
pm2 status

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Detener
npm run pm2:stop

# Monitoreo
npm run pm2:monit

# Guardar configuración para inicio automático
pm2 save
pm2 startup
```

## 🔒 Configuración de Seguridad

### 1. Firewall

Abre solo el puerto necesario:
```bash
# Windows
netsh advfirewall firewall add rule name="Telwagen Backend" dir=in action=allow protocol=TCP localport=3000

# Linux (ufw)
sudo ufw allow 3000/tcp
```

### 2. Reverse Proxy (Opcional pero Recomendado)

Usa Nginx o Apache como reverse proxy:

**Nginx ejemplo:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. SSL/HTTPS

Para producción, configura SSL real:
- Usa Let's Encrypt (gratis)
- O certificados comerciales
- Configura en el reverse proxy (Nginx/Apache)

## 📊 Monitoreo

### Logs

Los logs se guardan en:
- `./logs/app.log` - Log general
- `./logs/error.log` - Errores
- `./logs/access.log` - Accesos
- `./logs/database.log` - Consultas DB
- `./logs/operations.log` - Operaciones

### Verificar Estado

```bash
# Verificar que el servidor responde
curl http://localhost:3000/

# Ver logs en tiempo real
tail -f logs/app.log

# Con PM2
pm2 logs telwagen-backend
```

## 🔄 Actualizaciones

### Proceso de Actualización

1. **Hacer backup:**
   ```bash
   # Backup de base de datos
   pg_dump -U postgres telwagen > backup_$(date +%Y%m%d).sql
   ```

2. **Detener servidor:**
   ```bash
   pm2 stop telwagen-backend
   # O si usas inicio simple, Ctrl+C
   ```

3. **Actualizar código:**
   ```bash
   git pull  # Si usas Git
   npm install  # Instalar nuevas dependencias
   ```

4. **Ejecutar migraciones (si hay):**
   ```bash
   npm run migrate:postgresql
   ```

5. **Reiniciar:**
   ```bash
   pm2 restart telwagen-backend
   # O
   npm run start:prod
   ```

## 🛠️ Solución de Problemas

### El servidor no inicia

1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que el puerto no esté en uso:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux
   lsof -i :3000
   ```

### Error de conexión a PostgreSQL

1. Verificar que PostgreSQL esté ejecutándose
2. Verificar usuario y contraseña en `.env`
3. Verificar que la base de datos `telwagen` exista
4. Verificar permisos del usuario

### Logs muestran errores

Revisa los logs en `./logs/` para más detalles:
```bash
tail -f logs/error.log
```

## 📈 Optimización

### Variables de Entorno Recomendadas

```env
# Para alta carga
DB_MAX_CONNECTIONS=50
CACHE_MAX_SIZE=10000
CACHE_TTL=1800

# Para mejor rendimiento
NODE_ENV=production
LOG_LEVEL=warn  # Menos verboso
```

### Recursos del Sistema

- **RAM mínima**: 512MB
- **RAM recomendada**: 2GB+
- **CPU**: 1 core mínimo, 2+ recomendado

## ✅ Checklist Pre-Producción

- [ ] Variables de entorno configuradas (`.env`)
- [ ] Claves de seguridad cambiadas (JWT_SECRET, ENCRYPTION_KEY)
- [ ] PostgreSQL configurado y accesible
- [ ] Base de datos creada y migrada
- [ ] Firewall configurado
- [ ] Logs funcionando
- [ ] Backup automático configurado
- [ ] PM2 configurado (si se usa)
- [ ] Reverse proxy configurado (opcional)
- [ ] SSL/HTTPS configurado (opcional pero recomendado)
- [ ] Monitoreo configurado

## 📞 Soporte

Para problemas o preguntas, revisa:
- Logs en `./logs/`
- Documentación en `README.md`
- Configuración en `config/config.js`

---

**¡Listo para producción!** 🎉

