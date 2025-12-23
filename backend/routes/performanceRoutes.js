const express = require('express');
const PerformanceController = require('../controllers/performanceController');

/**
 * Crear router de performance
 */
function createPerformanceRouter(cacheManager, paginationManager, preheatCacheFn, logger) {
    const router = express.Router();
    const controller = new PerformanceController(cacheManager, paginationManager, preheatCacheFn, logger);

    router.get('/stats', controller.getStats);
    router.post('/cache/clear', controller.clearCache);
    router.post('/cache/preheat', controller.preheatCache);
    router.get('/cache/stats', controller.getCacheStats);
    router.post('/analyze-query', controller.analyzeQuery);

    return router;
}

module.exports = createPerformanceRouter;
