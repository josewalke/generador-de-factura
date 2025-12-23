const ConfiguracionService = require('../services/configuracionService');
const ErrorHandler = require('../utils/errorHandler');

class ConfiguracionController {
    constructor(configuracionEmpresa, logger) {
        this.service = new ConfiguracionService(configuracionEmpresa);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/configuracion/empresa
     */
    getEmpresa = (req, res) => {
        try {
            const resultado = this.service.getEmpresa();
            res.json(resultado);
        } catch (error) {
            this.logger.error('Error obteniendo configuración de empresa', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener configuración de empresa');
        }
    };
}

module.exports = ConfiguracionController;

