const express = require('express');
const ClienteController = require('../controllers/clienteController');

/**
 * Crear router de clientes
 */
function createClientesRouter(db, logger, cacheManager) {
    const router = express.Router();
    const controller = new ClienteController(db, logger, cacheManager);

    router.get('/', controller.getAll);
    router.get('/buscar/:identificacion', controller.buscarPorIdentificacion);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
}

module.exports = createClientesRouter;



