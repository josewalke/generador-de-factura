const ProformaService = require('../services/proformaService');
const ErrorHandler = require('../utils/errorHandler');

class ProformaController {
    constructor(db, logger, cacheManager, paginationManager) {
        this.service = new ProformaService(db, logger, cacheManager, paginationManager);
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.errorHandler = new ErrorHandler(logger);
        this.db = db;
    }

    /**
     * GET /api/proformas
     */
    getAll = async (req, res) => {
        const startTime = Date.now();
        this.logger.operationRead('proformas', null, req.query);

        try {
            const result = await this.service.getAll(req.query);
            const duration = Date.now() - startTime;

            this.logger.info(`Proformas obtenidas: ${result.data?.length || 0} registros`, {
                count: result.data?.length || 0,
                duration: `${duration}ms`,
                cached: result.cached
            }, 'operations');

            res.json({ success: true, ...result });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error obteniendo proformas', {
                error: error.message,
                duration: `${duration}ms`,
                query: req.query
            }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener proformas', { query: req.query });
        }
    };

    /**
     * GET /api/proformas/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;

        try {
            const proforma = await this.service.getById(id);

            if (!proforma) {
                return this.errorHandler.handleNotFoundError(res, 'Proforma', id);
            }

            res.json({ success: true, data: proforma });
        } catch (error) {
            this.logger.error('Error obteniendo proforma', { error: error.message, id }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener proforma', { id });
        }
    };

    /**
     * POST /api/proformas
     */
    create = async (req, res) => {
        const startTime = Date.now();

        try {
            this.logger.info('Iniciando creación de proforma', {
                numero_proforma: req.body.numero_proforma,
                empresa_id: req.body.empresa_id,
                cliente_id: req.body.cliente_id,
                total: req.body.total,
                productos_count: req.body.productos?.length || 0
            }, 'operations');

            const resultado = await this.service.create(req.body);
            const duration = Date.now() - startTime;

            this.logger.info('Proforma creada exitosamente', {
                proformaId: resultado.id,
                numero_proforma: resultado.numero_proforma,
                duration: `${duration}ms`
            }, 'operations');

            res.json({ 
                success: true, 
                data: resultado
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error creando proforma', {
                error: error.message,
                duration: `${duration}ms`
            }, 'operations');

            const statusCode = error.message.includes('obligatorio') || 
                              error.message.includes('no existe') || 
                              error.message.includes('ya existe')
                ? 400 
                : 500;

            res.status(statusCode).json({ 
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    };

    /**
     * GET /api/proformas/siguiente-numero/:empresaId
     */
    getSiguienteNumero = async (req, res) => {
        const { empresaId } = req.params;

        try {
            const resultado = await this.service.getSiguienteNumero(empresaId);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error obteniendo siguiente número de proforma', { 
                error: error.message, 
                empresaId 
            });
            
            const statusCode = error.message.includes('inválido') || error.message.includes('no existe') 
                ? 400 
                : 500;
            
            res.status(statusCode).json({ 
                success: false, 
                error: error.message 
            });
        }
    };

    /**
     * PUT /api/proformas/:id
     */
    update = async (req, res) => {
        const { id } = req.params;
        const proformaId = parseInt(id, 10);

        try {
            if (isNaN(proformaId) || proformaId <= 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de proforma inválido',
                    received: id
                });
            }

            const proformaActualizada = await this.service.update(proformaId, req.body);
            
            this.logger.info('Proforma actualizada', { proformaId });
            res.json({ 
                success: true,
                message: 'Proforma actualizada correctamente',
                data: proformaActualizada
            });
        } catch (error) {
            this.logger.error('Error actualizando proforma', { error: error.message, id });
            
            const statusCode = error.message.includes('no encontrada') ? 404 : 500;
            res.status(statusCode).json({ 
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    };

    /**
     * DELETE /api/proformas/:id
     */
    delete = async (req, res) => {
        const { id } = req.params;
        const proformaId = parseInt(id, 10);

        try {
            if (isNaN(proformaId) || proformaId <= 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de proforma inválido',
                    received: id
                });
            }

            await this.service.delete(proformaId);
            
            this.logger.info('Proforma eliminada', { proformaId });
            res.json({ 
                success: true, 
                message: 'Proforma eliminada correctamente'
            });
        } catch (error) {
            this.logger.error('Error eliminando proforma', { error: error.message, id });
            
            const statusCode = error.message.includes('no encontrada') ? 404 : 500;
            res.status(statusCode).json({ 
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    };
}

module.exports = ProformaController;

