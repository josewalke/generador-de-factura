import axios from 'axios';
import { BACKEND_URL } from '../config/backend';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // Aumentado a 30 segundos para conexiones de red
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Saltar advertencia de ngrok
  },
});

// Función para actualizar la URL del backend dinámicamente
export const updateBackendURL = (newURL: string) => {
  apiClient.defaults.baseURL = newURL;
  console.log('🔄 URL del backend actualizada a:', newURL);
};

// Exponer función globalmente para que backend.ts pueda usarla
if (typeof window !== 'undefined') {
  (window as any).__updateBackendURL = updateBackendURL;
}

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => {
    // Verificar si la respuesta es HTML (página de advertencia de ngrok)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html') || (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>'))) {
      console.error('❌ [apiClient] ngrok está mostrando página de advertencia en lugar del backend');
      console.error('   Asegúrate de que el header ngrok-skip-browser-warning esté siendo enviado');
      throw new Error('ngrok está bloqueando la petición. Verifica la configuración.');
    }
    
    console.log('🌐 [apiClient] API Response:', response.status, response.data);
    if (response.config.method === 'put') {
      console.log('🌐 [apiClient] PUT Request Details:', {
        url: response.config.url,
        data: response.config.data,
        status: response.status,
        responseData: response.data
      });
    }
    return response;
  },
  async (error) => {
    console.error('🌐 [apiClient] API Error:', error);
    
    // Si es un error de conexión, intentar detectar una nueva URL
    if (!error.response && error.request) {
      try {
        const { detectBestBackendURL } = await import('../config/backend');
        const newURL = await detectBestBackendURL();
        if (newURL !== apiClient.defaults.baseURL) {
          updateBackendURL(newURL);
          // Reintentar la petición con la nueva URL
          if (error.config) {
            error.config.baseURL = newURL;
            return apiClient.request(error.config);
          }
        }
      } catch (detectionError) {
        console.warn('No se pudo detectar una nueva URL:', detectionError);
      }
    }
    
    if (error.response) {
      // El servidor respondió con un código de error
      const { status, data } = error.response;
      console.error('🌐 [apiClient] Error Response:', status, data);
      console.error('🌐 [apiClient] Error Details:', {
        method: error.config?.method,
        url: error.config?.url,
        requestData: error.config?.data,
        status: status,
        responseData: data
      });
      
      switch (status) {
        case 400:
          throw new Error(data.error || data.message || data.details || 'Solicitud incorrecta');
        case 403:
          // Forbidden - coche vendido, no se puede modificar
          throw new Error(data.message || data.error || 'Operación no permitida');
        case 404:
          throw new Error('Recurso no encontrado');
        case 409:
          // Conflict - duplicado (CIF, identificación, etc.)
          throw new Error(data.message || data.error || 'Conflicto: el recurso ya existe');
        case 500:
          throw new Error(data.details || data.error || 'Error interno del servidor');
        default:
          throw new Error(data.message || data.error || data.details || 'Error desconocido');
      }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.error('No response received:', error.request);
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Algo más pasó
      console.error('Request setup error:', error.message);
      throw new Error(error.message);
    }
  }
);

// Función para manejar respuestas de la API
const handleApiResponse = (response: any) => {
  if (response.data.success) {
    return response.data.data || response.data;
  } else {
    throw new Error(response.data.error || 'Error en la respuesta de la API');
  }
};

// Función para manejar respuestas paginadas
const handlePaginatedResponse = (response: any) => {
  if (response.data.success) {
    return {
      data: response.data.data,
      pagination: response.data.pagination,
      cached: response.data.cached || false,
      resumen: response.data.resumen
    };
  } else {
    throw new Error(response.data.error || 'Error en la respuesta de la API');
  }
};

export { apiClient, handleApiResponse, handlePaginatedResponse };
export default apiClient;
