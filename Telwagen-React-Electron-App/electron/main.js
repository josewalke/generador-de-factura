const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// Obtener versión del package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const appVersion = packageJson.version || '1.0.0';

let mainWindow;
let backendProcess = null;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true, // Mantener webSecurity habilitado
      allowRunningInsecureContent: false, // Mantener seguridad
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // No mostrar hasta que esté listo
    titleBarStyle: 'default',
    title: `Generador de Facturas Telwagen v${appVersion}`,
  });

  // Configurar Content Security Policy - Solo permitir ngrok (https) y recursos locales
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https:; " +
          "font-src 'self' https: data:; " +
          "img-src 'self' data: blob: https:; " +
          "connect-src 'self' https://*.ngrok-free.dev https://*.ngrok.io https:; " +
          "frame-src 'none'; " +
          "object-src 'none'; " +
          "base-uri 'self';"
        ]
      }
    });
  });

  // Permitir certificados autofirmados para desarrollo (si se usa HTTPS)
  // IMPORTANTE: Solo para desarrollo con certificados autofirmados
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // Permitir certificados autofirmados solo para la IP del backend (si se usa HTTPS)
    if (url.includes('192.168.100.101') || url.includes('localhost') || url.includes('127.0.0.1')) {
      event.preventDefault();
      callback(true); // Aceptar el certificado
    } else {
      callback(false); // Rechazar otros certificados inválidos
    }
  });

  // Cargar la aplicación React
  if (isDev) {
    // En desarrollo, cargar desde Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Abrir DevTools en desarrollo
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, usar protocolo file:// con ruta absoluta
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadURL(`file://${indexPath}`);
  }

  // Mostrar la ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Manejar el cierre de la ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menú de la aplicación
  createMenu();

  // Habilitar menú contextual (click derecho) con opciones básicas de edición
  mainWindow.webContents.on('context-menu', (_event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      { role: 'undo', enabled: params.editFlags.canUndo },
      { role: 'redo', enabled: params.editFlags.canRedo },
      { type: 'separator' },
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { role: 'pasteAndMatchStyle', enabled: params.editFlags.canPaste },
      { role: 'delete', enabled: params.editFlags.canDelete },
      { type: 'separator' },
      { role: 'selectAll' }
    ]);
    contextMenu.popup({ window: mainWindow });
  });
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Factura',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-new-invoice');
            }
          }
        },
        {
          label: 'Abrir',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-open');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-about');
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Función para obtener la ruta del backend
function getBackendPath() {
  if (isDev) {
    // En desarrollo, el backend está en la carpeta padre
    return path.join(__dirname, '../../backend');
  } else {
    // En producción, el backend está en resources/backend
    return path.join(process.resourcesPath, 'backend');
  }
}

