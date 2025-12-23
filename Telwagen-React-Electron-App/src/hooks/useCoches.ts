import { useState, useEffect, useCallback } from 'react';
import { cocheService, Coche, CocheCreateData } from '../services';
import { logger } from '../utils/logger';
import { toast } from 'sonner';
import { CocheUpdateData } from '../schemas/cocheSchema';

// Estado de carga unificado
interface LoadingState {
  fetching: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  searching: boolean;
}

export interface UseCochesReturn {
  coches: Coche[];
  cochesDisponibles: Coche[];
  cochesVendidos: Coche[];
  loading: LoadingState;
  error: string | null;
  createCoche: (data: CocheCreateData) => Promise<Coche>;
  updateCoche: (id: string, data: CocheUpdateData) => Promise<Coche>;
  deleteCoche: (id: string) => Promise<void>;
  searchCoches: (searchTerm: string) => Promise<void>;
  refreshCoches: () => Promise<void>;
  loadDisponibles: (excluirProformados?: boolean) => Promise<void>;
  loadVendidos: () => Promise<void>;
  getDisponiblesParaFactura: () => Promise<Coche[]>;
  clearError: () => void;
}

export function useCoches(): UseCochesReturn {
  const [coches, setCoches] = useState<Coche[]>([]);
  const [cochesDisponibles, setCochesDisponibles] = useState<Coche[]>([]);
  const [cochesVendidos, setCochesVendidos] = useState<Coche[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    fetching: true,
    creating: false,
    updating: false,
    deleting: false,
    searching: false
  });
  const [error, setError] = useState<string | null>(null);

  // Helper para manejar errores de forma consistente
  const handleError = useCallback((err: any, context: string) => {
    logger.useCoches.error(`Error en ${context}`, err);
    
    if (err?.response?.status === 409 && err?.response?.data?.code === 'DUPLICATE_MATRICULA') {
      const errorMessage = err.response.data.message;
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } else if (err?.response?.status === 400) {
      const errorMessage = err.response.data.error || 'Datos inválidos';
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } else if (err?.response?.status === 404) {
      const errorMessage = 'Recurso no encontrado';
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      const errorMessage = err instanceof Error ? err.message : 'Error interno del servidor';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Helper para actualizar estado de carga
  const setLoadingState = useCallback((updates: Partial<LoadingState>) => {
    setLoading(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchCoches = useCallback(async () => {
    try {
      setLoadingState({ fetching: true });
      setError(null);
      logger.useCoches.debug('Iniciando carga de coches');
      
      const data = await cocheService.getAll();
      setCoches(data);
      
      logger.useCoches.info(`Coches cargados exitosamente: ${data.length} vehículos`);
    } catch (err) {
      logger.useCoches.error('Error al cargar coches', err);
      
      // Manejar errores sin lanzar excepción para no bloquear el finally
      if ((err as any)?.response?.status === 404) {
        setError('No se encontraron vehículos');
        toast.error('No se encontraron vehículos');
      } else if ((err as any)?.response?.status >= 500) {
        setError('Error del servidor. Inténtalo de nuevo.');
        toast.error('Error del servidor. Inténtalo de nuevo.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar vehículos';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoadingState({ fetching: false });
    }
  }, [setLoadingState]);

  const loadDisponibles = useCallback(async (excluirProformados: boolean = true) => {
    try {
      setError(null);
      logger.useCoches.debug('Cargando coches disponibles', { excluirProformados });
      
      const data = await cocheService.getDisponibles(excluirProformados);
      setCochesDisponibles(data);
      
      logger.useCoches.info(`Coches disponibles cargados: ${data.length} vehículos`);
    } catch (err) {
      logger.useCoches.error('Error al cargar coches disponibles', err);
      // No mostramos error para esta función ya que es secundaria
    }
  }, []);

  // Función para obtener coches disponibles para crear proformas/facturas (incluye proformados)
  const getDisponiblesParaFactura = useCallback(async (): Promise<Coche[]> => {
    try {
      console.log('🔍 [getDisponiblesParaFactura] Iniciando carga de coches (incluye proformados)');
      logger.useCoches.debug('Cargando coches disponibles para factura/proforma (incluye proformados)');
      const data = await cocheService.getDisponibles(false); // false = incluir proformados
      console.log('✅ [getDisponiblesParaFactura] Coches cargados:', data.length);
      if (data.length > 0) {
        const ejemplo = data[0];
        console.log('📝 [getDisponiblesParaFactura] Ejemplo de coche:', {
          matricula: ejemplo.matricula,
          tiene_proforma: ejemplo.tiene_proforma,
          tipo_tiene_proforma: typeof ejemplo.tiene_proforma,
          numero_proforma: ejemplo.numero_proforma
        });
      }
      logger.useCoches.info(`Coches disponibles para factura/proforma cargados: ${data.length} vehículos`);
      return data;
    } catch (err) {
      console.error('❌ [getDisponiblesParaFactura] Error:', err);
      logger.useCoches.error('Error al cargar coches disponibles para factura/proforma', err);
      throw err;
    }
  }, []);

  const loadVendidos = useCallback(async () => {
    try {
      setError(null);
      logger.useCoches.debug('Cargando coches vendidos');
      
      const data = await cocheService.getVendidos();
      setCochesVendidos(data);
      
      logger.useCoches.info(`Coches vendidos cargados: ${data.length} vehículos`);
    } catch (err) {
      logger.useCoches.error('Error al cargar coches vendidos', err);
      // No mostramos error para esta función ya que es secundaria
    }
  }, []);

  const createCoche = useCallback(async (data: CocheCreateData): Promise<Coche> => {
    try {
      setLoadingState({ creating: true });
      setError(null);
      logger.useCoches.debug('Creando nuevo coche', data);
      
      const newCoche = await cocheService.create(data);
      
      // Actualizar estado local
      setCoches(prev => [newCoche, ...prev]);
      
      // Actualizar también la lista de disponibles
      await loadDisponibles();
      
      logger.useCoches.info(`Coche creado exitosamente: ${newCoche.matricula}`);
      toast.success(`Vehículo ${newCoche.matricula} creado exitosamente`);
      
      return newCoche;
    } catch (err) {
      handleError(err, 'createCoche');
      throw err;
    } finally {
      setLoadingState({ creating: false });
    }
  }, [loadDisponibles, setLoadingState, handleError]);

  const updateCoche = useCallback(async (id: string, data: CocheUpdateData): Promise<Coche> => {
    try {
      setLoadingState({ updating: true });
      setError(null);
      logger.useCoches.debug('Actualizando coche', { id, data });
      
      const updatedCoche = await cocheService.update(id, data);
      
      // Actualizar estado local de forma optimizada
      const updateCocheInList = (coche: Coche) => coche.id === id ? updatedCoche : coche;
      
      setCoches(prev => prev.map(updateCocheInList));
      setCochesDisponibles(prev => prev.map(updateCocheInList));
      setCochesVendidos(prev => prev.map(updateCocheInList));
      
      logger.useCoches.info(`Coche actualizado exitosamente: ${updatedCoche.matricula}`);
      toast.success(`Vehículo ${updatedCoche.matricula} actualizado exitosamente`);
      
      return updatedCoche;
    } catch (err) {
      handleError(err, 'updateCoche');
      throw err;
    } finally {
      setLoadingState({ updating: false });
    }
  }, [setLoadingState, handleError]);

  const deleteCoche = useCallback(async (id: string) => {
    try {
      setLoadingState({ deleting: true });
      setError(null);
      logger.useCoches.debug('Eliminando coche', { id });
      
      await cocheService.delete(id);
      
      // Actualizar estado local
      const removeCocheFromList = (coche: Coche) => coche.id !== id;
      setCoches(prev => prev.filter(removeCocheFromList));
      setCochesDisponibles(prev => prev.filter(removeCocheFromList));
      setCochesVendidos(prev => prev.filter(removeCocheFromList));
      
      logger.useCoches.info('Coche eliminado exitosamente');
      toast.success('Vehículo eliminado exitosamente');
    } catch (err) {
      handleError(err, 'deleteCoche');
      throw err;
    } finally {
      setLoadingState({ deleting: false });
    }
  }, [setLoadingState, handleError]);

  const searchCoches = useCallback(async (searchTerm: string) => {
    try {
      setLoadingState({ searching: true });
      setError(null);
      logger.useCoches.debug('Buscando coches', { searchTerm });
      
      const data = await cocheService.search(searchTerm);
      setCoches(data);
      
      logger.useCoches.info(`Búsqueda completada: ${data.length} resultados`);
    } catch (err) {
      handleError(err, 'searchCoches');
    } finally {
      setLoadingState({ searching: false });
    }
  }, [setLoadingState, handleError]);

  const refreshCoches = useCallback(async () => {
    logger.useCoches.debug('Refrescando todos los datos de coches');
    await Promise.all([
      fetchCoches(),
      loadDisponibles(),
      loadVendidos()
    ]);
  }, [fetchCoches, loadDisponibles, loadVendidos]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    refreshCoches();
  }, [refreshCoches]);

  // Cleanup effect para evitar memory leaks
  useEffect(() => {
    return () => {
      logger.useCoches.debug('Limpiando estado de useCoches');
      setCoches([]);
      setCochesDisponibles([]);
      setCochesVendidos([]);
    };
  }, []);

  return {
    coches,
    cochesDisponibles,
    cochesVendidos,
    loading,
    error,
    createCoche,
    updateCoche,
    deleteCoche,
    searchCoches,
    refreshCoches,
    loadDisponibles,
    loadVendidos,
    getDisponiblesParaFactura,
    clearError
  };
}
