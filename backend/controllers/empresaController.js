const EmpresaService = require('../services/empresaService');
const ErrorHandler = require('../utils/errorHandler');

class EmpresaController {
    constructor(db, logger, cacheManager, paginationManager, sistemaFirmaDigital) {
        this.service = new EmpresaService(db, logger, cacheManager, paginationManager, sistemaFirmaDigital);
        this.logger = logger;
        this.errorHandler = new ErrorHandler(logger);
    }

    /**
     * GET /api/empresas
     */
    getAll = async (req, res) => {
        const startTime = Date.now();
        this.logger.operationRead('empresas', null, req.query);

        try {
            const result = await this.service.getAll(req.query);
            const duration = Date.now() - startTime;

            this.logger.info(`Empresas obtenidas: ${result.data?.length || 0} registros`, {
                count: result.data?.length || 0,
                duration: `${duration}ms`,
                cached: result.cached
            }, 'operations');

            res.json({ success: true, ...result });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error obteniendo empresas', {
                error: error.message,
                duration: `${duration}ms`,
                query: req.query
            }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener empresas', { query: req.query });
        }
    };

    /**
     * GET /api/empresas/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;
        const startTime = Date.now();
        this.logger.operationRead('empresas', id);

        try {
            const empresa = await this.service.getById(id);
            const duration = Date.now() - startTime;

            this.logger.info(`Empresa obtenida: ${id}`, {
                id,
                duration: `${duration}ms`
            }, 'operations');

            res.json({ success: true, data: empresa });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error obteniendo empresa', {
                error: error.message,
                id,
                duration: `${duration}ms`
            }, 'database');
            
            if (error.message === 'Empresa no encontrada') {
                res.status(404).json({ error: error.message });
            } else {
                this.errorHandler.handleGenericError(error, res, 'obtener empresa', { id });
            }
        }
    };

    /**
     * POST /api/empresas
     */
    create = async (req, res) => {
        const startTime = Date.now();
        this.logger.operationCreate('empresas', null, req.body);

        try {
            const result = await this.service.create(req.body);
            const duration = Date.now() - startTime;

            this.logger.info(`Empresa creada: ${result.empresa.id}`, {
                id: result.empresa.id,
                nombre: result.empresa.nombre,
                duration: `${duration}ms`
            }, 'operations');

            res.json({
                success: true,
                data: result.empresa,
                firmaDigitalAsociada: result.firmaDigitalAsociada
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error creando empresa', {
                error: error.message,
                duration: `${duration}ms`,
                data: req.body
            }, 'database');

            if (error.code === 'DUPLICATE_CIF') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                    field: error.field
                });
            } else {
                this.errorHandler.handleGenericError(error, res, 'crear empresa', req.body);
            }
        }
    };

    /**
     * PUT /api/empresas/:id
     */
    update = async (req, res) => {
        const { id } = req.params;
        const startTime = Date.now();
        this.logger.operationUpdate('empresas', id, req.body);

        try {
            const result = await this.service.update(id, req.body);
            const duration = Date.now() - startTime;

            this.logger.info(`Empresa actualizada: ${id}`, {
                id,
                duration: `${duration}ms`
            }, 'operations');

            res.json({
                success: true,
                message: 'Empresa actualizada correctamente',
                data: result.empresa,
                firmaDigitalAsociada: result.firmaDigitalAsociada
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error actualizando empresa', {
                error: error.message,
                id,
                duration: `${duration}ms`
            }, 'database');

            if (error.message === 'Empresa no encontrada') {
                res.status(404).json({ success: false, error: error.message });
            } else if (error.code === 'DUPLICATE_CIF') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                    field: error.field
                });
            } else {
                this.errorHandler.handleGenericError(error, res, 'actualizar empresa', { id, data: req.body });
            }
        }
    };

    /**
     * DELETE /api/empresas/:id
     */
    delete = async (req, res) => {
        const { id } = req.params;
        const startTime = Date.now();
        this.logger.operationDelete('empresas', id);

        try {
            await this.service.delete(id);
            const duration = Date.now() - startTime;

            this.logger.info(`Empresa eliminada: ${id}`, {
                id,
                duration: `${duration}ms`
            }, 'operations');

            res.json({ success: true, message: 'Empresa eliminada correctamente' });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error eliminando empresa', {
                error: error.message,
                id,
                duration: `${duration}ms`
            }, 'database');

            if (error.message === 'Empresa no encontrada') {
                res.status(404).json({ error: error.message });
            } else {
                this.errorHandler.handleGenericError(error, res, 'eliminar empresa', { id });
            }
        }
    };
}

module.exports = EmpresaController;
