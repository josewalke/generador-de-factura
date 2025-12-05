import { apiClient, handleApiResponse, handlePaginatedResponse } from './apiClient';

export interface Factura {
  id: string;
  numero_factura: string;
  cliente_id: string;
  empresa_id: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  observaciones?: string;
  fecha_creacion: string;
  activo: number;
  // Datos relacionados
  cliente_nombre?: string;
  empresa_nombre?: string;
  // Campos VeriFactu
  codigo_verifactu?: string;
  codigoVeriFactu?: string;
  hash_documento?: string;
  hashDocumento?: string;
  numero_serie?: string;
  sellado_temporal?: string;
  // Campos adicionales para compatibilidad
  numero?: string;
  fecha?: string;
  cliente?: string;
  empresa?: string;
  impuesto?: number;
  productos?: ProductoFactura[];
  detalles?: any[]; // Detalles de productos desde el backend
}

export interface ProductoFactura {
  id?: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  precioUnitario?: number;
  subtotal?: number;
  impuesto?: number;
  total?: number;
  tipoImpuesto?: string;
  tipo_impuesto?: string;
  categoria?: string;
  stock?: number;
  coche_id?: string | number | null;
  cocheId?: string | number | null;
  // Datos del coche desde la tabla coches
  marca?: string;
  modelo?: string;
  matricula?: string;
  color?: string;
  kilometros?: string;
  chasis?: string;
}

export interface FacturaCreateData {
  numero_factura?: string;
  cliente_id: string;
  empresa_id: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  subtotal: number;
  igic: number; // El backend espera 'igic' no 'impuestos'
  total: number;
  estado?: string;
  observaciones?: string;
  productos?: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    igic: number;
    total: number;
  }>;
}

export interface FacturaUpdateData extends Partial<FacturaCreateData> {
  id: string;
}

