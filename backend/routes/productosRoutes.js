const express = require('express');
const ProductoController = require('../controllers/productoController');

/**
 * Crear router de productos
 */
function createProductosRouter(db, logger, cacheManager) {
    const router = express.Router();
    const controller = new ProductoController(db, logger, cacheManager);

    router.get('/', controller.getAll);
    router.get('/buscar/:codigo', controller.buscarPorCodigo);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.post('/desde-coche', controller.createDesdeCoche);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
}

module.exports = createProductosRouter;



