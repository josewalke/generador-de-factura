const express = require('express');
const CocheController = require('../controllers/cocheController');

/**
 * Crear router de coches
 */
function createCochesRouter(db, logger, cacheManager) {
    const router = express.Router({ mergeParams: true });
    const controller = new CocheController(db, logger, cacheManager);

    // Rutas específicas deben ir ANTES de rutas con parámetros dinámicos
    // IMPORTANTE: El orden es crítico - Express evalúa rutas en el orden en que se registran
    // Usar rutas exactas primero para evitar que :id capture rutas específicas
    router.get('/', controller.getAll);
    router.get('/disponibles', controller.getDisponibles);
    router.get('/vendidos', controller.getVendidos);
    router.get('/productos', controller.getProductos);
    
    // Middleware para validar que :id sea numérico antes de llegar al controlador
    router.param('id', (req, res, next, id) => {
        // Si el ID no es numérico, podría ser una ruta específica mal capturada
        const idNum = parseInt(id, 10);
        if (isNaN(idNum) || idNum.toString() !== id) {
            // No es un ID válido, podría ser una ruta específica
            // Dejar que Express continúe buscando otras rutas
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }
        // Es un ID válido, continuar
        req.params.id = idNum;
        next();
    });
    
    // Ruta con parámetro dinámico debe ir al final para evitar conflictos
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
}

module.exports = createCochesRouter;



