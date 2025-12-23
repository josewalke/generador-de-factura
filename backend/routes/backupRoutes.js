const express = require('express');
const BackupController = require('../controllers/backupController');

/**
 * Crear router de backup
 */
function createBackupRouter(sistemaBackup, logger) {
    const router = express.Router();
    const controller = new BackupController(sistemaBackup, logger);

    router.get('/listar', controller.listar);
    router.post('/realizar', controller.realizar);
    router.post('/restaurar', controller.restaurar);
    router.get('/verificar/:archivo', controller.verificarIntegridad);

    return router;
}

module.exports = createBackupRouter;

