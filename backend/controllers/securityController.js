/**
 * Controlador de Seguridad
 * Maneja las peticiones HTTP relacionadas con estadísticas y reportes de seguridad
 */

class SecurityController {
    constructor(securityService) {
        this.securityService = securityService;
    }

    /**
     * GET /api/security/stats
     */
    getStats(req, res) {
        try {
            const stats = this.securityService.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/security/report
     */
    getReport(req, res) {
        try {
            const report = this.securityService.generateReport();
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/security/alerts
     */
    getAlerts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const alerts = this.securityService.getRecentAlerts(limit);
            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = SecurityController;


