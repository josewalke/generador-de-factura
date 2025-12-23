const express = require('express');
const FacturaController = require('../controllers/facturaController');

/**
 * Crear router de facturas
 */
function createFacturasRouter(db, logger, cacheManager, paginationManager, sistemaIntegridad, sistemaAuditoria, sistemaFirmaDigital, generadorVeriFactu) {
    const router = express.Router();
    const controller = new FacturaController(
        db, 
        logger, 
        cacheManager, 
        paginationManager, 
        sistemaIntegridad, 
        sistemaAuditoria, 
        sistemaFirmaDigital, 
        generadorVeriFactu
    );

    // Rutas principales
    router.get('/', controller.getAll);
    router.post('/', controller.create);
    router.get('/resumen', controller.getResumen);
    router.get('/anios', controller.getAnios);
    router.get('/siguiente-numero/:empresaId', controller.getSiguienteNumero);
    
    // Rutas por ID
    router.get('/:id', controller.getById);
    router.get('/:id/verifactu', controller.getVeriFactu);
    router.get('/:id/auditoria', controller.getAuditoria);
    router.put('/:id/marcar-pagada', controller.marcarPagada);
    router.put('/:id/marcar-pendiente', controller.marcarPendiente);
    router.put('/:id/anular', controller.anular);
    router.post('/:id/enviar-verifactu', controller.enviarVeriFactu);

    return router;
}

module.exports = createFacturasRouter;

