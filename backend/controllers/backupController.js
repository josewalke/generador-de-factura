const BackupService = require('../services/backupService');
const ErrorHandler = require('../utils/errorHandler');

class BackupController {
    constructor(sistemaBackup, logger) {
        this.service = new BackupService(sistemaBackup, logger);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/backup/listar
     */
    listar = (req, res) => {
        try {
            const backups = this.service.listarBackups();
            res.json({
                success: true,
                data: backups
            });
        } catch (error) {
            this.logger.error('Error al listar backups', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'listar backups');
        }
    };

    /**
     * POST /api/backup/realizar
     */
    realizar = async (req, res) => {
        try {
            const resultado = await this.service.realizarBackup();
            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error al realizar backup', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'realizar backup');
        }
    };

    /**
     * POST /api/backup/restaurar
     */
    restaurar = async (req, res) => {
        try {
            const { archivo } = req.body;
            const resultado = await this.service.restaurarBackup(archivo);
            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error al restaurar backup', { error: error.message, archivo: req.body.archivo });
            
            if (error.message === 'Archivo de backup requerido') {
                res.status(400).json({ error: error.message });
            } else {
                this.errorHandler.handleGenericError(error, res, 'restaurar backup');
            }
        }
    };

    /**
     * GET /api/backup/verificar/:archivo
     */
    verificarIntegridad = async (req, res) => {
        try {
            const { archivo } = req.params;
            const resultado = await this.service.verificarIntegridadBackup(archivo);
            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error al verificar integridad de backup', { error: error.message, archivo: req.params.archivo });
            this.errorHandler.handleGenericError(error, res, 'verificar integridad de backup');
        }
    };
}

module.exports = BackupController;

