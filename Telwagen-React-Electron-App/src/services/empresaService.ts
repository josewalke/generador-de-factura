import { apiClient, handleApiResponse, handlePaginatedResponse } from './apiClient';

export interface Empresa {
  id: string;
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  logo?: string;
  certificado_thumbprint?: string;
  fecha_creacion: string;
  activo: number;
}

export interface EmpresaCreateData {
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  logo?: string;
  certificado_thumbprint?: string;
  firmaDigitalThumbprint?: string; // Campo que envía el frontend
}

export interface EmpresaUpdateData extends Partial<EmpresaCreateData> {
  id: string;
}

export interface EmpresaPaginatedResponse {
  data: Empresa[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  cached: boolean;
}

class EmpresaService {
  // Obtener todas las empresas con paginación
  async getAll(page: number = 1, limit: number = 20, search: string = ''): Promise<EmpresaPaginatedResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await apiClient.get(`/api/empresas?${params}`);
      return handlePaginatedResponse(response);
    } catch (error) {
      console.error('Error al obtener empresas:', error);
      throw error;
    }
  }

  // Obtener empresa por ID
  async getById(id: string): Promise<Empresa> {
    try {
      const response = await apiClient.get(`/api/empresas/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al obtener empresa ${id}:`, error);
      throw error;
    }
  }

  // Crear nueva empresa
  async create(empresaData: EmpresaCreateData): Promise<Empresa> {
    try {
      console.log('🏢 [empresaService] Creando empresa:', empresaData);
      const response = await apiClient.post('/api/empresas', empresaData);
      console.log('🏢 [empresaService] Respuesta del backend:', response.data);
      
      // El backend ahora devuelve la empresa creada en response.data.data
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al crear empresa:', error);
      throw error;
    }
  }

  // Actualizar empresa
  async update(id: string, empresaData: Partial<EmpresaCreateData>): Promise<Empresa> {
    try {
      const response = await apiClient.put(`/api/empresas/${id}`, empresaData);
      console.log('🏢 [empresaService] Respuesta del backend:', response.data);
      
      // El backend ahora devuelve la empresa actualizada en response.data.data
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al actualizar empresa ${id}:`, error);
      throw error;
    }
  }

  // Eliminar empresa (soft delete)
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/empresas/${id}`);
    } catch (error) {
      console.error(`Error al eliminar empresa ${id}:`, error);
      throw error;
    }
  }

  // Buscar empresas por término
  async search(searchTerm: string, page: number = 1, limit: number = 20): Promise<EmpresaPaginatedResponse> {
    try {
      return await this.getAll(page, limit, searchTerm);
    } catch (error) {
      console.error('Error al buscar empresas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de empresas
  async getStats(): Promise<{
    total: number;
    conCertificado: number;
    sinCertificado: number;
  }> {
    try {
      const response = await apiClient.get('/api/empresas/stats');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener estadísticas de empresas:', error);
      throw error;
    }
  }

  // Asociar certificado digital con empresa
  async asociarCertificado(id: string, certificadoData: any): Promise<Empresa> {
    try {
      console.log('🏢 [empresaService] Asociando certificado con empresa:', id);
      const response = await apiClient.post(`/api/empresas/${id}/certificado`, certificadoData);
      console.log('🏢 [empresaService] Certificado asociado:', response.data);
      return handleApiResponse(response);
    } catch (error) {
      console.error('🏢 [empresaService] Error al asociar certificado:', error);
      throw error;
    }
  }
}

export const empresaService = new EmpresaService();
export default empresaService;
