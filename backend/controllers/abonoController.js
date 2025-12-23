const AbonoService = require('../services/abonoService');
const ErrorHandler = require('../utils/errorHandler');

class AbonoController {
    constructor(db, logger, cacheManager, paginationManager) {
        this.service = new AbonoService(db, logger, paginationManager);
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/abonos
     */
    getAll = async (req, res) => {
        const startTime = Date.now();
        this.logger.operationRead('abonos', null, req.query);

        try {
            const result = await this.service.getAll(req.query);
            const duration = Date.now() - startTime;

            this.logger.info(`Abonos obtenidos: ${result.data?.length || 0} registros`, {
                count: result.data?.length || 0,
                duration: `${duration}ms`
            }, 'operations');

            res.json({ success: true, ...result });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error obteniendo abonos', {
                error: error.message,
                duration: `${duration}ms`,
                query: req.query
            }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener abonos', { query: req.query });
        }
    };

    /**
     * GET /api/abonos/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;
        const includeDetalles = req.query.include_detalles === 'true';

        try {
            const abono = await this.service.getById(id, includeDetalles);

            if (!abono) {
                return this.errorHandler.handleNotFoundError(res, 'Abono', id);
            }

            res.json({ success: true, data: abono });
        } catch (error) {
            this.logger.error('Error obteniendo abono', { error: error.message, id }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener abono', { id });
        }
    };
}

module.exports = AbonoController;
