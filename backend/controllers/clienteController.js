const ClienteService = require('../services/clienteService');

class ClienteController {
    constructor(db, logger, cacheManager) {
        this.service = new ClienteService(db, logger);
        this.logger = logger;
        this.cacheManager = cacheManager;
    }

    /**
     * GET /api/clientes
     */
    getAll = async (req, res) => {
        const startTime = Date.now();
        this.logger.operationRead('clientes', null, req.query);

        try {
            if (!this.service.db) {
                this.logger.error('Base de datos no inicializada', { endpoint: '/api/clientes' });
                return res.status(503).json({
                    error: 'Servicio no disponible',
                    message: 'La base de datos no está conectada. Por favor, reinicia el servidor.'
                });
            }

            const clientes = await this.service.getAll();
            const duration = Date.now() - startTime;

            this.logger.databaseQuery('SELECT * FROM clientes ORDER BY fecha_creacion DESC', duration, clientes.length);
            this.logger.info(`Clientes obtenidos: ${clientes.length} registros`, {
                count: clientes.length,
                duration: `${duration}ms`
            }, 'operations');

            res.json({ success: true, data: clientes });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error obteniendo clientes', {
                error: error.message,
                duration: `${duration}ms`,
                query: req.query
            }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * GET /api/clientes/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;

        try {
            const cliente = await this.service.getById(id);

            if (!cliente) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            res.json({ success: true, data: cliente });
        } catch (error) {
            this.logger.error('Error obteniendo cliente', { error: error.message, id }, 'database');
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * POST /api/clientes
     */
    create = async (req, res) => {
        const startTime = Date.now();

        try {
            this.logger.debug('Creando nuevo cliente', {
                nombre: req.body.nombre,
                identificacion: req.body.identificacion,
                email: req.body.email ? '***' : null,
                telefono: req.body.telefono ? '***' : null
            }, 'operations');

            const cliente = await this.service.create(req.body);
            const duration = Date.now() - startTime;

            this.logger.databaseQuery('INSERT INTO clientes', duration, 1, [req.body.nombre, req.body.direccion, req.body.identificacion]);
            this.logger.operationCreate('cliente', cliente.id, { nombre: req.body.nombre, identificacion: req.body.identificacion });

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('clientes:*');
            }

            res.json({ success: true, data: cliente });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error creando cliente', {
                error: error.message,
                identificacion: req.body.identificacion,
                duration: `${duration}ms`
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
     * PUT /api/clientes/:id
     */
    update = async (req, res) => {
        const { id } = req.params;
        const startTime = Date.now();

        try {
            await this.service.update(id, req.body);
            const duration = Date.now() - startTime;

            this.logger.databaseQuery('UPDATE clientes', duration, 1);
            this.logger.operationUpdate('cliente', id, req.body);

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('clientes:*');
            }

            const cliente = await this.service.getById(id);
            res.json({ success: true, data: cliente });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error actualizando cliente', {
                error: error.message,
                id,
                duration: `${duration}ms`
            }, 'database');

            const statusCode = error.statusCode || 500;
            if (error.message === 'Cliente no encontrado') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(statusCode).json({
                    error: error.message || 'Error interno del servidor',
                    code: error.code,
                    field: error.field
                });
            }
        }
    };

    /**
     * DELETE /api/clientes/:id
     */
    delete = async (req, res) => {
        const { id } = req.params;
        const startTime = Date.now();

        try {
            await this.service.delete(id);
            const duration = Date.now() - startTime;

            this.logger.databaseQuery('DELETE FROM clientes', duration, 1);
            this.logger.operationDelete('cliente', id);

            // Invalidar caché si existe
            if (this.cacheManager) {
                this.cacheManager.invalidatePattern('clientes:*');
            }

            res.json({ success: true, message: 'Cliente eliminado correctamente' });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error eliminando cliente', {
                error: error.message,
                id,
                duration: `${duration}ms`
            }, 'database');

            if (error.message === 'Cliente no encontrado') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        }
    };

    /**
     * GET /api/clientes/buscar/:identificacion
     */
    buscarPorIdentificacion = async (req, res) => {
        const { identificacion } = req.params;

        try {
            const cliente = await this.service.buscarPorIdentificacion(identificacion);

            if (!cliente) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            res.json({ success: true, data: cliente });
        } catch (error) {
            this.logger.error('Error buscando cliente', { error: error.message, identificacion }, 'database');
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = ClienteController;



