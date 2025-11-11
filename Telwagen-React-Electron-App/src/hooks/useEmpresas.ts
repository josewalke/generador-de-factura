import { useState, useEffect } from 'react';
import { empresaService, Empresa } from '../services/empresaService';

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await empresaService.getAll();
      setEmpresas(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error cargando empresas:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEmpresa = async (empresaData: Omit<Empresa, 'id' | 'fecha_creacion'>) => {
    try {
      const nuevaEmpresa = await empresaService.create(empresaData);
      setEmpresas(prev => [...prev, nuevaEmpresa]);
      return nuevaEmpresa;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando empresa');
      throw err;
    }
  };

  const updateEmpresa = async (id: string, empresaData: Partial<Empresa>) => {
    try {
      const empresaActualizada = await empresaService.update(id, empresaData);
      setEmpresas(prev => prev.map(empresa => 
        empresa.id === id ? empresaActualizada : empresa
      ));
      return empresaActualizada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando empresa');
      throw err;
    }
  };

  const deleteEmpresa = async (id: string) => {
    try {
      await empresaService.delete(id);
      setEmpresas(prev => prev.filter(empresa => empresa.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando empresa');
      throw err;
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, []);

  return {
    empresas,
    loading,
    error,
    loadEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa
  };
}