export interface FacturaPaginatedResponse {
  data: Factura[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  cached: boolean;
  resumen?: {
    totalFacturas: number;
    ingresos: number;
    ingresosTotales: number;
    promedio: number;
  };
}

export interface FacturaFilters {
  search?: string;
  empresa_id?: string;
  cliente_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface SiguienteNumeroResponse {
  numero_factura: string;
  empresa_id: string;
  prefijo: string;
  empresa_nombre: string;
  siguiente_numero: number;
}

class FacturaService {
  // Obtener todas las facturas con paginación y filtros
  async getAll(
    page: number = 1, 
    limit: number = 20, 
    filters: FacturaFilters = {}
  ): Promise<FacturaPaginatedResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.empresa_id && { empresa_id: filters.empresa_id }),
        ...(filters.cliente_id && { cliente_id: filters.cliente_id }),
        ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
        ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta })
      });
      
      const response = await apiClient.get(`/api/facturas?${params}`);
      const result = handlePaginatedResponse(response);
      
      // Mapear 'igic' del backend a 'impuestos' para compatibilidad
      result.data = result.data.map((factura: any) => ({
        ...factura,
        impuestos: factura.igic || factura.impuestos || 0
      }));
      
      return result;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  }

  // Obtener factura por ID
  async getById(id: string): Promise<Factura> {
    try {
      const response = await apiClient.get(`/api/facturas/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al obtener factura ${id}:`, error);
      throw error;
    }
  }

  // Obtener todas las facturas con productos detallados
  async getAllWithProducts(
    page: number = 1, 
    limit: number = 20, 
    filters: FacturaFilters = {}
  ): Promise<FacturaPaginatedResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        include_detalles: 'true',
        include_resumen: 'true',
        ...(filters.search && { search: filters.search }),
        ...(filters.empresa_id && { empresa_id: filters.empresa_id }),
        ...(filters.cliente_id && { cliente_id: filters.cliente_id }),
        ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
        ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta })
      });
      
      const response = await apiClient.get(`/api/facturas?${params}`);
      const result = handlePaginatedResponse(response);
      
      const facturasConProductos = (result.data || []).map((factura: any) => {
        const productos = (factura.detalles || []).map((detalle: any) => ({
          id: detalle.id?.toString(),
          descripcion: detalle.descripcion || 'Producto sin descripción',
          cantidad: detalle.cantidad || 1,
          precio: detalle.precio_unitario || 0,
          precioUnitario: detalle.precio_unitario || 0,
          subtotal: detalle.subtotal || 0,
          impuesto: detalle.igic || 0,
          total: detalle.total || 0,
          tipoImpuesto: detalle.tipo_impuesto || 'igic',
          tipo_impuesto: detalle.tipo_impuesto || 'igic',
          categoria: 'vehiculo',
          stock: 0,
          coche_id: detalle.coche_id || null,
          cocheId: detalle.coche_id || null,
          marca: detalle.coche_modelo ? detalle.coche_modelo.split(' ')[0] : '',
          modelo: detalle.coche_modelo || '',
          matricula: detalle.coche_matricula || '',
          color: detalle.coche_color || '',
          kilometros: detalle.coche_kms ? detalle.coche_kms.toString() : '',
          chasis: detalle.coche_chasis || ''
        }));
        
        return {
          ...factura,
          numero: factura.numero_factura,
          fecha: factura.fecha_emision,
          cliente: factura.cliente_nombre || 'Cliente no especificado',
          empresa: factura.empresa_nombre || 'Empresa no especificada',
          impuesto: (factura as any).igic || factura.impuestos || 0,
          productos
        };
      });
      
      return {
        ...result,
        data: facturasConProductos
      };
    } catch (error) {
      console.error('Error al obtener facturas con productos:', error);
      throw error;
    }
  }

  // Crear nueva factura
  async create(facturaData: FacturaCreateData): Promise<Factura> {
    try {
      const response = await apiClient.post('/api/facturas', facturaData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al crear factura:', error);
      throw error;
    }
  }

  // Actualizar factura
  async update(id: string, facturaData: Partial<FacturaCreateData>): Promise<Factura> {
    try {
      const response = await apiClient.put(`/api/facturas/${id}`, facturaData);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error al actualizar factura ${id}:`, error);
      throw error;
    }
  }

  // Eliminar factura (soft delete)
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/facturas/${id}`);
    } catch (error) {
      console.error(`Error al eliminar factura ${id}:`, error);
      throw error;
    }
  }

  // Obtener siguiente número de factura
  async getSiguienteNumero(empresaId: string): Promise<SiguienteNumeroResponse> {
    try {
      const response = await apiClient.get(`/api/facturas/siguiente-numero/${empresaId}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener siguiente número de factura:', error);
      throw error;
    }
  }

  // Buscar facturas por término
  async search(searchTerm: string, page: number = 1, limit: number = 20): Promise<FacturaPaginatedResponse> {
    try {
      return await this.getAll(page, limit, { search: searchTerm });
    } catch (error) {
      console.error('Error al buscar facturas:', error);
      throw error;
    }
  }

  // Obtener estadísticas de facturas (calculadas localmente)
  async getStats(): Promise<{
    total: number;
    totalIngresos: number;
    facturasMes: number;
    ingresosMes: number;
  }> {
    try {
      // Obtener todas las facturas para calcular estadísticas
      const response = await this.getAll(1, 1000); // Obtener hasta 1000 facturas
      const facturas = response.data;
      
      const total = facturas.length;
      const totalIngresos = facturas.reduce((sum, f) => sum + f.total, 0);
      const facturasMes = facturas.filter(f => {
        const fechaFactura = new Date(f.fecha_emision);
        const fechaActual = new Date();
        return fechaFactura.getMonth() === fechaActual.getMonth() && 
               fechaFactura.getFullYear() === fechaActual.getFullYear();
      }).length;
      const ingresosMes = facturas.filter(f => {
        const fechaFactura = new Date(f.fecha_emision);
        const fechaActual = new Date();
        return fechaFactura.getMonth() === fechaActual.getMonth() && 
               fechaFactura.getFullYear() === fechaActual.getFullYear();
      }).reduce((sum, f) => sum + f.total, 0);
      
      return {
        total,
        totalIngresos,
        facturasMes,
        ingresosMes
      };
    } catch (error) {
      console.error('Error al calcular estadísticas de facturas:', error);
      throw error;
    }
  }

  async getResumen(filters: FacturaFilters = {}): Promise<{ totalFacturas: number; ingresos: number; ingresosTotales: number; promedio: number }> {
    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.empresa_id && { empresa_id: filters.empresa_id }),
        ...(filters.cliente_id && { cliente_id: filters.cliente_id }),
        ...(filters.fecha_desde && { fecha_desde: filters.fecha_desde }),
        ...(filters.fecha_hasta && { fecha_hasta: filters.fecha_hasta })
      });
      
      const response = await apiClient.get(`/api/facturas/resumen?${params}`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener resumen de facturas:', error);
      throw error;
    }
  }

  async getYears(): Promise<string[]> {
    try {
      const response = await apiClient.get('/api/facturas/anios');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error al obtener años de facturas:', error);
      throw error;
    }
  }

  async dividirEnIndividuales(id: string): Promise<{ success: boolean; message: string; data: { factura_original_id: string; facturas_creadas: Array<{ id: string; numero_factura: string; coche_matricula?: string }> } }> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/dividir`);
    return handleApiResponse(response);
  }
}

export const facturaService = new FacturaService();
export default facturaService;
