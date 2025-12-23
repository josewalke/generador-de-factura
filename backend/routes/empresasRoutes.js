const express = require('express');
const EmpresaController = require('../controllers/empresaController');

/**
 * Crear router de empresas
 */
function createEmpresasRouter(db, logger, cacheManager, paginationManager, sistemaFirmaDigital) {
    const router = express.Router();
    const controller = new EmpresaController(db, logger, cacheManager, paginationManager, sistemaFirmaDigital);

    // Rutas principales
    router.get('/', controller.getAll);
    router.post('/', controller.create);
    
    // Rutas por ID
    router.get('/:id', controller.getById);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
}

module.exports = createEmpresasRouter;
