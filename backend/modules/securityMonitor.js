const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class SecurityMonitor {
    constructor() {
        this.logPath = path.join(__dirname, '..', 'logs', 'security.log');
        this.alertsPath = path.join(__dirname, '..', 'logs', 'security-alerts.log');
        this.statsPath = path.join(__dirname, '..', 'logs', 'security-stats.json');
        
        this.stats = {
            totalRequests: 0,
            failedLogins: 0,
            blockedRequests: 0,
            suspiciousActivity: 0,
            lastReset: new Date().toISOString(),
            hourlyStats: {},
            dailyStats: {}
        };

        this.thresholds = {
            maxFailedLogins: 5, // Por hora
            maxRequestsPerMinute: 100,
            suspiciousPatterns: [
                'sql injection',
                'xss',
                'path traversal',
                'command injection'
            ]
        };

        this.initializeLogging();
        this.loadStats();
    }

    /**
     * Inicializar sistema de logging
     */
    initializeLogging() {
        try {
            // Crear directorio de logs si no existe
            const logDir = path.dirname(this.logPath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // Crear archivos de log si no existen
            if (!fs.existsSync(this.logPath)) {
                fs.writeFileSync(this.logPath, '');
            }
            if (!fs.existsSync(this.alertsPath)) {
                fs.writeFileSync(this.alertsPath, '');
            }

            console.log('✅ Sistema de monitoreo de seguridad inicializado');
        } catch (error) {
            console.error('❌ Error inicializando monitoreo de seguridad:', error);
        }
    }

    /**
     * Cargar estadísticas desde archivo
     */
    loadStats() {
        try {
            if (fs.existsSync(this.statsPath)) {
                const statsData = fs.readFileSync(this.statsPath, 'utf8');
                this.stats = { ...this.stats, ...JSON.parse(statsData) };
            }
        } catch (error) {
            console.error('Error cargando estadísticas de seguridad:', error);
        }
    }

    /**
     * Guardar estadísticas en archivo
     */
    saveStats() {
        try {
            fs.writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('Error guardando estadísticas de seguridad:', error);
        }
    }

    /**
     * Registrar evento de seguridad
     * @param {string} event - Tipo de evento
     * @param {Object} data - Datos del evento
     * @param {string} severity - Severidad (low, medium, high, critical)
     */
    logSecurityEvent(event, data, severity = 'medium') {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                event,
                severity,
                data,
                ip: data.ip || 'unknown',
                userAgent: data.userAgent || 'unknown',
                userId: data.userId || null
            };

            // Escribir en log principal
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logPath, logLine);

            // Si es crítico o alto, escribir en alertas
            if (severity === 'critical' || severity === 'high') {
                fs.appendFileSync(this.alertsPath, logLine);
                this.sendAlert(logEntry);
            }

            // Actualizar estadísticas
            this.updateStats(event, severity);

            console.log(`🔒 [${severity.toUpperCase()}] ${event}:`, data);
        } catch (error) {
            console.error('Error registrando evento de seguridad:', error);
        }
    }

    /**
     * Registrar intento de login fallido
     * @param {string} username - Nombre de usuario
     * @param {string} ip - Dirección IP
     * @param {string} userAgent - User Agent
     */
    logFailedLogin(username, ip, userAgent) {
        this.logSecurityEvent('failed_login', {
            username,
            ip,
            userAgent
        }, 'high');

        // Verificar si excede el límite
        const hourlyFailed = this.getHourlyStats('failedLogins');
        if (hourlyFailed >= this.thresholds.maxFailedLogins) {
            this.logSecurityEvent('brute_force_attempt', {
                username,
                ip,
                userAgent,
                attempts: hourlyFailed
            }, 'critical');
        }
    }

    /**
     * Registrar actividad sospechosa
     * @param {string} pattern - Patrón detectado
     * @param {Object} request - Datos de la request
     */
    logSuspiciousActivity(pattern, request) {
        this.logSecurityEvent('suspicious_activity', {
            pattern,
            url: request.url,
            method: request.method,
            ip: request.ip,
            userAgent: request.userAgent,
            body: request.body ? JSON.stringify(request.body).substring(0, 200) : null
        }, 'high');
    }

    /**
     * Registrar acceso denegado
     * @param {Object} request - Datos de la request
     * @param {string} reason - Razón del bloqueo
     */
    logBlockedAccess(request, reason) {
        this.logSecurityEvent('blocked_access', {
            reason,
            url: request.url,
            method: request.method,
            ip: request.ip,
            userAgent: request.userAgent
        }, 'medium');
    }

    /**
     * Registrar request HTTP
     * @param {Object} request - Datos de la request
     * @param {number} responseTime - Tiempo de respuesta
     * @param {number} statusCode - Código de estado
     */
    logHTTPRequest(request, responseTime, statusCode) {
        this.stats.totalRequests++;

        // Detectar patrones sospechosos
        this.detectSuspiciousPatterns(request);

        // Verificar rate limiting
        if (this.isRateLimitExceeded(request.ip)) {
            this.logSecurityEvent('rate_limit_exceeded', {
                ip: request.ip,
                url: request.url,
                userAgent: request.userAgent
            }, 'medium');
        }

        // Log de requests lentas
        if (responseTime > 5000) { // Más de 5 segundos
            this.logSecurityEvent('slow_request', {
                url: request.url,
                responseTime,
                ip: request.ip
            }, 'low');
        }
    }

    /**
     * Detectar patrones sospechosos en la request
     * @param {Object} request - Datos de la request
     */
    detectSuspiciousPatterns(request) {
        const suspiciousPatterns = [
            { pattern: /union.*select/i, name: 'SQL Injection' },
            { pattern: /<script.*>/i, name: 'XSS Attack' },
            { pattern: /\.\.\//g, name: 'Path Traversal' },
            { pattern: /;.*rm.*-rf/i, name: 'Command Injection' },
            { pattern: /eval\(/i, name: 'Code Injection' }
        ];

        const searchText = `${request.url} ${JSON.stringify(request.query || {})} ${JSON.stringify(request.body || {})}`;

        suspiciousPatterns.forEach(({ pattern, name }) => {
            if (pattern.test(searchText)) {
                this.logSuspiciousActivity(name, request);
            }
        });
    }

    /**
     * Verificar si se excede el rate limit
     * @param {string} ip - Dirección IP
     * @returns {boolean} True si se excede
     */
    isRateLimitExceeded(ip) {
        const now = new Date();
        const minute = now.getMinutes();
        const hour = now.getHours();
        const day = now.getDate();

        // Implementar lógica de rate limiting por IP
        // Por simplicidad, aquí solo verificamos estadísticas generales
        return this.stats.totalRequests > this.thresholds.maxRequestsPerMinute;
    }

    /**
     * Enviar alerta de seguridad
     * @param {Object} logEntry - Entrada del log
     */
    sendAlert(logEntry) {
        try {
            // En una implementación real, aquí se enviarían emails, SMS, etc.
            console.log(`🚨 ALERTA DE SEGURIDAD [${logEntry.severity.toUpperCase()}]:`, {
                event: logEntry.event,
                timestamp: logEntry.timestamp,
                ip: logEntry.ip,
                data: logEntry.data
            });

            // Guardar alerta en archivo separado
            const alertData = {
                timestamp: logEntry.timestamp,
                severity: logEntry.severity,
                event: logEntry.event,
                message: `Alerta de seguridad: ${logEntry.event}`,
                data: logEntry.data
            };

            fs.appendFileSync(this.alertsPath, JSON.stringify(alertData) + '\n');
        } catch (error) {
            console.error('Error enviando alerta:', error);
        }
    }

    /**
     * Actualizar estadísticas
     * @param {string} event - Tipo de evento
     * @param {string} severity - Severidad
     */
    updateStats(event, severity) {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDate();

        // Estadísticas por hora
        if (!this.stats.hourlyStats[hour]) {
            this.stats.hourlyStats[hour] = {};
        }
        if (!this.stats.hourlyStats[hour][event]) {
            this.stats.hourlyStats[hour][event] = 0;
        }
        this.stats.hourlyStats[hour][event]++;

        // Estadísticas por día
        if (!this.stats.dailyStats[day]) {
            this.stats.dailyStats[day] = {};
        }
        if (!this.stats.dailyStats[day][event]) {
            this.stats.dailyStats[day][event] = 0;
        }
        this.stats.dailyStats[day][event]++;

        // Contadores generales
        if (event === 'failed_login') {
            this.stats.failedLogins++;
        } else if (event === 'blocked_access') {
            this.stats.blockedRequests++;
        } else if (event === 'suspicious_activity') {
            this.stats.suspiciousActivity++;
        }

        // Guardar estadísticas
        this.saveStats();
    }

    /**
     * Obtener estadísticas por hora
     * @param {string} event - Tipo de evento
     * @returns {number} Cantidad de eventos
     */
    getHourlyStats(event) {
        const now = new Date();
        const hour = now.getHours();
        
        if (!this.stats.hourlyStats[hour]) {
            return 0;
        }
        
        return this.stats.hourlyStats[hour][event] || 0;
    }

    /**
     * Obtener estadísticas generales
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.stats,
            thresholds: this.thresholds,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Generar reporte de seguridad
     * @returns {Object} Reporte
     */
    generateSecurityReport() {
        const now = new Date();
        const last24Hours = this.getLast24HoursStats();
        
        return {
            timestamp: now.toISOString(),
            summary: {
                totalRequests: this.stats.totalRequests,
                failedLogins: this.stats.failedLogins,
                blockedRequests: this.stats.blockedRequests,
                suspiciousActivity: this.stats.suspiciousActivity
            },
            last24Hours,
            alerts: this.getRecentAlerts(10),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Obtener estadísticas de las últimas 24 horas
     * @returns {Object} Estadísticas
     */
    getLast24HoursStats() {
        const now = new Date();
        const stats = {
            requests: 0,
            failedLogins: 0,
            blockedRequests: 0,
            suspiciousActivity: 0
        };

        for (let i = 0; i < 24; i++) {
            const hour = (now.getHours() - i + 24) % 24;
            if (this.stats.hourlyStats[hour]) {
                Object.keys(stats).forEach(key => {
                    stats[key] += this.stats.hourlyStats[hour][key] || 0;
                });
            }
        }

        return stats;
    }

    /**
     * Obtener alertas recientes
     * @param {number} limit - Límite de alertas
     * @returns {Array} Lista de alertas
     */
    getRecentAlerts(limit = 10) {
        try {
            if (!fs.existsSync(this.alertsPath)) {
                return [];
            }

            const alerts = fs.readFileSync(this.alertsPath, 'utf8')
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);

            return alerts;
        } catch (error) {
            console.error('Error obteniendo alertas recientes:', error);
            return [];
        }
    }

    /**
     * Generar recomendaciones de seguridad
     * @returns {Array} Lista de recomendaciones
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.stats.failedLogins > 10) {
            recommendations.push({
                type: 'high',
                message: 'Alto número de intentos de login fallidos. Considerar implementar bloqueo temporal de IPs.'
            });
        }

        if (this.stats.suspiciousActivity > 5) {
            recommendations.push({
                type: 'medium',
                message: 'Actividad sospechosa detectada. Revisar logs de seguridad.'
            });
        }

        if (this.stats.totalRequests > 10000) {
            recommendations.push({
                type: 'low',
                message: 'Alto volumen de requests. Considerar optimizar rate limiting.'
            });
        }

        return recommendations;
    }

    /**
     * Limpiar logs antiguos
     * @param {number} days - Días a mantener
     */
    cleanupOldLogs(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // Implementar limpieza de logs antiguos
            console.log(`🧹 Limpiando logs anteriores a ${cutoffDate.toISOString()}`);
        } catch (error) {
            console.error('Error limpiando logs antiguos:', error);
        }
    }
}

module.exports = SecurityMonitor;






