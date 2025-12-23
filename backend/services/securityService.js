/**
 * Servicio de Seguridad
 * Encapsula la lógica de negocio para estadísticas y reportes de seguridad
 */

class SecurityService {
    constructor(securityMonitor) {
        this.securityMonitor = securityMonitor;
    }

    /**
     * Obtener estadísticas de seguridad
     */
    getStats() {
        return this.securityMonitor.getStats();
    }

    /**
     * Generar reporte de seguridad
     */
    generateReport() {
        return this.securityMonitor.generateSecurityReport();
    }

    /**
     * Obtener alertas recientes
     */
    getRecentAlerts(limit = 10) {
        return this.securityMonitor.getRecentAlerts(limit);
    }
}

module.exports = SecurityService;


