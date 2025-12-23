const express = require('express');
const multer = require('multer');
const path = require('path');
const ImportExportController = require('../controllers/importExportController');

/**
 * Configurar multer para subida de archivos
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '..', 'temp');
        const fs = require('fs');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream'
        ];
        if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos Excel (.xlsx, .xls)'));
        }
    }
});

/**
 * Crear router de importar/exportar
 */
function createImportarExportarRouter(db, logger, importadorExcel) {
    const router = express.Router();
    const controller = new ImportExportController(db, logger, importadorExcel);

    // Rutas de importación (requieren upload)
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

module.exports = createImportarExportarRouter;


