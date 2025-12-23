const CocheService = require('../services/cocheService');

class CocheController {
    constructor(db, logger, cacheManager) {
        this.service = new CocheService(db, logger);
        this.logger = logger;
        this.cacheManager = cacheManager;
    }

    /**
     * GET /api/coches
     */
    getAll = async (req, res) => {
        try {
            // Verificar caché si está disponible
            if (this.cacheManager) {
                const cachedData = await this.cacheManager.verifyAndCorrect('coches:all', async () => {
                    return await this.service.getAll();
                });

                if (cachedData !== null) {
                    return res.json({ success: true, data: cachedData });
                }
            }

            const coches = await this.service.getAll();

            // Actualizar caché
            if (this.cacheManager) {
                this.cacheManager.set('coches:all', coches);
            }

            res.json({ success: true, data: coches });
        } catch (error) {
            this.logger.error('Error obteniendo coches', { error: error.message }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/coches/disponibles
     * Query params:
     *   - excluir_proformados: boolean (default: true) - Si es true, excluye coches con proformas activas (para inventario)
     */
    getDisponibles = async (req, res) => {
        try {
            // Por defecto excluir proformados (para inventario)
            // Si se pasa excluir_proformados=false, incluir coches proformados (para crear proformas/facturas)
            const excluirProformadosParam = req.query.excluir_proformados;
            // Si el parámetro es exactamente 'false' (string), entonces excluirProformados = false
            // De lo contrario, excluirProformados = true (por defecto)
            const excluirProformados = excluirProformadosParam !== 'false';
            
            this.logger.debug('getDisponibles llamado', { 
                queryParams: req.query,
                excluir_proformados_param: excluirProformadosParam,
                excluirProformados 
            }, 'routing');
            
            const coches = await this.service.getDisponibles(excluirProformados);
            
            this.logger.debug('getDisponibles resultado', { 
                excluirProformados, 
                cantidad: coches.length,
                primerosIds: coches.slice(0, 5).map(c => ({ id: c.id, matricula: c.matricula }))
            }, 'routing');
            
            res.json({ success: true, data: coches });
        } catch (error) {
            this.logger.error('Error obteniendo coches disponibles', { error: error.message }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/coches/vendidos
     */
    getVendidos = async (req, res) => {
        try {
            this.logger.debug('✅ Ruta /vendidos capturada correctamente', { path: req.path, method: req.method }, 'routing');
            const coches = await this.service.getVendidos();
            res.json({ success: true, data: coches });
        } catch (error) {
            this.logger.error('Error obteniendo coches vendidos', { error: error.message, stack: error.stack }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/coches/productos
     */
    getProductos = async (req, res) => {
        try {
            // Esta ruta devuelve coches que están asociados como productos
            const coches = await this.service.getAll();
            const productos = coches.filter(c => c.vendido === 0 || c.vendido === false);
            res.json({ success: true, data: productos });
        } catch (error) {
            this.logger.error('Error obteniendo coches como productos', { error: error.message }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/coches/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;

        // Validar que el ID sea numérico para evitar conflictos con rutas específicas
        // Si el ID no es numérico, es probable que sea una ruta específica que no se capturó correctamente
        const idNum = parseInt(id, 10);
        if (isNaN(idNum) || idNum.toString() !== id) {
            // Si no es numérico o no coincide exactamente, es una ruta específica mal capturada
            this.logger.warn('Intento de acceder a ruta específica como ID', { id, path: req.path }, 'routing');
            return res.status(404).json({ error: 'Coche no encontrado' });
        }

        try {
            const coche = await this.service.getById(idNum);

            if (!coche) {
                return res.status(404).json({ error: 'Coche no encontrado' });
            }

            res.json({ success: true, data: coche });
        } catch (error) {
            this.logger.error('Error obteniendo coche', { error: error.message, id }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/coches
     */
    create = async (req, res) => {
        try {
            this.logger.debug('Creando nuevo coche', { matricula: req.body.matricula }, 'operations');

            const coche = await this.service.create(req.body);

            this.logger.operationCreate('coche', coche.id, { matricula: req.body.matricula });

            // Invalidar caché
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('coches:*');
            }

            res.json({ success: true, data: coche });
        } catch (error) {
            this.logger.error('Error creando coche', {
                error: error.message,
                matricula: req.body.matricula
            }, 'database');

            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                error: error.message || 'Error interno del servidor',
                code: error.code,
                field: error.field
            });
        }
    };

    /**
     * PUT /api/coches/:id
     */
    update = async (req, res) => {
        const { id } = req.params;

        try {
            await this.service.update(id, req.body);

            this.logger.operationUpdate('coche', id, req.body);

            // Invalidar caché
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('coches:*');
            }

            const coche = await this.service.getById(id);
            res.json({
                success: true,
                message: 'Coche actualizado correctamente',
                data: coche
            });
        } catch (error) {
            this.logger.error('Error actualizando coche', {
                error: error.message,
                id
            }, 'database');

            const statusCode = error.statusCode || 500;
            if (error.message === 'Coche no encontrado o inactivo') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(statusCode).json({
                    error: error.message || 'Error interno del servidor',
                    code: error.code
                });
            }
        }
    };

    /**
     * DELETE /api/coches/:id
     */
    delete = async (req, res) => {
        const { id } = req.params;

        try {
            await this.service.delete(id);

            this.logger.operationDelete('coche', id);

            // Invalidar caché
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('coches:*');
            }

            res.json({ success: true, message: 'Coche desactivado correctamente' });
        } catch (error) {
            this.logger.error('Error eliminando coche', {
                error: error.message,
                id
            }, 'database');

            const statusCode = error.statusCode || 500;
            if (error.message === 'Coche no encontrado') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(statusCode).json({
                    error: error.message || 'Error interno del servidor',
                    code: error.code
                });
            }
        }
    };
}

module.exports = CocheController;



