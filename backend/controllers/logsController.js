const LogsService = require('../services/logsService');
const ErrorHandler = require('../utils/errorHandler');

class LogsController {
    constructor(logger) {
        this.service = new LogsService(logger);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/logs/stats
     */
    getStats = (req, res) => {
        try {
            const stats = this.service.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            this.logger.error('Error obteniendo estadísticas de logs', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener estadísticas de logs');
        }
    };
}

module.exports = LogsController;

