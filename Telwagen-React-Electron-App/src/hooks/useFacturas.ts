import { useState, useEffect, useCallback } from 'react';
import { facturaService, Factura, FacturaCreateData, FacturaFilters, FacturaPaginatedResponse } from '../services/facturaService';

export interface UseFacturasReturn {
  facturas: Factura[];
  pagination: FacturaPaginatedResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  createFactura: (data: FacturaCreateData) => Promise<void>;
  updateFactura: (id: string, data: Partial<FacturaCreateData>) => Promise<void>;
  deleteFactura: (id: string) => Promise<void>;
  searchFacturas: (filters: FacturaFilters, page?: number) => Promise<void>;
  refreshFacturas: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  getSiguienteNumero: (empresaId: string) => Promise<string>;
  stats: {
    total: number;
    totalIngresos: number;
    facturasMes: number;
    ingresosMes: number;
  } | null;
}

export function useFacturas(): UseFacturasReturn {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagination, setPagination] = useState<FacturaPaginatedResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    totalIngresos: number;
    facturasMes: number;
    ingresosMes: number;
  } | null>(null);

  const fetchFacturas = useCallback(async (
    page: number = 1, 
    limit: number = 20, 
    filters: FacturaFilters = {}
  ) => {
    try {
      setLoading(true);
      setError(null);
      // Usar el método que incluye productos detallados
      const response = await facturaService.getAllWithProducts(page, limit, filters);
      setFacturas(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
      console.error('Error fetching facturas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Calcular estadísticas localmente desde las facturas cargadas
      const total = facturas.length;
      const totalIngresos = facturas.reduce((sum, f) => sum + f.total, 0);
      const facturasMes = facturas.filter(f => {
        const fechaFactura = new Date(f.fecha);
        const fechaActual = new Date();
        return fechaFactura.getMonth() === fechaActual.getMonth() && 
               fechaFactura.getFullYear() === fechaActual.getFullYear();
      }).length;
      const ingresosMes = facturas.filter(f => {
        const fechaFactura = new Date(f.fecha);
        const fechaActual = new Date();
        return fechaFactura.getMonth() === fechaActual.getMonth() && 
               fechaFactura.getFullYear() === fechaActual.getFullYear();
      }).reduce((sum, f) => sum + f.total, 0);
      
      setStats({
        total,
        totalIngresos,
        facturasMes,
        ingresosMes
      });
    } catch (err) {
      console.error('Error calculating factura stats:', err);
    }
  }, [facturas]);

  const createFactura = useCallback(async (data: FacturaCreateData) => {
    try {
      setError(null);
      const newFactura = await facturaService.create(data);
      setFacturas(prev => [newFactura, ...prev]);
      // Actualizar estadísticas
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura');
      throw err;
    }
  }, [fetchStats]);

  const updateFactura = useCallback(async (id: string, data: Partial<FacturaCreateData>) => {
    try {
      setError(null);
      const updatedFactura = await facturaService.update(id, data);
      setFacturas(prev => prev.map(factura => 
        factura.id === id ? updatedFactura : factura
      ));
      // Actualizar estadísticas
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar factura');
      throw err;
    }
  }, [fetchStats]);

  const deleteFactura = useCallback(async (id: string) => {
    try {
      setError(null);
      await facturaService.delete(id);
      setFacturas(prev => prev.filter(factura => factura.id !== id));
      // Actualizar estadísticas
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar factura');
      throw err;
    }
  }, [fetchStats]);

  const searchFacturas = useCallback(async (filters: FacturaFilters, page: number = 1) => {
    await fetchFacturas(page, 20, filters);
  }, [fetchFacturas]);

  const loadPage = useCallback(async (page: number) => {
    await fetchFacturas(page);
  }, [fetchFacturas]);

  const getSiguienteNumero = useCallback(async (empresaId: string): Promise<string> => {
    try {
      return await facturaService.getSiguienteNumero(empresaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener siguiente número');
      throw err;
    }
  }, []);

  const refreshFacturas = useCallback(async () => {
    await fetchFacturas();
  }, [fetchFacturas]);

  useEffect(() => {
    refreshFacturas();
  }, [refreshFacturas]);

  // Calcular estadísticas cuando cambien las facturas
  useEffect(() => {
    if (facturas.length > 0) {
      fetchStats();
    }
  }, [facturas, fetchStats]);

  // Cleanup effect para evitar memory leaks
  useEffect(() => {
    return () => {
      // Limpiar cualquier listener o timer pendiente
      setFacturas([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    };
  }, []);

  return {
    facturas,
    pagination,
    loading,
    error,
    createFactura,
    updateFactura,
    deleteFactura,
    searchFacturas,
    refreshFacturas,
    loadPage,
    getSiguienteNumero,
    stats
  };
}
