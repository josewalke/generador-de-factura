const { contextBridge, ipcRenderer } = require('electron');

// Función para manejar listeners de forma segura
function createSafeListener(channel, callback) {
  return (event, ...args) => {
    try {
      callback(...args);
    } catch (error) {
      console.error(`Error in ${channel} listener:`, error);
    }
  };
}

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Información de la aplicación
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Obtener IPs locales
  getLocalIPs: () => ipcRenderer.invoke('get-local-ips'),
  
  // Diálogos del sistema
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Eventos del menú - usando listeners seguros
  onMenuNewInvoice: (callback) => {
    ipcRenderer.removeAllListeners('menu-new-invoice');
    ipcRenderer.on('menu-new-invoice', createSafeListener('menu-new-invoice', callback));
  },
  onMenuOpen: (callback) => {
    ipcRenderer.removeAllListeners('menu-open');
    ipcRenderer.on('menu-open', createSafeListener('menu-open', callback));
  },
  onMenuAbout: (callback) => {
    ipcRenderer.removeAllListeners('menu-about');
    ipcRenderer.on('menu-about', createSafeListener('menu-about', callback));
  },
  
  // Limpiar listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Información del sistema
  platform: process.platform,
  isElectron: true
});

// Información adicional disponible globalmente
window.isElectron = true;
window.platform = process.platform;