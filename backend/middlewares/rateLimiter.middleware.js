const rateLimit = require('express-rate-limit');
const config = require('../config/config');

/**
 * Rate limiter general para todas las rutas
 */
const limiter = rateLimit({
    windowMs: config.get('security.rateLimit.windowMs'),
    max: config.get('security.rateLimit.max'),
    message: {
        error: 'Demasiadas solicitudes desde esta IP, inténtelo de nuevo más tarde.',
        retryAfter: Math.ceil(config.get('security.rateLimit.windowMs') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Saltar rate limiting para localhost en desarrollo
        return config.get('server.environment') === 'development' && 
               (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
    }
});

/**
 * Rate limiter más estricto para login (protección contra fuerza bruta)
 */
const loginLimiter = rateLimit({
    windowMs: config.get('security.rateLimit.loginWindowMs'),
    max: config.get('security.rateLimit.loginMax'),
    message: {
        error: 'Demasiados intentos de login. Inténtelo de nuevo más tarde.',
        retryAfter: Math.ceil(config.get('security.rateLimit.loginWindowMs') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // No contar intentos exitosos
});

/**
 * Rate limiter específico para endpoints de facturas
 */
const facturasLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        error: 'Demasiadas solicitudes a facturas. Inténtelo de nuevo más tarde.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter específico para endpoints de proformas
 */
const proformasLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: {
        error: 'Demasiadas solicitudes a proformas. Inténtelo de nuevo más tarde.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter específico para endpoints de abonos
 */
const abonosLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // máximo 50 requests por ventana (más restrictivo)
    message: {
        error: 'Demasiadas solicitudes a abonos. Inténtelo de nuevo más tarde.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter para operaciones de importación/exportación
 */
const importExportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // máximo 20 operaciones de import/export por hora
    message: {
        error: 'Demasiadas operaciones de importación/exportación. Inténtelo de nuevo más tarde.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    limiter,
    loginLimiter,
    facturasLimiter,
    proformasLimiter,
    abonosLimiter,
    importExportLimiter
};



