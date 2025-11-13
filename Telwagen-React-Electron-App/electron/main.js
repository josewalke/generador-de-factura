const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

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
  });

  // Configurar Content Security Policy para permitir fuentes y recursos externos
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
          "connect-src 'self' http://localhost:* http://127.0.0.1:* http://192.168.100.101:* http://192.168.*:* http://10.*:* http://172.16.*:* https:; " +
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

// Este método se llamará cuando Electron haya terminado de inicializar
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // En macOS es común que las aplicaciones permanezcan activas hasta que se cierren explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
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