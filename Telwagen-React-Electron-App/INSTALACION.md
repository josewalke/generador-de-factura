# 📦 Guía de Instalación - Generador de Facturas Telwagen

## Requisitos del Sistema

### Windows
- Windows 10 o superior (64-bit)
- Node.js 18.x o superior (se instalará automáticamente si no está presente)
- 500 MB de espacio libre en disco
- Conexión a Internet (para la primera instalación)

### macOS
- macOS 10.15 (Catalina) o superior
- Node.js 18.x o superior
- 500 MB de espacio libre en disco
- Conexión a Internet (para la primera instalación)

### Linux
- Ubuntu 20.04 o superior / Debian 11 o superior
- Node.js 18.x o superior
- 500 MB de espacio libre en disco
- Conexión a Internet (para la primera instalación)

## Instalación

### Windows

1. **Descargar el instalador**
   - Descarga el archivo `.exe` desde la página de releases
   - El archivo tendrá un nombre como `Generador de Facturas Telwagen Setup X.X.X.exe`

2. **Ejecutar el instalador**
   - Haz doble clic en el archivo descargado
   - Si aparece una advertencia de Windows Defender, haz clic en "Más información" y luego en "Ejecutar de todas formas"
   - Sigue las instrucciones del asistente de instalación

3. **Seleccionar ubicación de instalación**
   - Por defecto se instalará en `C:\Program Files\Generador de Facturas Telwagen`
   - Puedes cambiar la ubicación si lo deseas

4. **Finalizar instalación**
   - El instalador creará accesos directos en el escritorio y en el menú de inicio
   - La aplicación se iniciará automáticamente al finalizar la instalación

### macOS

1. **Descargar el instalador**
   - Descarga el archivo `.dmg` desde la página de releases

2. **Abrir el archivo DMG**
   - Haz doble clic en el archivo `.dmg` descargado
   - Se abrirá una ventana con el icono de la aplicación

3. **Instalar la aplicación**
   - Arrastra el icono de "Generador de Facturas Telwagen" a la carpeta "Applications"
   - Si aparece una advertencia de seguridad, ve a "Preferencias del Sistema" > "Seguridad y Privacidad" y haz clic en "Abrir de todas formas"

4. **Ejecutar la aplicación**
   - Abre "Applications" y busca "Generador de Facturas Telwagen"
   - Haz doble clic para ejecutarla

### Linux

1. **Descargar el instalador**
   - Descarga el archivo `.AppImage` o `.deb` según tu distribución

2. **Instalación con AppImage**
   ```bash
   chmod +x "Generador de Facturas Telwagen-X.X.X.AppImage"
   ./"Generador de Facturas Telwagen-X.X.X.AppImage"
   ```

3. **Instalación con DEB (Ubuntu/Debian)**
   ```bash
   sudo dpkg -i "generador-de-facturas-telwagen_X.X.X_amd64.deb"
   sudo apt-get install -f  # Si hay dependencias faltantes
   ```

## Primera Ejecución

1. **Inicio automático del backend**
   - La aplicación iniciará automáticamente el servidor backend al abrirse
   - Esto puede tardar unos segundos la primera vez
   - Verás un indicador de estado en la parte superior de la aplicación

2. **Verificación de conexión**
   - La aplicación verificará automáticamente la conexión con el backend
   - Si todo está correcto, verás un indicador verde de "Conectado"

3. **Configuración inicial (si es necesario)**
   - Si es la primera vez que usas la aplicación, puede que necesites configurar algunos parámetros
   - Sigue las instrucciones en pantalla

## Solución de Problemas

### El backend no inicia

**Problema:** La aplicación muestra "Desconectado" y no puede conectarse al backend.

**Soluciones:**
1. **Verificar que Node.js esté instalado**
   - Abre una terminal/consola
   - Ejecuta: `node --version`
   - Si no está instalado, descárgalo desde [nodejs.org](https://nodejs.org/)

2. **Verificar que el puerto 3000 esté libre**
   - En Windows: Abre PowerShell y ejecuta:
     ```powershell
     netstat -ano | findstr :3000
     ```
   - Si hay un proceso usando el puerto, ciérralo o cambia el puerto en la configuración

3. **Reiniciar la aplicación**
   - Cierra completamente la aplicación
   - Vuelve a abrirla
   - Espera unos segundos a que el backend inicie

4. **Verificar permisos de firewall**
   - Asegúrate de que el firewall de Windows permita la aplicación
   - La aplicación debería solicitar permisos automáticamente

### La aplicación no se conecta a Internet

**Problema:** La aplicación no puede acceder a servicios en línea (ngrok).

**Soluciones:**
1. **Verificar conexión a Internet**
   - Asegúrate de que tu ordenador tenga conexión a Internet activa

2. **Verificar configuración de proxy**
   - Si usas un proxy corporativo, puede que necesites configurarlo
   - Contacta con tu administrador de red

3. **Usar conexión local**
   - La aplicación intentará automáticamente usar localhost si no puede conectarse a Internet
   - Esto funcionará si el backend está ejecutándose localmente

### Error al instalar

**Problema:** El instalador muestra un error o no se completa.

**Soluciones:**
1. **Ejecutar como administrador**
   - En Windows: Clic derecho en el instalador > "Ejecutar como administrador"
   - En Linux: Usar `sudo` si es necesario

2. **Verificar espacio en disco**
   - Asegúrate de tener al menos 500 MB libres

3. **Desinstalar versión anterior**
   - Si tienes una versión anterior instalada, desinstálala primero
   - En Windows: Panel de Control > Programas y características
   - En macOS: Arrastra la aplicación a la papelera
   - En Linux: `sudo apt remove generador-de-facturas-telwagen` (o similar)

## Desinstalación

### Windows
1. Ve a "Configuración" > "Aplicaciones"
2. Busca "Generador de Facturas Telwagen"
3. Haz clic en "Desinstalar"
4. Sigue las instrucciones del desinstalador

### macOS
1. Abre "Applications"
2. Arrastra "Generador de Facturas Telwagen" a la papelera
3. Vacía la papelera

### Linux
```bash
# Para AppImage, simplemente elimina el archivo
rm "Generador de Facturas Telwagen-X.X.X.AppImage"

# Para DEB
sudo apt remove generador-de-facturas-telwagen
```

## Actualización

La aplicación se actualiza automáticamente cuando hay nuevas versiones disponibles. También puedes:

1. **Descargar la nueva versión** desde la página de releases
2. **Instalar sobre la versión anterior** - El instalador actualizará automáticamente
3. **Los datos se conservan** - No perderás información al actualizar

## Soporte

Si tienes problemas con la instalación o el uso de la aplicación:

1. **Revisa esta guía** para soluciones comunes
2. **Consulta el README.md** para más información
3. **Contacta con soporte técnico** si el problema persiste

---

**Versión del documento:** 1.0.0  
**Última actualización:** 2024

