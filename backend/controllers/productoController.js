const ProductoService = require('../services/productoService');

class ProductoController {
    constructor(db, logger, cacheManager) {
        this.service = new ProductoService(db, logger);
        this.logger = logger;
        this.cacheManager = cacheManager;
    }

    /**
     * GET /api/productos
     */
    getAll = async (req, res) => {
        try {
            const productos = await this.service.getAll();
            res.json({ success: true, data: productos });
        } catch (error) {
            this.logger.error('Error obteniendo productos', { error: error.message }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/productos/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;

        try {
            const producto = await this.service.getById(id);

            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json({ success: true, data: producto });
        } catch (error) {
            this.logger.error('Error obteniendo producto', { error: error.message, id }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/productos/buscar/:codigo
     */
    buscarPorCodigo = async (req, res) => {
        const { codigo } = req.params;

        try {
            const producto = await this.service.buscarPorCodigo(codigo);

            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json({ success: true, data: producto });
        } catch (error) {
            this.logger.error('Error buscando producto', { error: error.message, codigo }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/productos
     */
    create = async (req, res) => {
        try {
            this.logger.debug('Creando nuevo producto', { codigo: req.body.codigo }, 'operations');

            const producto = await this.service.create(req.body);

            this.logger.operationCreate('producto', producto.id, { codigo: req.body.codigo });

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('productos:*');
            }

            res.json({ success: true, data: producto });
        } catch (error) {
            this.logger.error('Error creando producto', {
                error: error.message,
                codigo: req.body.codigo
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
     * POST /api/productos/desde-coche
     */
    createDesdeCoche = async (req, res) => {
        try {
            const { coche_id, precio, cantidad = 1 } = req.body;

            if (!coche_id || precio === undefined) {
                return res.status(400).json({
                    error: 'Campos obligatorios faltantes: coche_id, precio'
                });
            }

            this.logger.debug('Creando producto desde coche', { coche_id }, 'operations');

            const producto = await this.service.createDesdeCoche(coche_id, precio, cantidad);

            this.logger.operationCreate('producto', producto.id, { codigo: producto.codigo });

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('productos:*');
            }

            res.json({ success: true, data: producto });
        } catch (error) {
            this.logger.error('Error creando producto desde coche', {
                error: error.message,
                coche_id: req.body.coche_id
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
     * PUT /api/productos/:id
     */
    update = async (req, res) => {
        const { id } = req.params;

        try {
            await this.service.update(id, req.body);

            this.logger.operationUpdate('producto', id, req.body);

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('productos:*');
            }

            const producto = await this.service.getById(id);
            res.json({
                success: true,
                message: 'Producto actualizado correctamente',
                data: producto
            });
        } catch (error) {
            this.logger.error('Error actualizando producto', {
                error: error.message,
                id
            }, 'database');

            const statusCode = error.statusCode || 500;
            if (error.message === 'Producto no encontrado o inactivo') {
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
     * DELETE /api/productos/:id
     */
    delete = async (req, res) => {
        const { id } = req.params;

        try {
            await this.service.delete(id);

            this.logger.operationDelete('producto', id);

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('productos:*');
            }

            res.json({ success: true, message: 'Producto eliminado correctamente' });
        } catch (error) {
            this.logger.error('Error eliminando producto', {
                error: error.message,
                id
            }, 'database');

            if (error.message === 'Producto no encontrado') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        }
    };
}

module.exports = ProductoController;



