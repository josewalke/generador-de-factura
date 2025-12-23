const express = require('express');
const MetricsController = require('../controllers/metricsController');

/**
 * Crear router de metrics
 */
function createMetricsRouter(db, logger) {
    const router = express.Router();
    const controller = new MetricsController(db, logger);

    router.get('/resumen', controller.getResumen);

    return router;
}

module.exports = createMetricsRouter;
