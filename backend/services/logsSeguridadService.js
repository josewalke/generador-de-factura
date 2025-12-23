/**
 * Servicio de Logs de Seguridad
 * Encapsula la lógica de negocio para logs de seguridad
 */

class LogsSeguridadService {
    constructor(sistemaLogsSeguridad) {
        this.sistemaLogsSeguridad = sistemaLogsSeguridad;
    }

    /**
     * Obtener logs de seguridad
     */
    async getLogs(filtros) {
        return await this.sistemaLogsSeguridad.obtenerLogs(filtros);
    }

    /**
     * Obtener estadísticas de logs
     */
    async getEstadisticas(fechaDesde, fechaHasta) {
        return await this.sistemaLogsSeguridad.obtenerEstadisticas(fechaDesde, fechaHasta);
    }

    /**
     * Verificar integridad de logs
     */
    async verificarIntegridad() {
        return await this.sistemaLogsSeguridad.verificarIntegridadLogs();
    }
}

module.exports = LogsSeguridadService;


