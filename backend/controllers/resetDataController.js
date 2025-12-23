const ResetDataService = require('../services/resetDataService');
const ErrorHandler = require('../utils/errorHandler');

class ResetDataController {
    constructor(db, logger, insertSampleDataFn) {
        this.service = new ResetDataService(db, logger, insertSampleDataFn);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * POST /api/reset-data
     */
    resetData = async (req, res) => {
        try {
            const resultado = await this.service.resetData();
            res.json(resultado);
        } catch (error) {
            this.logger.error('Error reseteando datos', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'resetear datos');
        }
    };
}

module.exports = ResetDataController;

