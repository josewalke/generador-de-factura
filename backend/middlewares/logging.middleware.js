/**
 * Middleware de logging optimizado con monitoreo de seguridad
 */
const loggingMiddleware = (logger, securityMonitor) => {
    return (req, res, next) => {
        const start = Date.now();
        
        // Log de inicio de petición
        if (logger) {
            logger.debug(`Incoming request: ${req.method} ${req.url}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                query: req.query,
                body: req.method !== 'GET' ? logger.sanitizeData(req.body) : null
            }, 'api');
        }
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            
            // Log detallado de la petición
            if (logger) {
                logger.apiRequest(req.method, req.url, res.statusCode, duration, req);
            }
            
            // Registrar en monitoreo de seguridad
            if (securityMonitor) {
                securityMonitor.logHTTPRequest(req, duration, res.statusCode);
            }
            
            // Detectar códigos de error
            if (res.statusCode >= 400 && logger) {
                logger.error(`HTTP Error ${res.statusCode}: ${req.method} ${req.url}`, {
                    statusCode: res.statusCode,
                    url: req.url,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    duration: `${duration}ms`,
                    query: req.query,
                    body: req.method !== 'GET' ? logger.sanitizeData(req.body) : null
                }, 'api');
                
                if (securityMonitor) {
                    securityMonitor.logSecurityEvent('http_error', {
                        statusCode: res.statusCode,
                        url: req.url,
                        method: req.method,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    }, res.statusCode >= 500 ? 'high' : 'medium');
                }
            }
        });
        
        next();
    };
};

module.exports = loggingMiddleware;



