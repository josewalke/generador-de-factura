// Configuración de entorno de desarrollo
export const config = {
  development: {
    electron: {
      devTools: true,
      openDevTools: true
    },
    react: {
      port: 5173,
      host: 'localhost'
    }
  },
  production: {
    electron: {
      devTools: false,
      openDevTools: false
    }
  }
};

// Variables de entorno
export const isDev = process.env.NODE_ENV === 'development';
export const isElectron = typeof window !== 'undefined' && window.isElectron;
