const express = require('express');
const multer = require('multer');
const path = require('path');
const ImportExportController = require('../controllers/importExportController');
const { importExportLimiter } = require('../middlewares/rateLimiter.middleware');

/**
 * Crear router de importar/exportar
 */
function createImportExportRouter(db, logger, importadorExcel) {
    const router = express.Router();
    const controller = new ImportExportController(db, logger, importadorExcel);

    // Configurar multer para subida de archivos
    const uploadDir = path.join(__dirname, '..', 'temp');
    const upload = multer({
        dest: uploadDir,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/octet-stream'
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos Excel (.xlsx, .xls)'));
            }
        }
    });

    // Aplicar rate limiting a todas las rutas
    router.use(importExportLimiter);

    // Rutas de importación
    router.post('/importar/coches', upload.single('archivo'), controller.importarCoches);
    router.post('/importar/productos', upload.single('archivo'), controller.importarProductos);
    router.post('/importar/clientes', upload.single('archivo'), controller.importarClientes);
    router.get('/importar/plantilla/:tipo', controller.descargarPlantilla);

    // Rutas de exportación
    router.get('/exportar/coches', controller.exportarCoches);
    router.get('/exportar/productos', controller.exportarProductos);
    router.get('/exportar/clientes', controller.exportarClientes);

    return router;
}

module.exports = createImportExportRouter;



