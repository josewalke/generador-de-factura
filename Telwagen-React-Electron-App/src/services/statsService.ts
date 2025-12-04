import { apiClient, handleApiResponse } from './apiClient';

export interface MetricsResumen {
  totalClientes: number;
  totalCoches: number;
  totalFacturas: number;
  totalEmpresas: number;
  totalProformas: number;
  ingresosMes: number;
}

class StatsService {
  async getResumen(): Promise<MetricsResumen> {
    const response = await apiClient.get('/api/metrics/resumen');
    return handleApiResponse(response);
  }
}

export const statsService = new StatsService();
export default statsService;

