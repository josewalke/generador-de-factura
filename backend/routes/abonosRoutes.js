const express = require('express');
const AbonoController = require('../controllers/abonoController');

/**
 * Crear router de abonos
 */
function createAbonosRouter(db, logger, cacheManager, paginationManager) {
    const router = express.Router();
    const controller = new AbonoController(db, logger, cacheManager, paginationManager);

    // Rutas principales
    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);

    return router;
}

module.exports = createAbonosRouter;
