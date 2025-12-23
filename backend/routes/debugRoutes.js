const express = require('express');
const DebugController = require('../controllers/debugController');

/**
 * Crear router de debug
 */
function createDebugRouter(db, logger) {
    const router = express.Router();
    const controller = new DebugController(db, logger);

    router.get('/productos-coches', controller.getProductosCoches);
    router.get('/facturas-coches', controller.getFacturasCoches);

    return router;
}

module.exports = createDebugRouter;

