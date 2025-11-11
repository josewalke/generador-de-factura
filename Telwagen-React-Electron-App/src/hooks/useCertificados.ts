import { useState, useEffect, useCallback } from 'react';
import { certificadoService, CertificadoDigital, CertificadosResponse } from '../services/certificadoService';

export interface UseCertificadosReturn {
  certificados: CertificadoDigital[];
  loading: boolean;
  error: string | null;
  refreshCertificados: () => Promise<void>;
  getCertificadosDisponibles: () => Promise<CertificadosResponse>;
}

export function useCertificados(): UseCertificadosReturn {
  const [certificados, setCertificados] = useState<CertificadoDigital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 [useCertificados] Obteniendo certificados disponibles...');
      const response = await certificadoService.getCertificadosDisponibles();
      
      if (response.success) {
        setCertificados(response.certificados);
        console.log('🔐 [useCertificados] Certificados obtenidos:', response.certificados.length);
      } else {
        setError(response.error || 'Error al obtener certificados');
        console.error('🔐 [useCertificados] Error en respuesta:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar certificados';
      setError(errorMessage);
      console.error('🔐 [useCertificados] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCertificados = useCallback(async () => {
    await fetchCertificados();
  }, [fetchCertificados]);

  const getCertificadosDisponibles = useCallback(async (): Promise<CertificadosResponse> => {
    try {
      setError(null);
      const response = await certificadoService.getCertificadosDisponibles();
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener certificados';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    // No cargar automáticamente para evitar llamadas innecesarias
    // Los certificados se cargarán cuando se necesiten
  }, []);

  return {
    certificados,
    loading,
    error,
    refreshCertificados,
    getCertificadosDisponibles
  };
}


