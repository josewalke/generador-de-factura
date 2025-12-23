const helmet = require('helmet');
const config = require('../config/config');

/**
 * Configuración de middleware de seguridad Helmet
 */
const securityMiddleware = () => {
    if (!config.get('security.helmet')) {
        return (req, res, next) => next();
    }

    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:", "http:"], // Permitir conexiones HTTPS y HTTP
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000, // 1 año
            includeSubDomains: true,
            preload: true
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    });
};

module.exports = securityMiddleware;



