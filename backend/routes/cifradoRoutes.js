/**
 * Rutas de Cifrado
 * Define las rutas API para cifrado/descifrado de datos
 */

const express = require('express');

function createCifradoRouter(cifradoService, sistemaControlAcceso) {
    const router = express.Router();
    const CifradoController = require('../controllers/cifradoController');
    const controller = new CifradoController(cifradoService);

    // POST /api/cifrado/cifrar - Cifrar datos
    router.post('/cifrar', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('facturas:crear'), 
        controller.cifrar.bind(controller)
    );

    // POST /api/cifrado/descifrar - Descifrar datos
    router.post('/descifrar', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('facturas:leer'), 
        controller.descifrar.bind(controller)
    );

    return router;
}

module.exports = createCifradoRouter;


