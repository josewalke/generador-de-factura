const express = require('express');
const ResetDataController = require('../controllers/resetDataController');

/**
 * Crear router de reset-data
 */
function createResetDataRouter(db, logger, insertSampleDataFn) {
    const router = express.Router();
    const controller = new ResetDataController(db, logger, insertSampleDataFn);

    router.post('/', controller.resetData);

    return router;
}

module.exports = createResetDataRouter;

