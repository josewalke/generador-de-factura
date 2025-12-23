class LogsService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Obtener estadísticas de logs
     */
    getStats() {
        // Obtener estadísticas del logger si está disponible
        if (this.logger && typeof this.logger.getStats === 'function') {
            return this.logger.getStats();
        }
        
        // Retornar estadísticas básicas si el logger no tiene método getStats
        return {
            total: 0,
            porTipo: {},
            porNivel: {}
        };
    }
}

module.exports = LogsService;

