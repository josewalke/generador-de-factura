# 📋 Requisitos de Instalación - Generador de Facturas Telwagen

## Requisitos Mínimos del Sistema

### Windows
- **Sistema Operativo:** Windows 10 (64-bit) o superior
- **Procesador:** Procesador de 64 bits
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **Espacio en disco:** 500 MB libres
- **Node.js:** Versión 18.x o superior (se verifica automáticamente)
- **Conexión a Internet:** Requerida para la primera instalación y actualizaciones

### macOS
- **Sistema Operativo:** macOS 10.15 (Catalina) o superior
- **Procesador:** Intel (x64) o Apple Silicon (ARM64)
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **Espacio en disco:** 500 MB libres
- **Node.js:** Versión 18.x o superior
- **Conexión a Internet:** Requerida para la primera instalación y actualizaciones

### Linux
- **Sistema Operativo:** 
  - Ubuntu 20.04 LTS o superior
  - Debian 11 o superior
  - Fedora 34 o superior
  - Otras distribuciones compatibles con AppImage
- **Procesador:** Procesador de 64 bits
- **RAM:** 4 GB mínimo (8 GB recomendado)
- **Espacio en disco:** 500 MB libres
- **Node.js:** Versión 18.x o superior
- **Conexión a Internet:** Requerida para la primera instalación y actualizaciones

## Verificación de Requisitos

### Verificar versión de Node.js

**Windows (PowerShell):**
```powershell
node --version
```

**macOS/Linux (Terminal):**
```bash
node --version
```

**Resultado esperado:** `v18.x.x` o superior

Si Node.js no está instalado, descárgalo desde [nodejs.org](https://nodejs.org/)

### Verificar espacio en disco

**Windows (PowerShell):**
```powershell
Get-PSDrive C | Select-Object Used,Free
```

**macOS/Linux (Terminal):**
```bash
df -h
```

Asegúrate de tener al menos **500 MB libres**.

### Verificar puerto disponible

La aplicación usa el puerto **3000** para el backend. Verifica que esté libre:

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3000
```

**macOS/Linux (Terminal):**
```bash
lsof -i :3000
```

Si hay un proceso usando el puerto, ciérralo antes de instalar.

## Requisitos Adicionales

### Permisos Necesarios

La aplicación requiere los siguientes permisos:

1. **Acceso a red local** - Para conectar con el backend
2. **Acceso a Internet** - Para servicios en línea (ngrok)
3. **Acceso al sistema de archivos** - Para guardar facturas y datos
4. **Permisos de firewall** - Se solicitarán automáticamente en Windows

### Dependencias del Backend

El backend incluye las siguientes dependencias (se instalan automáticamente):

- **Express.js** - Servidor web
- **SQLite** - Base de datos
- **CORS** - Control de acceso
- **Helmet** - Seguridad HTTP
- Y otras dependencias necesarias

### Configuración de Red

La aplicación funciona en los siguientes escenarios:

1. **Modo local** - Backend ejecutándose en el mismo ordenador
2. **Modo red local** - Backend accesible desde otros ordenadores en la misma red
3. **Modo Internet** - Backend accesible desde cualquier lugar (usando ngrok)

## Instalación de Node.js (si no está instalado)

### Windows

1. Visita [nodejs.org](https://nodejs.org/)
2. Descarga la versión LTS (Long Term Support)
3. Ejecuta el instalador
4. Sigue las instrucciones del asistente
5. Reinicia tu ordenador
6. Verifica la instalación: `node --version`

### macOS

**Opción 1: Instalador oficial**
1. Visita [nodejs.org](https://nodejs.org/)
2. Descarga la versión LTS para macOS
3. Ejecuta el archivo `.pkg`
4. Sigue las instrucciones del asistente

**Opción 2: Homebrew**
```bash
brew install node
```

### Linux

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora:**
```bash
sudo dnf install nodejs npm
```

## Verificación Post-Instalación

Después de instalar la aplicación, verifica que todo funcione:

1. **Inicia la aplicación**
2. **Verifica el estado del backend** - Debe mostrar "Conectado" (indicador verde)
3. **Prueba crear una factura** - Verifica que la funcionalidad básica funciona
4. **Revisa los logs** - Si hay errores, revisa la consola de la aplicación

## Solución de Problemas de Requisitos

### Node.js no detectado

**Síntoma:** La aplicación muestra un error sobre Node.js no encontrado.

**Solución:**
1. Instala Node.js desde [nodejs.org](https://nodejs.org/)
2. Reinicia la aplicación
3. Si el problema persiste, reinicia el ordenador

### Puerto 3000 en uso

**Síntoma:** El backend no puede iniciar porque el puerto está ocupado.

**Solución:**
1. Identifica el proceso que usa el puerto (ver comandos arriba)
2. Cierra ese proceso
3. Reinicia la aplicación

### Permisos insuficientes

**Síntoma:** La aplicación no puede escribir archivos o acceder a la red.

**Solución:**
1. **Windows:** Ejecuta la aplicación como administrador (solo la primera vez)
2. **macOS:** Verifica permisos en "Preferencias del Sistema" > "Seguridad y Privacidad"
3. **Linux:** Asegúrate de tener permisos de escritura en el directorio de instalación

## Preguntas Frecuentes

**P: ¿Necesito instalar Node.js manualmente?**  
R: En la mayoría de los casos, no. La aplicación verificará e intentará usar Node.js del sistema. Si no está instalado, te guiará para instalarlo.

**P: ¿Puedo usar la aplicación sin conexión a Internet?**  
R: Sí, la aplicación puede funcionar completamente en modo local sin Internet, siempre que el backend esté ejecutándose localmente.

**P: ¿Qué pasa si tengo una versión antigua de Node.js?**  
R: La aplicación requiere Node.js 18.x o superior. Si tienes una versión anterior, actualiza Node.js antes de usar la aplicación.

**P: ¿Puedo cambiar el puerto del backend?**  
R: Sí, puedes configurar el puerto en las variables de entorno o en el archivo de configuración del backend.

---

**Versión del documento:** 1.0.0  
**Última actualización:** 2024

