// Sistema de Logging Completo y Detallado
const fs = require('fs');
const path = require('path');

class Logger {
    constructor(config) {
        this.config = config;
        this.logLevel = this.getLogLevel(config.logging.level);
        this.logFile = config.logging.file;
        this.maxSize = this.parseSize(config.logging.maxSize);
        this.maxFiles = config.logging.maxFiles;
        
        // Archivos de log separados por categoría
        this.logDir = path.dirname(this.logFile);
        this.logFiles = {
            general: this.logFile,
            access: path.join(this.logDir, 'access.log'),
            error: path.join(this.logDir, 'error.log'),
            operations: path.join(this.logDir, 'operations.log'),
            security: path.join(this.logDir, 'security.log'),
            database: path.join(this.logDir, 'database.log'),
            cache: path.join(this.logDir, 'cache.log'),
            api: path.join(this.logDir, 'api.log')
        };
        
        // Crear directorio de logs si no existe
        this.ensureLogDirectory();
        
        // Configurar niveles de log
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };
        
        // Configurar colores para consola
        this.colors = {
            error: '\x1b[31m', // Rojo
            warn: '\x1b[33m',  // Amarillo
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[37m', // Blanco
            trace: '\x1b[90m', // Gris
            reset: '\x1b[0m',
            success: '\x1b[32m' // Verde
        };
        
        // Estadísticas de logging
        this.stats = {
            total: 0,
            byLevel: { error: 0, warn: 0, info: 0, debug: 0, trace: 0 },
            byCategory: {}
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

    formatMessage(level, message, meta = {}, category = 'general') {
        const timestamp = new Date().toISOString();
        const processId = process.pid;
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        
        // Formato estructurado con más información
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            category,
            pid: processId,
            memory: `${memoryMB}MB`,
            message,
            ...meta
        };
        
        // Formato legible para archivo
        const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] [${category.toUpperCase()}] [PID:${processId}] [MEM:${memoryMB}MB] ${message}${metaStr}`;
    }

    writeToFile(message, category = 'general') {
        try {
            const logFilePath = this.logFiles[category] || this.logFile;
            
            // Verificar tamaño del archivo y rotar si es necesario
            if (fs.existsSync(logFilePath)) {
                const stats = fs.statSync(logFilePath);
                if (stats.size > this.maxSize) {
                    this.rotateLogFile(category);
                }
            }
            
            fs.appendFileSync(logFilePath, message + '\n');
            
            // Actualizar estadísticas
            this.stats.total++;
            const level = message.match(/\[(\w+)\]/)?.[1]?.toLowerCase() || 'info';
            if (this.stats.byLevel[level] !== undefined) {
                this.stats.byLevel[level]++;
            }
            this.stats.byCategory[category] = (this.stats.byCategory[category] || 0) + 1;
        } catch (error) {
            console.error('Error escribiendo al archivo de log:', error);
        }
    }

    rotateLogFile(category = 'general') {
        try {
            const logFilePath = this.logFiles[category] || this.logFile;
            
            // Mover archivos existentes
            for (let i = this.maxFiles - 1; i > 0; i--) {
                const oldFile = `${logFilePath}.${i}`;
                const newFile = `${logFilePath}.${i + 1}`;
                
                if (fs.existsSync(oldFile)) {
                    if (i === this.maxFiles - 1) {
                        fs.unlinkSync(oldFile); // Eliminar el más antiguo
                    } else {
                        fs.renameSync(oldFile, newFile);
                    }
                }
            }
            
            // Mover archivo actual
            if (fs.existsSync(logFilePath)) {
                fs.renameSync(logFilePath, `${logFilePath}.1`);
                this.info(`Archivo de log rotado: ${category}`, { category });
            }
        } catch (error) {
            console.error('Error rotando archivo de log:', error);
        }
    }

    log(level, message, meta = {}, category = 'general') {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, meta, category);
        
        // Escribir a consola con colores
        const color = this.colors[level] || this.colors.reset;
        console.log(`${color}${formattedMessage}${this.colors.reset}`);
        
        // Escribir a archivo general
        this.writeToFile(formattedMessage, 'general');
        
        // Escribir también a archivo específico según categoría
        if (category !== 'general' && this.logFiles[category]) {
            this.writeToFile(formattedMessage, category);
        }
        
        // Los errores siempre van al archivo de errores
        if (level === 'error') {
            this.writeToFile(formattedMessage, 'error');
        }
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
    
    // Logs de API con información detallada
    apiRequest(method, url, statusCode, responseTime, req = {}) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        const meta = {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get?.('user-agent') || req.headers?.['user-agent'] || 'unknown',
            userId: req.user?.id || req.userId || null,
            timestamp: new Date().toISOString()
        };
        
        // Log detallado
        this.log(level, `API ${method} ${url} - ${statusCode} (${responseTime}ms)`, meta, 'api');
        
        // También log de acceso
        this.log('info', `${method} ${url}`, meta, 'access');
    }

    // Logs de base de datos detallados
    databaseQuery(query, duration, rowCount, params = null) {
        const level = duration > 2000 ? 'error' : duration > 1000 ? 'warn' : 'debug';
        const meta = {
            query: query.substring(0, 200),
            duration: `${duration}ms`,
            rowCount,
            params: params ? JSON.stringify(params).substring(0, 200) : null,
            slow: duration > 1000
        };
        
        this.log(level, `DB Query: ${duration}ms, ${rowCount} rows`, meta, 'database');
    }

    // Logs de caché detallados
    cacheOperation(operation, key, hit = null, ttl = null) {
        const message = hit !== null ? 
            `Cache ${operation}: ${key} (${hit ? 'HIT' : 'MISS'})` : 
            `Cache ${operation}: ${key}`;
        
        const meta = {
            operation,
            key,
            hit,
            ttl: ttl ? `${ttl}ms` : null
        };
        
        this.log('debug', message, meta, 'cache');
    }

    // Métricas de rendimiento
    performanceMetric(metric, value, unit = 'ms', details = {}) {
        const meta = { metric, value, unit, ...details };
        this.log('info', `Performance: ${metric} = ${value}${unit}`, meta);
    }

    // Eventos del sistema
    systemEvent(event, details = {}) {
        this.log('info', `System: ${event}`, details, 'operations');
    }

    // Eventos de seguridad
    securityEvent(event, details = {}, severity = 'medium') {
        const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
        const meta = { ...details, severity };
        this.log(level, `Security: ${event}`, meta, 'security');
    }

    // Logs de operaciones CRUD
    operationCreate(entity, id, data = {}) {
        const meta = { entity, id, operation: 'CREATE', data: this.sanitizeData(data) };
        this.log('info', `Created ${entity} #${id}`, meta, 'operations');
    }

