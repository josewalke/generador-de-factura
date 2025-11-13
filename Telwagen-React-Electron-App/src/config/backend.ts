// URL base del backend
// Configurado para acceso desde cualquier lugar del mundo (Internet)
const getBackendURL = (): string => {
  // Prioridad 1: Variable de entorno (si está definida)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Prioridad 2: Detectar si estamos en la red local
  // Si estamos en la misma red local (192.168.100.x), usar IP local (más rápido)
  // Si no, usar IP pública (acceso desde Internet)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Si estamos en localhost o en la red local, usar IP local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.100.')) {
      return 'https://192.168.100.100:8443';
    }
  }
  
  // Prioridad 3: URL para acceso desde Internet (ngrok)
  // ngrok proporciona acceso desde cualquier lugar del mundo sin configurar routers
  // Esta es la URL principal para acceso desde cualquier ordenador en el mundo
  // Si no hay variable de entorno, usar la URL de ngrok por defecto
  return 'https://unencountered-fabiola-constrictedly.ngrok-free.dev';
};

export const BACKEND_URL = getBackendURL();

// Configuración para conectar con el backend
export const BACKEND_CONFIG = {
  // URL base del backend
  baseURL: BACKEND_URL,
  
  // Configuración de timeout (aumentado para conexiones de red)
  timeout: 30000,
  
  // Headers por defecto
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Saltar advertencia de ngrok en todas las peticiones
  },
  
  // Configuración de reintentos
  retries: 3,
  
  // Configuración de caché
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutos
  }
};

// Función para verificar la conexión con el backend
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    // Usar axios para manejar mejor los certificados autofirmados y ngrok
    const axios = (await import('axios')).default;
    const response = await axios.get(`${BACKEND_URL}/`, {
      timeout: 10000,
      validateStatus: (status) => status < 500, // Aceptar cualquier status < 500
      headers: {
        'ngrok-skip-browser-warning': 'true' // Saltar advertencia de ngrok
      }
    });
    return response.status < 400;
  } catch (error: any) {
    // Si es un error de certificado, aún intentamos continuar
    if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.message?.includes('certificate')) {
      console.warn('⚠️ Certificado autofirmado detectado. Acepta el certificado en el navegador.');
      // Intentar de nuevo con una petición más permisiva
      try {
        const axios = (await import('axios')).default;
        const response = await axios.get(`${BACKEND_URL}/`, {
          timeout: 10000,
          validateStatus: () => true, // Aceptar cualquier status
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        return response.status < 400;
      } catch {
        return false;
      }
    }
    console.error('Error checking backend connection:', error);
    return false;
  }
};

// Función para obtener información del backend
export const getBackendInfo = async () => {
  try {
    // Usar axios para manejar mejor los certificados autofirmados y ngrok
    const axios = (await import('axios')).default;
    const response = await axios.get(`${BACKEND_URL}/`, {
      timeout: 10000,
      validateStatus: () => true, // Aceptar cualquier status para obtener info
      headers: {
        'ngrok-skip-browser-warning': 'true' // Saltar advertencia de ngrok
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error getting backend info:', error);
    throw error;
  }
};
