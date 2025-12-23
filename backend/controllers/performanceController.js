const PerformanceService = require('../services/performanceService');
const ErrorHandler = require('../utils/errorHandler');

class PerformanceController {
    constructor(cacheManager, paginationManager, preheatCacheFn, logger) {
        this.service = new PerformanceService(cacheManager, paginationManager, preheatCacheFn);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/performance/stats
     */
    getStats = (req, res) => {
        try {
            const stats = this.service.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            this.logger.error('Error obteniendo estadísticas de rendimiento', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener estadísticas de rendimiento');
        }
    };

    /**
     * POST /api/performance/cache/clear
     */
    clearCache = (req, res) => {
        try {
            const { pattern } = req.body;
            const result = this.service.clearCache(pattern);
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            this.logger.error('Error limpiando caché', { error: error.message, pattern: req.body.pattern });
            this.errorHandler.handleGenericError(error, res, 'limpiar caché');
        }
    };

    /**
     * POST /api/coches/cache/clear
     */
    clearCochesCache = (req, res) => {
        try {
            const result = this.service.clearCochesCache();
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            this.logger.error('Error limpiando caché de coches', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'limpiar caché de coches');
        }
    };

    /**
     * GET /api/performance/cache/stats
     */
    getCacheStats = (req, res) => {
        try {
            const stats = this.service.getCacheStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            this.logger.error('Error obteniendo estadísticas de caché', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener estadísticas de caché');
        }
    };

    /**
     * POST /api/performance/cache/preheat
     */
    preheatCache = async (req, res) => {
        try {
            await this.service.preheatCache();
            res.json({
                success: true,
                message: 'Caché precalentado correctamente'
            });
        } catch (error) {
            this.logger.error('Error precalentando caché', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'precalentar caché');
        }
    };

    /**
     * POST /api/performance/analyze-query
     */
    analyzeQuery = async (req, res) => {
        try {
            const { query, params = [] } = req.body;
            const resultado = await this.service.analyzeQuery(query, params);
            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error analizando query', { error: error.message });
            
            if (error.message === 'Query contains dangerous commands') {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            } else {
                this.errorHandler.handleGenericError(error, res, 'analizar query');
            }
        }
    };
}

module.exports = PerformanceController;
