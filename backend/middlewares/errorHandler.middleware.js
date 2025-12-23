/**
 * Middleware de manejo de errores centralizado
 * Debe ir al final de todas las rutas
 */
const errorHandler = (err, req, res, next) => {
    // Obtener logger si está disponible
    const logger = req.app.get('logger');
    
    // Log del error
    if (logger) {
        logger.error('Error no manejado en middleware', {
            error: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            body: req.method !== 'GET' && logger.sanitizeData 
                ? logger.sanitizeData(req.body) 
                : (req.method !== 'GET' ? req.body : null)
        }, 'error');
    }
    
    // Determinar código de estado
    const statusCode = err.statusCode || err.status || 500;
    
    // Respuesta de error
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor'
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;



