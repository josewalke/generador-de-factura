const AuthService = require('../modules/authService');

const authService = new AuthService();

/**
 * Middleware de autenticación para endpoints protegidos
 */
const requireAuth = (req, res, next) => {
    authService.authMiddleware(req, res, next);
};

/**
 * Middleware para requerir roles específicos
 * @param {string[]} roles - Array de roles permitidos
 */
const requireRole = (roles) => {
    return authService.requireRole(roles);
};

module.exports = {
    requireAuth,
    requireRole
};



