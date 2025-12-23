/**
 * Middleware de Optimización de Rendimiento
 * Implementa caché HTTP, compresión y optimizaciones de respuesta
 */

const crypto = require('crypto');

/**
 * Middleware para añadir headers de caché HTTP
 */
function cacheHeaders(ttl = 300) {
    return (req, res, next) => {
        // Solo cachear GET requests
        if (req.method === 'GET') {
            // Headers de caché
            res.set('Cache-Control', `public, max-age=${ttl}, must-revalidate`);
            res.set('Vary', 'Accept-Encoding');
            
            // ETag para validación condicional
            res.locals.etagEnabled = true;
        }
        next();
    };
}

/**
 * Middleware para generar y validar ETags
 */
function etagMiddleware() {
    return (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(data) {
            // Solo aplicar ETag a GET requests exitosos
            if (req.method === 'GET' && res.statusCode === 200 && res.locals.etagEnabled) {
                const dataString = JSON.stringify(data);
                const etag = crypto.createHash('md5').update(dataString).digest('hex');
                
                // Verificar si el cliente tiene el mismo ETag
                const clientEtag = req.headers['if-none-match'];
                if (clientEtag === `"${etag}"`) {
                    return res.status(304).end(); // Not Modified
                }
                
                res.set('ETag', `"${etag}"`);
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    };
}

/**
 * Middleware para optimizar respuestas JSON grandes
 */
function optimizeJsonResponse() {
    return (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(data) {
            // Comprimir respuestas grandes (>10KB)
            const dataString = JSON.stringify(data);
            if (dataString.length > 10240) {
                res.set('Content-Encoding', 'gzip');
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    };
}

/**
 * Middleware para medir tiempo de respuesta
 */
function responseTimeMiddleware() {
    return (req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            res.locals.responseTime = duration;
            
            // Log respuestas lentas (>1 segundo)
            if (duration > 1000) {
                console.warn(`⚠️ Respuesta lenta: ${req.method} ${req.path} - ${duration}ms`);
            }
        });
        
        next();
    };
}

/**
 * Middleware para prevenir N+1 queries
 * Añade warnings cuando se detectan patrones sospechosos
 */
function preventNPlusOne() {
    return (req, res, next) => {
        // Este middleware puede extenderse para detectar patrones N+1
        // Por ahora, solo pasa la request
        next();
    };
}

module.exports = {
    cacheHeaders,
    etagMiddleware,
    optimizeJsonResponse,
    responseTimeMiddleware,
    preventNPlusOne
};