    operationUpdate(entity, id, changes = {}) {
        const meta = { entity, id, operation: 'UPDATE', changes: this.sanitizeData(changes) };
        this.log('info', `Updated ${entity} #${id}`, meta, 'operations');
    }

    operationDelete(entity, id) {
        const meta = { entity, id, operation: 'DELETE' };
        this.log('info', `Deleted ${entity} #${id}`, meta, 'operations');
    }

    operationRead(entity, id = null, filters = {}) {
        const meta = { entity, id, operation: 'READ', filters: this.sanitizeData(filters) };
        this.log('debug', `Read ${entity}${id ? ` #${id}` : ''}`, meta, 'operations');
    }

    // Logs de autenticación
    authLogin(userId, username, success, reason = null) {
        const level = success ? 'info' : 'warn';
        const meta = { userId, username, success, reason, operation: 'LOGIN' };
        this.log(level, `Login attempt: ${username} - ${success ? 'SUCCESS' : 'FAILED'}`, meta, 'security');
    }

    authLogout(userId, username) {
        const meta = { userId, username, operation: 'LOGOUT' };
        this.log('info', `Logout: ${username}`, meta, 'security');
    }

    // Logs de importación/exportación
    importOperation(type, file, records, success, errors = []) {
        const level = success ? 'info' : 'error';
        const meta = { type, file, records, success, errors: errors.length };
        this.log(level, `Import ${type}: ${records} records - ${success ? 'SUCCESS' : 'FAILED'}`, meta, 'operations');
    }

    exportOperation(type, file, records) {
        const meta = { type, file, records, operation: 'EXPORT' };
        this.log('info', `Export ${type}: ${records} records`, meta, 'operations');
    }

    // Logs de facturación
    invoiceCreated(invoiceId, invoiceNumber, total, clientId) {
        const meta = { invoiceId, invoiceNumber, total, clientId, operation: 'INVOICE_CREATE' };
        this.log('info', `Invoice created: ${invoiceNumber} - Total: €${total}`, meta, 'operations');
    }

    invoiceUpdated(invoiceId, invoiceNumber, changes = {}) {
        const meta = { invoiceId, invoiceNumber, changes, operation: 'INVOICE_UPDATE' };
        this.log('info', `Invoice updated: ${invoiceNumber}`, meta, 'operations');
    }

    // Sanitizar datos sensibles antes de loguear
    sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sensitive = ['password', 'password_hash', 'token', 'secret', 'key', 'cvv', 'pin'];
        const sanitized = { ...data };
        
        for (const key in sanitized) {
            if (sensitive.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '***REDACTED***';
            }
        }
        
        return sanitized;
    }

