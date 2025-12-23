const express = require('express');
const ConfiguracionController = require('../controllers/configuracionController');

/**
 * Crear router de configuración
 */
function createConfiguracionRouter(configuracionEmpresa, logger) {
    const router = express.Router();
    const controller = new ConfiguracionController(configuracionEmpresa, logger);

    router.get('/empresa', controller.getEmpresa);

    return router;
}

module.exports = createConfiguracionRouter;

