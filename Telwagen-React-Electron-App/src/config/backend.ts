// URL base del backend
// Configurado para acceso desde cualquier lugar del mundo (Internet) usando ngrok
const getBackendURL = (): string => {
  // Prioridad 1: Variable de entorno (si está definida)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Prioridad 2: URL para acceso desde Internet (ngrok)
  // ngrok proporciona acceso desde cualquier lugar del mundo sin configurar routers
  // Esta es la URL principal para acceso desde cualquier ordenador en el mundo
  return 'https://unencountered-fabiola-constrictedly.ngrok-free.dev';
};

export const BACKEND_URL = getBackendURL();

// Log de la URL del backend (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔗 Backend URL configurada:', BACKEND_URL);
  console.log('📡 Usando ngrok para acceso desde Internet');
}

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
    // Usar apiClient para usar la misma configuración que las demás peticiones
    const { apiClient } = await import('../services/apiClient');
    const response = await apiClient.get('/', {
      timeout: 10000,
      validateStatus: (status) => status < 500, // Aceptar cualquier status < 500
    });
    return response.status < 400;
  } catch (error: any) {
    // Si es un error de red intermitente, no es crítico si las demás peticiones funcionan
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      // No loguear errores de red intermitentes, solo retornar false
      return false;
    }
    // Si es un error de certificado, aún intentamos continuar
    if (error.code === 'ERR_CERT_AUTHORITY_INVALID' || error.message?.includes('certificate')) {
      console.warn('⚠️ Certificado autofirmado detectado. Acepta el certificado en el navegador.');
      return false;
    }
    // Solo loguear errores no esperados
    if (error.response?.status >= 500) {
      console.error('Error checking backend connection:', error);
    }
    return false;
  }
};

// Función para obtener información del backend
export const getBackendInfo = async () => {
  try {
    // Usar apiClient para usar la misma configuración que las demás peticiones
    const { apiClient } = await import('../services/apiClient');
    const response = await apiClient.get('/', {
      timeout: 10000,
      validateStatus: () => true, // Aceptar cualquier status para obtener info
    });
    return response.data;
  } catch (error: any) {
    console.error('Error getting backend info:', error);
    throw error;
  }
};
