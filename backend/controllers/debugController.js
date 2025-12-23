const DebugService = require('../services/debugService');
const ErrorHandler = require('../utils/errorHandler');

class DebugController {
    constructor(db, logger) {
        this.service = new DebugService(db, logger);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/debug/productos-coches
     */
    getProductosCoches = async (req, res) => {
        try {
            const data = await this.service.getProductosCoches();
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            this.logger.error('Error obteniendo relación productos-coches', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener relación productos-coches');
        }
    };

    /**
     * GET /api/debug/facturas-coches
     */
    getFacturasCoches = async (req, res) => {
        try {
            const data = await this.service.getFacturasCoches();
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            this.logger.error('Error obteniendo relación facturas-coches', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener relación facturas-coches');
        }
    };
}

module.exports = DebugController;
