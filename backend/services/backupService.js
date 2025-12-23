const path = require('path');

class BackupService {
    constructor(sistemaBackup, logger) {
        this.sistemaBackup = sistemaBackup;
        this.logger = logger;
    }

    /**
     * Listar backups disponibles
     */
    listarBackups() {
        try {
            return this.sistemaBackup.listarBackups();
        } catch (error) {
            this.logger.error('Error al listar backups', { error: error.message });
            throw error;
        }
    }

    /**
     * Realizar backup manual
     */
    async realizarBackup() {
        try {
            return await this.sistemaBackup.realizarBackup();
        } catch (error) {
            this.logger.error('Error al realizar backup', { error: error.message });
            throw error;
        }
    }

    /**
     * Restaurar desde backup
     */
    async restaurarBackup(archivo) {
        try {
            if (!archivo) {
                throw new Error('Archivo de backup requerido');
            }
            
            const resultado = await this.sistemaBackup.restaurarBackup(archivo);
            return { restaurado: resultado, archivo };
        } catch (error) {
            this.logger.error('Error al restaurar backup', { error: error.message, archivo });
            throw error;
        }
    }

    /**
     * Verificar integridad de backup
     */
    async verificarIntegridadBackup(archivo) {
        try {
            const rutaBackup = path.join('./backups', archivo);
            const integridadValida = await this.sistemaBackup.verificarIntegridadBackup(rutaBackup);
            
            return { 
                archivo,
                integridadValida,
                mensaje: integridadValida ? 'Backup válido e íntegro' : 'Backup alterado o corrupto'
            };
        } catch (error) {
            this.logger.error('Error al verificar integridad de backup', { error: error.message, archivo });
            throw error;
        }
    }
}

module.exports = BackupService;

