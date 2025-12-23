/**
 * Controlador de Logs de Seguridad
 * Maneja las peticiones HTTP relacionadas con logs de seguridad
 */

class LogsSeguridadController {
    constructor(logsSeguridadService) {
        this.logsSeguridadService = logsSeguridadService;
    }

    /**
     * GET /api/logs-seguridad
     */
    async getLogs(req, res) {
        try {
            const filtros = req.query;
            const logs = await this.logsSeguridadService.getLogs(filtros);
            res.json({ success: true, data: logs });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/logs-seguridad/estadisticas
     */
    async getEstadisticas(req, res) {
        try {
            const { fechaDesde, fechaHasta } = req.query;
            const estadisticas = await this.logsSeguridadService.getEstadisticas(fechaDesde, fechaHasta);
            res.json({ success: true, data: estadisticas });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/logs-seguridad/verificar-integridad
     */
    async verificarIntegridad(req, res) {
        try {
            const resultado = await this.logsSeguridadService.verificarIntegridad();
            res.json({ success: true, data: resultado });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = LogsSeguridadController;


