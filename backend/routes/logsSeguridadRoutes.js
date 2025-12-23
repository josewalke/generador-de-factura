/**
 * Rutas de Logs de Seguridad
 * Define las rutas API para logs de seguridad
 */

const express = require('express');

function createLogsSeguridadRouter(logsSeguridadService, sistemaControlAcceso) {
    const router = express.Router();
    const LogsSeguridadController = require('../controllers/logsSeguridadController');
    const controller = new LogsSeguridadController(logsSeguridadService);

    // GET /api/logs-seguridad - Obtener logs de seguridad
    router.get('/', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:leer'), 
        controller.getLogs.bind(controller)
    );

    // GET /api/logs-seguridad/estadisticas - Obtener estadísticas de logs
    router.get('/estadisticas', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:leer'), 
        controller.getEstadisticas.bind(controller)
    );

    // GET /api/logs-seguridad/verificar-integridad - Verificar integridad de logs
    router.get('/verificar-integridad', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:verificar'), 
        controller.verificarIntegridad.bind(controller)
    );

    return router;
}

module.exports = createLogsSeguridadRouter;