// Función para verificar si el backend está ejecutándose (local o remoto)
async function checkBackendRunning(url = 'http://localhost:3000') {
  return new Promise((resolve) => {
    const http = require('http');
    const https = require('https');
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { 
      timeout: 3000,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Función para verificar si hay algún backend disponible (ngrok primero)
async function checkAnyBackendAvailable() {
  // PRIORIDAD: Verificar ngrok primero (backend remoto)
  const ngrokURL = 'https://unencountered-fabiola-constrictedly.ngrok-free.dev';
  const ngrokAvailable = await checkBackendRunning(ngrokURL);
  
  if (ngrokAvailable) {
    console.log('✅ Backend ngrok disponible');
    return true;
  }
  
  // Si ngrok no está disponible, verificar localhost como fallback
  const localhostAvailable = await checkBackendRunning('http://localhost:3000');
  if (localhostAvailable) {
    console.log('✅ Backend local disponible');
    return true;
  }
  
  return false;
}

// Función para iniciar el backend
async function startBackend() {
  // PRIMERO: Verificar si hay algún backend disponible (local o remoto)
  const backendAvailable = await checkAnyBackendAvailable();
  if (backendAvailable) {
    console.log('✅ Backend disponible detectado (local o remoto)');
    return true; // No necesitamos iniciar el backend local
  }
  
  // Si no hay backend disponible, intentar iniciar el local
  const backendPath = getBackendPath();
  const serverPath = path.join(backendPath, 'server.js');
  
  // Verificar si el backend local ya está ejecutándose
  const isLocalRunning = await checkBackendRunning('http://localhost:3000');
  if (isLocalRunning) {
    console.log('✅ Backend local ya está ejecutándose');
    return true;
  }

  // Verificar que el archivo del servidor existe (solo si estamos en producción)
  if (!isDev && !fs.existsSync(serverPath)) {
    console.log('ℹ️ Backend local no disponible, pero el frontend intentará conectarse a un backend remoto');
    return true; // No es un error, simplemente no hay backend local
  }
  
  // En desarrollo, si no existe el backend, no es crítico
  if (isDev && !fs.existsSync(serverPath)) {
    console.log('ℹ️ Backend local no encontrado, el frontend usará detección automática');
    return true; // No es un error
  }

  console.log('🚀 Iniciando backend desde:', backendPath);

  try {
    // Iniciar el backend como proceso hijo
    backendProcess = spawn('node', [serverPath], {
      cwd: backendPath,
      env: {
        ...process.env,
        NODE_ENV: isDev ? 'development' : 'production',
        PORT: '3000',
        HOST: '0.0.0.0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Capturar salida del backend
    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('❌ Error al iniciar el backend:', error);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend terminado con código ${code}`);
      backendProcess = null;
    });

    // Esperar a que el backend esté listo (máximo 30 segundos)
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const isRunning = await checkBackendRunning();
      if (isRunning) {
        console.log('✅ Backend iniciado correctamente');
        return true;
      }
    }

    console.error('❌ Timeout esperando que el backend inicie');
    return false;
  } catch (error) {
    console.error('❌ Error al iniciar el backend:', error);
    return false;
  }
}

// Función para detener el backend
function stopBackend() {
  if (backendProcess) {
    console.log('🛑 Deteniendo backend...');
    if (process.platform === 'win32') {
      // En Windows, usar taskkill
      spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
    } else {
      // En Linux/Mac, usar kill
      backendProcess.kill('SIGTERM');
    }
    backendProcess = null;
  }
}

// Este método se llamará cuando Electron haya terminado de inicializar
app.whenReady().then(async () => {
  // Crear la ventana inmediatamente (no esperar al backend)
  createWindow();
  
  // Verificar e intentar iniciar el backend en segundo plano (solo si es necesario)
  // No mostrar errores si el backend está en otro ordenador
  startBackend().catch(error => {
    console.log('ℹ️ No se pudo iniciar backend local, pero el frontend intentará conectarse automáticamente');
  });
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // Detener el backend antes de salir
  stopBackend();
  // En macOS es común que las aplicaciones permanezcan activas hasta que se cierren explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Detener el backend cuando la aplicación se cierre
app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  // En macOS es común recrear una ventana cuando se hace clic en el icono del dock
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejar comunicación con el proceso de renderizado
ipcMain.handle('get-app-version', () => {
  try {
    return app.getVersion();
  } catch (error) {
    console.error('Error getting app version:', error);
    return '1.0.0';
  }
});

ipcMain.handle('show-message-box', async (event, options) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const result = await dialog.showMessageBox(mainWindow, options);
      return result;
    }
    return { response: 0 };
  } catch (error) {
    console.error('Error showing message box:', error);
    return { response: 0 };
  }
});

// Obtener IPs locales del sistema
ipcMain.handle('get-local-ips', async () => {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
    
    return ips;
  } catch (error) {
    console.error('Error getting local IPs:', error);
    return [];
  }
});

// Manejo de errores globales
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configurar variables de entorno
if (isDev) {
  process.env.NODE_ENV = 'development';
} else {
  process.env.NODE_ENV = 'production';
}