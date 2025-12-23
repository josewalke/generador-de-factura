/**
 * Helper para manejo consistente de errores
 * Proporciona funciones estandarizadas para manejar errores HTTP
 */

class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Maneja errores de base de datos
     * @param {Error} error - Error de base de datos
     * @param {Object} res - Objeto response de Express
     * @param {string} operation - Nombre de la operación que falló
     * @param {Object} context - Contexto adicional
     */
    handleDatabaseError(error, res, operation, context = {}) {
        const errorMessage = `Error en ${operation}`;
        
        if (this.logger) {
            this.logger.error(errorMessage, {
                error: error.message,
                stack: error.stack,
                ...context
            }, 'database');
        } else {
            console.error(`❌ ${errorMessage}:`, error.message, context);
        }

        // Determinar código de estado HTTP apropiado
        let statusCode = 500;
        let message = 'Error interno del servidor';

        if (error.message.includes('UNIQUE constraint') || error.message.includes('duplicate')) {
            statusCode = 409;
            message = 'El registro ya existe';
        } else if (error.message.includes('FOREIGN KEY constraint')) {
            statusCode = 400;
            message = 'Referencia inválida';
        } else if (error.message.includes('NOT NULL constraint')) {
            statusCode = 400;
            message = 'Campos requeridos faltantes';
        }

        res.status(statusCode).json({
            success: false,
            error: message,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    /**
     * Maneja errores de validación
     * @param {Object} res - Objeto response de Express
     * @param {string} message - Mensaje de error
     * @param {string} field - Campo que falló la validación (opcional)
     */
    handleValidationError(res, message, field = null) {
        const response = {
            success: false,
            error: message
        };

        if (field) {
            response.field = field;
        }

        res.status(400).json(response);
    }

    /**
     * Maneja errores de recurso no encontrado
     * @param {Object} res - Objeto response de Express
     * @param {string} resource - Nombre del recurso
     * @param {string|number} id - ID del recurso (opcional)
     */
    handleNotFoundError(res, resource, id = null) {
        const message = id 
            ? `${resource} con ID ${id} no encontrado`
            : `${resource} no encontrado`;

        res.status(404).json({
            success: false,
            error: message
        });
    }

    /**
     * Maneja errores genéricos
     * @param {Error} error - Error
     * @param {Object} res - Objeto response de Express
     * @param {string} operation - Nombre de la operación
     * @param {Object} context - Contexto adicional
     */
    handleGenericError(error, res, operation, context = {}) {
        if (this.logger) {
            this.logger.error(`Error en ${operation}`, {
                error: error.message,
                stack: error.stack,
                ...context
            }, 'operations');
        } else {
            console.error(`❌ Error en ${operation}:`, error.message, context);
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = ErrorHandler;







