import axios from 'axios';
import { BACKEND_URL } from '../config/backend';

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => {
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
  (error) => {
    console.error('🌐 [apiClient] API Error:', error);
    
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
          throw new Error(data.error || data.details || 'Solicitud incorrecta');
        case 404:
          throw new Error('Recurso no encontrado');
        case 500:
          throw new Error(data.details || data.error || 'Error interno del servidor');
        default:
          throw new Error(data.error || data.details || 'Error desconocido');
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
      cached: response.data.cached || false
    };
  } else {
    throw new Error(response.data.error || 'Error en la respuesta de la API');
  }
};

export { apiClient, handleApiResponse, handlePaginatedResponse };
export default apiClient;
