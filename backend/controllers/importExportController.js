const path = require('path');
const fs = require('fs');
const ImportExportService = require('../services/importExportService');

class ImportExportController {
    constructor(db, logger, importadorExcel) {
        this.service = new ImportExportService(db, logger, importadorExcel);
        this.logger = logger;
    }

    /**
     * POST /api/importar/coches
     */
    importarCoches = async (req, res) => {
        const startTime = Date.now();
        
        try {
            this.logger.info('========== INICIO IMPORTACIÓN DE COCHES ==========');
            this.logger.info('Archivo recibido', {
                originalname: req.file?.originalname,
                filename: req.file?.filename,
                path: req.file?.path,
                size: req.file?.size,
                mimetype: req.file?.mimetype
            });
            
            if (!req.file) {
                this.logger.warn('No se proporcionó ningún archivo');
                return res.status(400).json({
                    success: false,
                    error: 'No se ha proporcionado ningún archivo'
                });
            }

            const resultado = await this.service.importarCoches(req.file.path);
            
            // Limpiar archivo temporal
            try {
                fs.unlinkSync(req.file.path);
                this.logger.debug('Archivo temporal eliminado');
            } catch (unlinkError) {
                this.logger.warn('Error al eliminar archivo temporal', { error: unlinkError.message });
            }
            
            this.logger.info('========== FIN IMPORTACIÓN DE COCHES ==========');
            
            res.json(resultado);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error importando coches desde Excel', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
                filename: req.file?.originalname
            });
            
            // Limpiar archivo temporal en caso de error
            if (req.file?.path) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    this.logger.warn('Error al eliminar archivo temporal después de error', { error: unlinkError.message });
                }
            }
            
            res.status(500).json({
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    };

    /**
     * POST /api/importar/productos
     */
    importarProductos = async (req, res) => {
        const startTime = Date.now();
        
        try {
            if (!req.file) {
                this.logger.warn('Intento de importar productos sin archivo', {}, 'operations');
                return res.status(400).json({
                    success: false,
                    error: 'No se ha proporcionado ningún archivo'
                });
            }

            this.logger.info('Iniciando importación de productos desde Excel', {
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }, 'operations');

            const resultado = await this.service.importarProductos(req.file.path);
            
            // Limpiar archivo temporal
            fs.unlinkSync(req.file.path);
            this.logger.debug('Archivo temporal eliminado', { filename: req.file.originalname }, 'operations');
            
            res.json(resultado);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error importando productos desde Excel', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
                filename: req.file?.originalname
            }, 'operations');
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * POST /api/importar/clientes
     */
    importarClientes = async (req, res) => {
        const startTime = Date.now();
        
        try {
            if (!req.file) {
                this.logger.warn('Intento de importar clientes sin archivo', {}, 'operations');
                return res.status(400).json({
                    success: false,
                    error: 'No se ha proporcionado ningún archivo'
                });
            }

            this.logger.info('Iniciando importación de clientes desde Excel', {
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }, 'operations');

            const resultado = await this.service.importarClientes(req.file.path);
            
            // Limpiar archivo temporal
            fs.unlinkSync(req.file.path);
            this.logger.debug('Archivo temporal eliminado', { filename: req.file.originalname }, 'operations');
            
            res.json(resultado);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error importando clientes desde Excel', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`,
                filename: req.file?.originalname
            }, 'operations');
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * GET /api/importar/plantilla/:tipo
     */
    descargarPlantilla = async (req, res) => {
        try {
            const { tipo } = req.params;
            const fileName = `plantilla_${tipo}.xlsx`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);
            
            this.service.generarPlantilla(tipo, filePath);
            
            // Enviar archivo
            res.download(filePath, fileName, (err) => {
                if (err) {
                    this.logger.error('Error enviando plantilla', { error: err.message });
                }
                // Limpiar archivo temporal
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        } catch (error) {
            this.logger.error('Error generando plantilla', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message || 'Error generando plantilla'
            });
        }
    };

    /**
     * GET /api/exportar/coches
     */
    exportarCoches = async (req, res) => {
        try {
            const timestamp = Date.now();
            const fileName = `coches_export_${timestamp}.xlsx`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);
            
            // Obtener filtros de la query string
            const filtros = {
                modelo: req.query.modelo,
                color: req.query.color,
                kmsMin: req.query.kmsMin ? parseInt(req.query.kmsMin) : null,
                kmsMax: req.query.kmsMax ? parseInt(req.query.kmsMax) : null
            };
            
            const resultado = await this.service.exportarCoches(filePath, filtros);
            
            if (resultado.success) {
                res.download(filePath, fileName, (err) => {
                    if (err) {
                        this.logger.error('Error enviando archivo de exportación', { error: err.message });
                    }
                    // Limpiar archivo temporal después de enviarlo
                    setTimeout(() => {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: resultado.error
                });
            }
        } catch (error) {
            this.logger.error('Error exportando coches', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * GET /api/exportar/productos
     */
    exportarProductos = async (req, res) => {
        try {
            const timestamp = Date.now();
            const fileName = `productos_export_${timestamp}.xlsx`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);
            
            const filtros = {
                codigo: req.query.codigo,
                descripcion: req.query.descripcion,
                precioMin: req.query.precioMin ? parseFloat(req.query.precioMin) : null,
                precioMax: req.query.precioMax ? parseFloat(req.query.precioMax) : null
            };
            
            const resultado = await this.service.exportarProductos(filePath, filtros);
            
            if (resultado.success) {
                res.download(filePath, fileName, (err) => {
                    if (err) {
                        this.logger.error('Error enviando archivo de exportación', { error: err.message });
                    }
                    setTimeout(() => {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: resultado.error
                });
            }
        } catch (error) {
            this.logger.error('Error exportando productos', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * GET /api/exportar/clientes
     */
    exportarClientes = async (req, res) => {
        try {
            const timestamp = Date.now();
            const fileName = `clientes_export_${timestamp}.xlsx`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);
            
            const filtros = {
                nombre: req.query.nombre,
                identificacion: req.query.identificacion,
                email: req.query.email
            };
            
            const resultado = await this.service.exportarClientes(filePath, filtros);
            
            if (resultado.success) {
                res.download(filePath, fileName, (err) => {
                    if (err) {
                        this.logger.error('Error enviando archivo de exportación', { error: err.message });
                    }
                    setTimeout(() => {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }, 5000);
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: resultado.error
                });
            }
        } catch (error) {
            this.logger.error('Error exportando clientes', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
}

module.exports = ImportExportController;



