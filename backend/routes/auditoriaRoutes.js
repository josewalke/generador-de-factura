const express = require('express');
const AuditoriaController = require('../controllers/auditoriaController');

/**
 * Crear router de auditoría
 */
function createAuditoriaRouter(sistemaAuditoria, logger) {
    const router = express.Router();
    const controller = new AuditoriaController(sistemaAuditoria, logger);

    router.get('/verificar-integridad', controller.verificarIntegridad);

    return router;
}

module.exports = createAuditoriaRouter;

