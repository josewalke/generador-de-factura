import { apiClient, handleApiResponse, handlePaginatedResponse } from './apiClient';

export interface Abono {
  id: string;
  numero_abono: string;
  factura_id: string;
  empresa_id: string;
  cliente_id: string;
  fecha_emision: string;
  subtotal: number;
  igic: number;
  total: number;
  estado: string;
  notas?: string;
  fecha_creacion: string;
  activo: number;
  // Datos relacionados
  cliente_nombre?: string;
  empresa_nombre?: string;
  factura_numero?: string;
  // Detalles
  detalles?: DetalleAbono[];
}

export interface DetalleAbono {
  id?: string;
  abono_id: string;
  producto_id?: string;
  coche_id?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  igic: number;
  total: number;
  descripcion?: string;
  tipo_impuesto?: string;
  producto_descripcion?: string;
  coche_matricula?: string;
  coche_modelo?: string;
  coche_color?: string;
  coche_kms?: number;
  coche_chasis?: string;
}

export interface AbonoPaginatedResponse {
  data: Abono[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AbonoFilters {
  search?: string;
  empresa_id?: string;
  cliente_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

class AbonoService {
  // Obtener todos los abonos con paginación y filtros
  async getAll(
    page: number = 1, 
    limit: number = 20, 
    filters: AbonoFilters = {}
  ): Promise<AbonoPaginatedResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        include_detalles: 'true',
        ...(filters.search && { search: filters.search }),
        ...(filters.empresa_id && { empresa_id: filters.empresa_id }),
        ...(filters.cliente_id && { cliente_id: filters.cliente_id }),
        ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
        ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta })
      });
      
      const response = await apiClient.get(`/api/abonos?${params}`);
      return handlePaginatedResponse(response);
    } catch (error) {
      console.error('Error al obtener abonos:', error);
      throw error;
    }
  }

  // Obtener abono por ID
  async getById(id: string): Promise<Abono> {
    try {
      const response = await apiClient.get(`/api/abonos/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al obtener abono ${id}:`, error);
      throw error;
    }
  }

  // Buscar abonos por término
  async search(searchTerm: string, page: number = 1, limit: number = 20): Promise<AbonoPaginatedResponse> {
    try {
      return await this.getAll(page, limit, { search: searchTerm });
    } catch (error) {
      console.error('Error al buscar abonos:', error);
      throw error;
    }
  }
}

export const abonoService = new AbonoService();
export default abonoService;

