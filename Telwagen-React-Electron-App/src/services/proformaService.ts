import { apiClient, handleApiResponse, handlePaginatedResponse } from './apiClient';

export interface Proforma {
  id: string;
  numero_proforma: string;
  cliente_id?: string;
  empresa_id: string;
  coche_id?: string;
  fecha_emision: string;
  fecha_validez?: string;
  subtotal: number;
  igic: number;
  total: number;
  estado: string;
  notas?: string;
  fecha_creacion: string;
  activo: number;
  // Datos relacionados
  cliente_nombre?: string;
  cliente_identificacion?: string;
  empresa_nombre?: string;
  empresa_cif?: string;
  coche_matricula?: string;
  coche_modelo?: string;
  coche_marca?: string;
  detalles?: ProductoProforma[];
}

export interface ProductoProforma {
  id?: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  precioUnitario?: number;
  precio_unitario?: number;
  subtotal?: number;
  igic?: number;
  impuesto?: number;
  total?: number;
  tipoImpuesto?: string;
  tipo_impuesto?: string;
  producto_id?: string | number | null;
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

export interface ProformaCreateData {
  numero_proforma?: string;
  cliente_id?: string;
  empresa_id: string;
  coche_id?: string;
  fecha_emision: string;
  fecha_validez?: string;
  subtotal: number;
  igic: number;
  total: number;
  estado?: string;
  notas?: string;
  productos?: ProductoProforma[];
}

export interface ProformaUpdateData extends Partial<ProformaCreateData> {
  id: string;
}

export interface ProformaPaginatedResponse {
  data: Proforma[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  cached?: boolean;
}

export interface ProformaFilters {
  search?: string;
  empresa_id?: string;
  cliente_id?: string;
  coche_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface SiguienteNumeroResponse {
  success: boolean;
  data: {
    numero_proforma: string;
    empresa_id: number;
    prefijo: string;
    empresa_nombre: string;
    siguiente_numero: number;
  };
}

class ProformaService {
  private baseUrl = '/api/proformas';

  async getAll(filters?: ProformaFilters): Promise<ProformaPaginatedResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.empresa_id) params.append('empresa_id', filters.empresa_id);
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      if (filters.coche_id) params.append('coche_id', filters.coche_id);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await apiClient.get(url);
    return handlePaginatedResponse<Proforma>(response);
  }

  async getById(id: string): Promise<Proforma> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return handleApiResponse<Proforma>(response);
  }

  async create(data: ProformaCreateData): Promise<Proforma> {
    // Normalizar productos para el backend
    const productosNormalizados = data.productos?.map(producto => ({
      id: producto.producto_id || null,
      coche_id: producto.coche_id || producto.cocheId || data.coche_id || null,
      cantidad: producto.cantidad || 1,
      precio_unitario: producto.precio_unitario || producto.precioUnitario || producto.precio || 0,
      subtotal: producto.subtotal || (producto.precio * producto.cantidad),
      igic: producto.igic !== undefined ? producto.igic : (producto.impuesto || 0),
      total: producto.total || (producto.precio * producto.cantidad + (producto.igic || producto.impuesto || 0)),
      descripcion: producto.descripcion,
      tipo_impuesto: producto.tipo_impuesto || producto.tipoImpuesto || 'igic'
    }));

    const payload = {
      ...data,
      productos: productosNormalizados
    };

    const response = await apiClient.post(this.baseUrl, payload);
    return handleApiResponse<Proforma>(response);
  }

  async update(id: string, data: Partial<ProformaCreateData>): Promise<Proforma> {
    // Normalizar productos para el backend
    const productosNormalizados = data.productos?.map(producto => ({
      id: producto.producto_id || null,
      coche_id: producto.coche_id || producto.cocheId || data.coche_id || null,
      cantidad: producto.cantidad || 1,
      precio_unitario: producto.precio_unitario || producto.precioUnitario || producto.precio || 0,
      subtotal: producto.subtotal || (producto.precio * producto.cantidad),
      igic: producto.igic !== undefined ? producto.igic : (producto.impuesto || 0),
      total: producto.total || (producto.precio * producto.cantidad + (producto.igic || producto.impuesto || 0)),
      descripcion: producto.descripcion,
      tipo_impuesto: producto.tipo_impuesto || producto.tipoImpuesto || 'igic'
    }));

    const payload = {
      ...data,
      productos: productosNormalizados
    };

    const response = await apiClient.put(`${this.baseUrl}/${id}`, payload);
    return handleApiResponse<Proforma>(response);
  }

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    handleApiResponse(response);
  }

  async getSiguienteNumero(empresaId: string | number): Promise<SiguienteNumeroResponse> {
    const response = await apiClient.get(`${this.baseUrl}/siguiente-numero/${empresaId}`);
    return handleApiResponse<SiguienteNumeroResponse>(response);
  }
}

export const proformaService = new ProformaService();

