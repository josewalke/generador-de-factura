import { apiClient, handleApiResponse } from './apiClient';

export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  direccion: string;
  telefono?: string;
  email?: string;
  codigo_postal?: string;
  fecha_creacion: string;
  tipo_identificacion?: string;
  codigo_pais?: string;
  provincia?: string;
  pais?: string;
  regimen_fiscal?: string;
}

export interface ClienteCreateData {
  nombre: string;
  identificacion: string;
  direccion: string;
  telefono?: string;
  email?: string;
  codigo_postal?: string;
  tipo_identificacion?: string;
  codigo_pais?: string;
  provincia?: string;
  pais?: string;
  regimen_fiscal?: string;
}

export interface ClienteUpdateData extends Partial<ClienteCreateData> {
  id: string;
}

class ClienteService {
  // Obtener todos los clientes
  async getAll(): Promise<Cliente[]> {
    try {
      const response = await apiClient.get('/api/clientes');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  async getById(id: string): Promise<Cliente> {
    try {
      const response = await apiClient.get(`/api/clientes/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al obtener cliente ${id}:`, error);
      throw error;
    }
  }

  // Crear nuevo cliente
  async create(clienteData: ClienteCreateData): Promise<Cliente> {
    try {
      console.log('ClienteService.create - Enviando datos:', clienteData);
      const response = await apiClient.post('/api/clientes', clienteData);
      console.log('ClienteService.create - Respuesta recibida:', response.data);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  async update(id: string, clienteData: Partial<ClienteCreateData>): Promise<Cliente> {
    try {
      console.log('ClienteService.update - Enviando datos:', { id, clienteData });
      const response = await apiClient.put(`/api/clientes/${id}`, clienteData);
      console.log('ClienteService.update - Respuesta recibida:', response.data);
      
      // El backend ahora devuelve el cliente actualizado en response.data.data
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al actualizar cliente ${id}:`, error);
      throw error;
    }
  }

  // Eliminar cliente (soft delete)
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/clientes/${id}`);
    } catch (error) {
      console.error(`Error al eliminar cliente ${id}:`, error);
      throw error;
    }
  }

  // Buscar clientes por término
  async search(searchTerm: string): Promise<Cliente[]> {
    try {
      const response = await apiClient.get(`/api/clientes?search=${encodeURIComponent(searchTerm)}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      throw error;
    }
  }
}

export const clienteService = new ClienteService();
export default clienteService;
