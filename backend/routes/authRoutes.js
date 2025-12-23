/**
 * Rutas de Autenticación
 * Define las rutas API para autenticación de usuarios
 */

const express = require('express');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

function createAuthRouter(authService, config, sistemaControlAcceso) {
    const router = express.Router();
    const AuthController = require('../controllers/authController');
    const controller = new AuthController(authService, config);

    // POST /api/auth/login - Iniciar sesión
    router.post('/login', controller.login.bind(controller));

    // POST /api/auth/refresh - Refrescar token
    router.post('/refresh', requireAuth, controller.refresh.bind(controller));

    // GET /api/auth/me - Obtener información del usuario actual
    router.get('/me', requireAuth, controller.getMe.bind(controller));

    // GET /api/auth/roles - Obtener roles disponibles (solo admin)
    router.get('/roles', requireAuth, requireRole(['admin']), controller.getRoles.bind(controller));

    // POST /api/auth/check-permission - Verificar permisos
    router.post('/check-permission', requireAuth, controller.checkPermission.bind(controller));

    // POST /api/auth/logout - Cerrar sesión
    router.post('/logout', sistemaControlAcceso.middlewareAutenticacion(), controller.logout.bind(controller));

    return router;
}

module.exports = createAuthRouter;


