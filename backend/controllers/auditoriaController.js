const AuditoriaService = require('../services/auditoriaService');
const ErrorHandler = require('../utils/errorHandler');

class AuditoriaController {
    constructor(sistemaAuditoria, logger) {
        this.service = new AuditoriaService(sistemaAuditoria, logger);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/auditoria/verificar-integridad
     */
    verificarIntegridad = async (req, res) => {
        try {
            const resultado = await this.service.verificarIntegridad();
            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error al verificar integridad de auditoría', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'verificar integridad de auditoría');
        }
    };
}

module.exports = AuditoriaController;

