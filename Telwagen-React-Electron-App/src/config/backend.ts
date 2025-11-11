// URL base del backend
export const BACKEND_URL = 'http://192.168.100.101:3000';

// Configuración para conectar con el backend
export const BACKEND_CONFIG = {
  // URL base del backend
  baseURL: BACKEND_URL,
  
  // Configuración de timeout
  timeout: 10000,
  
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
