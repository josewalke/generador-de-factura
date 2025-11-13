// URL del backend - SOLO NGROK (sin fallbacks locales)
const NGROK_URL = 'https://unencountered-fabiola-constrictedly.ngrok-free.dev';

// Cache para la URL que funciona
let workingBackendURL: string | null = null;
let lastConnectionCheck: number = 0;
const CONNECTION_CACHE_TTL = 60000; // 1 minuto

// Función para detectar automáticamente la mejor URL disponible
// SOLO USA NGROK - Sin pruebas de localhost ni otras IPs
export const detectBestBackendURL = async (): Promise<string> => {
  // Si tenemos una URL en caché que funcionó recientemente, usarla
  const now = Date.now();
  if (workingBackendURL && (now - lastConnectionCheck) < CONNECTION_CACHE_TTL) {
    return workingBackendURL;
  }

  // USAR NGROK DIRECTAMENTE - Sin probar otras URLs
  workingBackendURL = NGROK_URL;
  lastConnectionCheck = now;
  console.log('✅ Usando ngrok directamente:', NGROK_URL);
  return NGROK_URL;
};

// URL base del backend - SOLO NGROK
const getBackendURL = (): string => {
  // Prioridad 1: Variable de entorno (si está definida) - siempre usar esta si existe
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Prioridad 2: URL en caché si está disponible
  if (workingBackendURL) {
    return workingBackendURL;
  }
  
  // Prioridad 3: URL ngrok directamente (SIN FALLBACKS)
  return NGROK_URL;
};

// Inicializar detección automática al cargar el módulo
let backendURLPromise: Promise<string> | null = null;

const initializeBackendURL = async (): Promise<string> => {
  if (!backendURLPromise) {
    backendURLPromise = detectBestBackendURL();
  }
  return backendURLPromise;
};

// Exportar URL inicial (se actualizará después de la detección)
export let BACKEND_URL = getBackendURL();

// Inicializar en segundo plano (no bloquea la carga)
if (typeof window !== 'undefined') {
  initializeBackendURL().then(url => {
    BACKEND_URL = url;
    // Actualizar apiClient si ya existe
    if ((window as any).__updateBackendURL) {
      (window as any).__updateBackendURL(url);
    }
  }).catch(error => {
    console.error('Error inicializando URL del backend:', error);
  });
}

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

// Función para verificar la conexión con el backend (con reintentos y fallback)
export const checkBackendConnection = async (retryCount: number = 0): Promise<boolean> => {
  const MAX_RETRIES = 3;
  
  try {
    // Primero, asegurarse de que tenemos la mejor URL disponible
    const bestURL = await initializeBackendURL();
    if (bestURL !== BACKEND_URL) {
      BACKEND_URL = bestURL;
      // Notificar al apiClient para que actualice su URL
      if ((window as any).__updateBackendURL) {
        (window as any).__updateBackendURL(bestURL);
      }
    }

    // Usar apiClient para usar la misma configuración que las demás peticiones
    const { apiClient } = await import('../services/apiClient');
    const response = await apiClient.get('/', {
      timeout: 10000,
      validateStatus: (status) => status < 500, // Aceptar cualquier status < 500
    });
    
    if (response.status < 400) {
      // Conexión exitosa, actualizar caché
      workingBackendURL = BACKEND_URL;
      lastConnectionCheck = Date.now();
      return true;
    }
    
    return false;
  } catch (error: any) {
    // Si falla, intentar detectar una nueva URL si no hemos reintentado mucho
    if (retryCount < MAX_RETRIES) {
      // Limpiar caché y reintentar con detección automática
      workingBackendURL = null;
      lastConnectionCheck = 0;
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Backoff exponencial
      return checkBackendConnection(retryCount + 1);
    }
    
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
