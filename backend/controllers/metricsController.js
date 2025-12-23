const MetricsService = require('../services/metricsService');
const ErrorHandler = require('../utils/errorHandler');

class MetricsController {
    constructor(db, logger) {
        this.service = new MetricsService(db, logger);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/metrics/resumen
     */
    getResumen = async (req, res) => {
        try {
            const resumen = await this.service.getResumen();
            res.json({
                success: true,
                data: resumen
            });
        } catch (error) {
            this.logger.error('Error obteniendo resumen de métricas', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener resumen de métricas');
        }
    };
}

module.exports = MetricsController;
