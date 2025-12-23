/**
 * Rutas de Seguridad
 * Define las rutas API para estadísticas y reportes de seguridad
 */

const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

function createSecurityRouter(securityService) {
    const router = express.Router();
    const SecurityController = require('../controllers/securityController');
    const controller = new SecurityController(securityService);

    // GET /api/security/stats - Obtener estadísticas de seguridad
    router.get('/stats', requireAuth, requireRole(['admin']), controller.getStats.bind(controller));

    // GET /api/security/report - Obtener reporte de seguridad
    router.get('/report', requireAuth, requireRole(['admin']), controller.getReport.bind(controller));

    // GET /api/security/alerts - Obtener alertas recientes
    router.get('/alerts', requireAuth, requireRole(['admin']), controller.getAlerts.bind(controller));

    return router;
}

module.exports = createSecurityRouter;


