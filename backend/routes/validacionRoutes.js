const express = require('express');
const ValidacionController = require('../controllers/validacionController');

/**
 * Crear router de validación
 */
function createValidacionRouter(sistemaValidacionFiscal, logger) {
    const router = express.Router();
    const controller = new ValidacionController(sistemaValidacionFiscal, logger);

    // Rutas POST - Validaciones
    router.post('/nif', controller.validarNIF);
    router.post('/cif', controller.validarCIF);
    router.post('/nie', controller.validarNIE);
    router.post('/identificacion', controller.validarIdentificacion);
    router.post('/pais', controller.validarPais);
    router.post('/provincia', controller.validarProvincia);
    router.post('/cliente', controller.validarCliente);
    router.post('/empresa', controller.validarEmpresa);

    // Rutas GET - Obtener listas
    router.get('/paises', controller.obtenerPaises);
    router.get('/provincias', controller.obtenerProvincias);
    router.get('/regimenes', controller.obtenerRegimenes);

    return router;
}

module.exports = createValidacionRouter;
