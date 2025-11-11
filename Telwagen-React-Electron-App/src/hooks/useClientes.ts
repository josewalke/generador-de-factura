import { useState, useEffect, useCallback } from 'react';
import { clienteService, Cliente, ClienteCreateData } from '../services';

export interface UseClientesReturn {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  createCliente: (data: ClienteCreateData) => Promise<void>;
  updateCliente: (id: string, data: Partial<ClienteCreateData>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  searchClientes: (searchTerm: string) => Promise<void>;
  refreshClientes: () => Promise<void>;
}

export function useClientes(): UseClientesReturn {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      console.error('Error fetching clientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCliente = useCallback(async (data: ClienteCreateData) => {
    try {
      setError(null);
      const newCliente = await clienteService.create(data);
      setClientes(prev => [newCliente, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
      throw err;
    }
  }, []);

  const updateCliente = useCallback(async (id: string, data: Partial<ClienteCreateData>) => {
    try {
      setError(null);
      const updatedCliente = await clienteService.update(id, data);
      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? updatedCliente : cliente
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cliente');
      throw err;
    }
  }, []);

  const deleteCliente = useCallback(async (id: string) => {
    try {
      setError(null);
      await clienteService.delete(id);
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente');
      throw err;
    }
  }, []);

  const searchClientes = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await clienteService.search(searchTerm);
      setClientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar clientes');
      console.error('Error searching clientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshClientes = useCallback(async () => {
    await fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    clientes,
    loading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    searchClientes,
    refreshClientes
  };
}
