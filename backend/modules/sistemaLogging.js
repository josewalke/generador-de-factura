// Sistema de Logging Optimizado
const fs = require('fs');
const path = require('path');

class Logger {
    constructor(config) {
        this.config = config;
        this.logLevel = this.getLogLevel(config.logging.level);
        this.logFile = config.logging.file;
        this.maxSize = this.parseSize(config.logging.maxSize);
        this.maxFiles = config.logging.maxFiles;
        
        // Crear directorio de logs si no existe
        this.ensureLogDirectory();
        
        // Configurar niveles de log
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        // Configurar colores para consola
        this.colors = {
            error: '\x1b[31m', // Rojo
            warn: '\x1b[33m',  // Amarillo
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[37m', // Blanco
            reset: '\x1b[0m'
        };
    }

    getLogLevel(level) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        return levels[level] || 2;
    }

    parseSize(size) {
        const units = { b: 1, k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
        const match = size.match(/^(\d+)([bkmg])$/i);
        if (match) {
            return parseInt(match[1]) * units[match[2].toLowerCase()];
        }
        return 10 * 1024 * 1024; // 10MB por defecto
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.logLevel;
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    writeToFile(message) {
        try {
            // Verificar tamaño del archivo y rotar si es necesario
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.maxSize) {
                    this.rotateLogFile();
                }
            }
            
            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error('Error escribiendo al archivo de log:', error);
        }
    }

    rotateLogFile() {
        try {
            // Mover archivos existentes
            for (let i = this.maxFiles - 1; i > 0; i--) {
                const oldFile = `${this.logFile}.${i}`;
                const newFile = `${this.logFile}.${i + 1}`;
                
                if (fs.existsSync(oldFile)) {
                    if (i === this.maxFiles - 1) {
                        fs.unlinkSync(oldFile); // Eliminar el más antiguo
                    } else {
                        fs.renameSync(oldFile, newFile);
                    }
                }
            }
            
            // Mover archivo actual
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, `${this.logFile}.1`);
            }
        } catch (error) {
            console.error('Error rotando archivo de log:', error);
        }
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, meta);
        
        // Escribir a consola con colores
        const color = this.colors[level] || this.colors.reset;
        console.log(`${color}${formattedMessage}${this.colors.reset}`);
        
        // Escribir a archivo
        this.writeToFile(formattedMessage);
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // Métodos específicos para el sistema
    apiRequest(method, url, statusCode, responseTime) {
        if (this.shouldLog('info')) {
            const level = statusCode >= 400 ? 'warn' : 'info';
            this.log(level, `${method} ${url} - ${statusCode} (${responseTime}ms)`);
        }
    }

    databaseQuery(query, duration, rowCount) {
        if (this.shouldLog('debug')) {
            const level = duration > 1000 ? 'warn' : 'debug';
            this.log(level, `DB Query: ${duration}ms, ${rowCount} rows`, { query: query.substring(0, 100) });
        }
    }

    cacheOperation(operation, key, hit = null) {
        if (this.shouldLog('debug')) {
            const message = hit !== null ? 
                `Cache ${operation}: ${key} (${hit ? 'HIT' : 'MISS'})` : 
                `Cache ${operation}: ${key}`;
            this.log('debug', message);
        }
    }

    performanceMetric(metric, value, unit = 'ms') {
        if (this.shouldLog('info')) {
            this.log('info', `Performance: ${metric} = ${value}${unit}`);
        }
    }

    systemEvent(event, details = {}) {
        this.log('info', `System: ${event}`, details);
    }

    securityEvent(event, details = {}) {
        this.log('warn', `Security: ${event}`, details);
    }
}

// Logger específico para desarrollo (menos verboso)
class DevelopmentLogger extends Logger {
    constructor(config) {
        super(config);
        this.logLevel = 1; // Solo error y warn en desarrollo
    }

    // Reducir logs de API en desarrollo
    apiRequest(method, url, statusCode, responseTime) {
        if (statusCode >= 400) {
            this.log('warn', `${method} ${url} - ${statusCode} (${responseTime}ms)`);
        }
    }

    // Reducir logs de caché en desarrollo
    cacheOperation(operation, key, hit = null) {
        // Solo logear misses importantes
        if (operation === 'get' && hit === false && key.includes('empresas:all')) {
            this.log('debug', `Cache MISS: ${key}`);
        }
    }

    // Reducir logs de BD en desarrollo
    databaseQuery(query, duration, rowCount) {
        if (duration > 500) { // Solo queries lentas
            this.log('warn', `Slow DB Query: ${duration}ms, ${rowCount} rows`);
        }
    }
}

// Factory para crear logger según entorno
class LoggerFactory {
    static create(config) {
        const environment = config.server.environment || 'development';
        
        if (environment === 'development') {
            return new DevelopmentLogger(config);
        } else {
            return new Logger(config);
        }
    }
}

module.exports = { Logger, DevelopmentLogger, LoggerFactory };

