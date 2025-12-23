class AuditoriaService {
    constructor(sistemaAuditoria, logger) {
        this.sistemaAuditoria = sistemaAuditoria;
        this.logger = logger;
    }

    /**
     * Verificar integridad de auditoría
     */
    async verificarIntegridad() {
        try {
            return await this.sistemaAuditoria.verificarIntegridadAuditoria();
        } catch (error) {
            this.logger.error('Error al verificar integridad de auditoría', { error: error.message });
            throw error;
        }
    }
}

module.exports = AuditoriaService;

