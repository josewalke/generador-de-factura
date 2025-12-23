const express = require('express');
const LogsController = require('../controllers/logsController');

/**
 * Crear router de logs
 */
function createLogsRouter(logger) {
    const router = express.Router();
    const controller = new LogsController(logger);

    router.get('/stats', controller.getStats);

    return router;
}

module.exports = createLogsRouter;

