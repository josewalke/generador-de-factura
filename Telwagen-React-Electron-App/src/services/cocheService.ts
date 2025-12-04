import { apiClient, handleApiResponse } from './apiClient';

export interface Coche {
  id: string;
  matricula: string;
  chasis: string;
  color: string;
  kms: number;
  modelo: string;
  marca?: string;
  precio?: number;
  vendido: number;
  numero_factura?: string;
  fecha_venta?: string;
  fecha_creacion: string;
  activo: number;
  numero_proforma?: string;
  tiene_proforma?: number;
}

export interface CocheCreateData {
  matricula: string;
  chasis: string;
  color: string;
  kms: number;
  modelo: string;
  marca?: string;
}

export interface CocheUpdateData extends Partial<CocheCreateData> {
  id: string;
}

class CocheService {
  // Obtener todos los coches
  async getAll(): Promise<Coche[]> {
    try {
      const response = await apiClient.get('/api/coches');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener coches:', error);
      throw error;
    }
  }

  // Obtener coches disponibles
  async getDisponibles(): Promise<Coche[]> {
    try {
      const response = await apiClient.get('/api/coches/disponibles');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener coches disponibles:', error);
      throw error;
    }
  }

  // Obtener coches vendidos
  async getVendidos(): Promise<Coche[]> {
    try {
      const response = await apiClient.get('/api/coches/vendidos');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener coches vendidos:', error);
      throw error;
    }
  }

  // Obtener coches como productos
  async getProductos(): Promise<Coche[]> {
    try {
      const response = await apiClient.get('/api/coches/productos');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener coches como productos:', error);
      throw error;
    }
  }

  // Obtener coche por ID
  async getById(id: string): Promise<Coche> {
    try {
      const response = await apiClient.get(`/api/coches/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al obtener coche ${id}:`, error);
      throw error;
    }
  }

  // Crear nuevo coche
  async create(cocheData: CocheCreateData): Promise<Coche> {
    try {
      const response = await apiClient.post('/api/coches', cocheData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al crear coche:', error);
      throw error;
    }
  }

  // Actualizar coche
  async update(id: string, cocheData: Partial<CocheCreateData>): Promise<Coche> {
    console.log('🌐 [cocheService] Iniciando actualización de coche...');
    console.log('🌐 [cocheService] ID del coche:', id);
    console.log('🌐 [cocheService] Datos a actualizar:', cocheData);
    
    try {
      console.log('🌐 [cocheService] Realizando petición PUT a:', `/api/coches/${id}`);
      const response = await apiClient.put(`/api/coches/${id}`, cocheData);
      console.log('🌐 [cocheService] Respuesta recibida:', response);
      
      const result = handleApiResponse(response);
      console.log('🌐 [cocheService] Datos procesados:', result);
      console.log('🌐 [cocheService] Actualización completada exitosamente');
      
      return result;
    } catch (error) {
      console.error('🌐 [cocheService] Error al actualizar coche:', error);
      console.error('🌐 [cocheService] Error details:', {
        message: error.message,
        stack: error.stack,
        cocheId: id,
        updateData: cocheData,
        response: error.response
      });
      throw error;
    }
  }

  // Eliminar coche (soft delete)
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/coches/${id}`);
    } catch (error) {
      console.error(`Error al eliminar coche ${id}:`, error);
      throw error;
    }
  }

  // Buscar coches por término
  async search(searchTerm: string): Promise<Coche[]> {
    try {
      const response = await apiClient.get(`/api/coches?search=${encodeURIComponent(searchTerm)}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al buscar coches:', error);
      throw error;
    }
  }
}

export const cocheService = new CocheService();
export default cocheService;