    // Obtener estadísticas de logging
    getStats() {
        return {
            ...this.stats,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }

    // Limpiar logs antiguos
    cleanupOldLogs(daysToKeep = 30) {
        try {
            const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
            
            Object.values(this.logFiles).forEach(logFile => {
                for (let i = 1; i <= this.maxFiles; i++) {
                    const oldFile = `${logFile}.${i}`;
                    if (fs.existsSync(oldFile)) {
                        const stats = fs.statSync(oldFile);
                        if (stats.mtimeMs < cutoffDate) {
                            fs.unlinkSync(oldFile);
                            this.info(`Deleted old log file: ${oldFile}`);
                        }
                    }
                }
            });
        } catch (error) {
            this.error('Error cleaning up old logs', { error: error.message });
        }
    }
}

// Logger específico para desarrollo (más verboso para debugging)
class DevelopmentLogger extends Logger {
    constructor(config) {
        super(config);
        // En desarrollo, permitir todos los logs para debugging
        this.logLevel = 4; // trace level para ver todo
    }

    // En desarrollo, loguear todas las peticiones API
    apiRequest(method, url, statusCode, responseTime, req = {}) {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'debug';
        const meta = {
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.get?.('user-agent') || req.headers?.['user-agent'] || 'unknown'
        };
        this.log(level, `${method} ${url} - ${statusCode} (${responseTime}ms)`, meta, 'api');
    }

    // En desarrollo, loguear todas las queries de BD
    databaseQuery(query, duration, rowCount, params = null) {
        const level = duration > 1000 ? 'warn' : 'debug';
        const meta = {
            query: query.substring(0, 200),
            duration: `${duration}ms`,
            rowCount,
            params: params ? JSON.stringify(params).substring(0, 200) : null
        };
        this.log(level, `DB Query: ${duration}ms, ${rowCount} rows`, meta, 'database');
    }

    // En desarrollo, loguear todas las operaciones de caché
    cacheOperation(operation, key, hit = null, ttl = null) {
        const message = hit !== null ? 
            `Cache ${operation}: ${key} (${hit ? 'HIT' : 'MISS'})` : 
            `Cache ${operation}: ${key}`;
        const meta = { operation, key, hit, ttl: ttl ? `${ttl}ms` : null };
        this.log('debug', message, meta, 'cache');
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

