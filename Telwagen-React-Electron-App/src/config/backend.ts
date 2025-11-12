// URL base del backend
// Configurado para acceso desde Internet (cualquier lugar del mundo)
const getBackendURL = (): string => {
  // Prioridad 1: Variable de entorno (si está definida)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Prioridad 2: URL de producción (HTTPS)
  // URL principal para acceso desde Internet
  return 'https://92.186.17.227:8443';
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
    const response = await fetch(`${BACKEND_URL}/`);
    return response.ok;
  } catch (error) {
    console.error('Error checking backend connection:', error);
    return false;
  }
};

// Función para obtener información del backend
export const getBackendInfo = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting backend info:', error);
    throw error;
  }
};
