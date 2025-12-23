const express = require('express');
const ProformaController = require('../controllers/proformaController');

/**
 * Crear router de proformas
 */
function createProformasRouter(db, logger, cacheManager, paginationManager) {
    const router = express.Router();
    const controller = new ProformaController(db, logger, cacheManager, paginationManager);

    // Rutas principales
    router.get('/', controller.getAll);
    router.post('/', controller.create);
    router.get('/siguiente-numero/:empresaId', controller.getSiguienteNumero);
    
    // Rutas por ID
    router.get('/:id', controller.getById);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
}

module.exports = createProformasRouter;

