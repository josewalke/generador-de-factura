/**
 * Helper para logging consistente
 * Proporciona funciones de logging estandarizadas para reemplazar console.log
 */

class LoggerHelper {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Log de información general
     * @param {string} message - Mensaje a loguear
     * @param {Object} context - Contexto adicional (opcional)
     */
    info(message, context = {}) {
        if (this.logger && this.logger.info) {
            this.logger.info(message, context, 'operations');
        } else {
            console.log(`ℹ️ ${message}`, context);
        }
    }

    /**
     * Log de error
     * @param {string} message - Mensaje de error
     * @param {Object} context - Contexto adicional (opcional)
     */
    error(message, context = {}) {
        if (this.logger && this.logger.error) {
            this.logger.error(message, context, 'operations');
        } else {
            console.error(`❌ ${message}`, context);
        }
    }

    /**
     * Log de advertencia
     * @param {string} message - Mensaje de advertencia
     * @param {Object} context - Contexto adicional (opcional)
     */
    warn(message, context = {}) {
        if (this.logger && this.logger.warn) {
            this.logger.warn(message, context, 'operations');
        } else {
            console.warn(`⚠️ ${message}`, context);
        }
    }

    /**
     * Log de debug
     * @param {string} message - Mensaje de debug
     * @param {Object} context - Contexto adicional (opcional)
     */
    debug(message, context = {}) {
        if (this.logger && this.logger.debug) {
            this.logger.debug(message, context, 'operations');
        } else {
            console.debug(`🔍 ${message}`, context);
        }
    }

    /**
     * Log de éxito
     * @param {string} message - Mensaje de éxito
     * @param {Object} context - Contexto adicional (opcional)
     */
    success(message, context = {}) {
        if (this.logger && this.logger.info) {
            this.logger.info(`✅ ${message}`, context, 'operations');
        } else {
            console.log(`✅ ${message}`, context);
        }
    }
}

module.exports = LoggerHelper;







