const FacturaService = require('../services/facturaService');
const ErrorHandler = require('../utils/errorHandler');

class FacturaController {
    constructor(db, logger, cacheManager, paginationManager, sistemaIntegridad, sistemaAuditoria, sistemaFirmaDigital, generadorVeriFactu) {
        this.service = new FacturaService(
            db, 
            logger, 
            cacheManager, 
            paginationManager, 
            sistemaIntegridad, 
            sistemaAuditoria, 
            sistemaFirmaDigital, 
            generadorVeriFactu
        );
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.errorHandler = new ErrorHandler(logger);
        this.db = db;
        this.sistemaIntegridad = sistemaIntegridad;
        this.sistemaAuditoria = sistemaAuditoria;
        this.sistemaFirmaDigital = sistemaFirmaDigital;
        this.generadorVeriFactu = generadorVeriFactu;
    }

    /**
     * POST /api/facturas
     */
    create = async (req, res) => {
        const startTime = Date.now();

        try {
            this.logger.info('Iniciando creación de factura', {
                numero_factura: req.body.numero_factura,
                empresa_id: req.body.empresa_id,
                cliente_id: req.body.cliente_id,
                total: req.body.total,
                productos_count: req.body.productos?.length || 0
            }, 'operations');

            const resultado = await this.service.create(req.body);
            const totalDuration = Date.now() - startTime;

            this.logger.info('Factura creada exitosamente con cumplimiento de Ley Antifraude', {
                facturaId: resultado.id,
                numero_factura: resultado.numero_factura,
                numero_serie: resultado.numero_serie,
                empresa_id: req.body.empresa_id,
                cliente_id: req.body.cliente_id,
                total: resultado.total,
                duration: `${totalDuration}ms`,
                productos_count: req.body.productos?.length || 0
            }, 'operations');

            res.json({ 
                success: true, 
                data: resultado
            });
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            this.logger.error('Error creando factura', {
                error: error.message,
                stack: error.stack,
                empresa_id: req.body.empresa_id,
                cliente_id: req.body.cliente_id,
                numero_factura: req.body.numero_factura,
                duration: `${totalDuration}ms`
            }, 'operations');

            const statusCode = error.message.includes('obligatorio') || 
                              error.message.includes('no existe') || 
                              error.message.includes('ya existe')
                ? 400 
                : 500;

            res.status(statusCode).json({ 
                success: false,
                error: error.message || 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    /**
     * GET /api/facturas
     */
    getAll = async (req, res) => {
        const startTime = Date.now();
        this.logger.operationRead('facturas', null, req.query);

        try {
            const result = await this.service.getAll(req.query);
            const duration = Date.now() - startTime;

            this.logger.info(`Facturas obtenidas: ${result.data?.length || 0} registros`, {
                count: result.data?.length || 0,
                duration: `${duration}ms`,
                cached: result.cached
            }, 'operations');

            res.json({ success: true, ...result });
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Error obteniendo facturas', {
                error: error.message,
                duration: `${duration}ms`,
                query: req.query
            }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener facturas', { query: req.query });
        }
    };

    /**
     * GET /api/facturas/resumen
     */
    getResumen = async (req, res) => {
        try {
            const resumen = await this.service.getResumen(req.query);
            res.json({ success: true, data: resumen });
        } catch (error) {
            this.logger.error('Error obteniendo resumen de facturas', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener resumen de facturas');
        }
    };

    /**
     * GET /api/facturas/anios
     */
    getAnios = async (req, res) => {
        try {
            const anios = await this.service.getAnios();
            res.json({ success: true, data: anios });
        } catch (error) {
            this.logger.error('Error obteniendo años de facturas', { error: error.message });
            this.errorHandler.handleGenericError(error, res, 'obtener años de facturas');
        }
    };

    /**
     * GET /api/facturas/:id
     */
    getById = async (req, res) => {
        const { id } = req.params;

        try {
            const factura = await this.service.getById(id);

            if (!factura) {
                return this.errorHandler.handleNotFoundError(res, 'Factura', id);
            }

            res.json({ success: true, data: factura });
        } catch (error) {
            this.logger.error('Error obteniendo factura', { error: error.message, id }, 'database');
            this.errorHandler.handleGenericError(error, res, 'obtener factura', { id });
        }
    };

    /**
     * GET /api/facturas/siguiente-numero/:empresaId
     */
    getSiguienteNumero = async (req, res) => {
        const { empresaId } = req.params;

        try {
            const resultado = await this.service.getSiguienteNumero(empresaId);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error obteniendo siguiente número de factura', { 
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
     * GET /api/facturas/:id/verifactu
     */
    getVeriFactu = async (req, res) => {
        const { id } = req.params;

        try {
            const factura = await this.service.getById(id);

            if (!factura) {
                return this.errorHandler.handleNotFoundError(res, 'Factura', id);
            }

            // Obtener datos completos para VeriFactu
            const facturaCompleta = await new Promise((resolve, reject) => {
                this.db.get(`
                    SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                           c.direccion as cliente_direccion, c.codigo_postal as cliente_codigo_postal,
                           c.provincia as cliente_provincia, c.pais as cliente_pais,
                           c.codigo_pais as cliente_codigo_pais, c.regimen_fiscal as cliente_regimen_fiscal,
                           e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                           e.codigo_postal as empresa_codigo_postal, e.provincia as empresa_provincia,
                           e.pais as empresa_pais, e.codigo_pais as empresa_codigo_pais,
                           e.regimen_fiscal as empresa_regimen_fiscal
                    FROM facturas f 
                    LEFT JOIN clientes c ON f.cliente_id = c.id 
                    LEFT JOIN empresas e ON f.empresa_id = e.id
                    WHERE f.id = ?
                `, [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!facturaCompleta) {
                return this.errorHandler.handleNotFoundError(res, 'Factura', id);
            }

            // Obtener detalles
            const detalles = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT df.*, p.codigo, COALESCE(df.descripcion, p.descripcion) as descripcion, COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto
                    FROM detalles_factura df
                    LEFT JOIN productos p ON df.producto_id = p.id
                    WHERE df.factura_id = ?
                `, [id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            facturaCompleta.detalles = detalles;

            // Generar XML VeriFactu
            const xmlVeriFactu = this.generadorVeriFactu.generarXMLVeriFactu(facturaCompleta);
            const validacion = this.generadorVeriFactu.validarXMLVeriFactu(xmlVeriFactu);

            if (!validacion.valido) {
                return res.status(400).json({ 
                    success: false,
                    error: 'XML VeriFactu inválido', 
                    detalles: validacion.errores 
                });
            }

            res.json({
                success: true,
                data: {
                    xml: xmlVeriFactu,
                    validacion: validacion,
                    factura_id: id,
                    numero_serie: facturaCompleta.numero_serie
                }
            });
        } catch (error) {
            this.logger.error('Error generando XML VeriFactu', { error: error.message, id });
            this.errorHandler.handleGenericError(error, res, 'generar XML VeriFactu', { id });
        }
    };

    /**
     * GET /api/facturas/:id/auditoria
     */
    getAuditoria = async (req, res) => {
        const { id } = req.params;

        try {
            const historial = await this.sistemaAuditoria.obtenerHistorialAuditoria('facturas', id);
            res.json({ success: true, data: historial });
        } catch (error) {
            this.logger.error('Error obteniendo historial de auditoría', { error: error.message, id });
            this.errorHandler.handleGenericError(error, res, 'obtener historial de auditoría', { id });
        }
    };

    /**
     * PUT /api/facturas/:id/marcar-pagada
     */
    marcarPagada = async (req, res) => {
        const { id } = req.params;
        const { metodo_pago, referencia_operacion, fecha_pago } = req.body;

        try {
            const facturaId = parseInt(id, 10);
            
            if (isNaN(facturaId) || facturaId <= 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de factura inválido',
                    received: id
                });
            }

            // Obtener factura actual
            const factura = await new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!factura) {
                return this.errorHandler.handleNotFoundError(res, 'Factura', facturaId);
            }

            // Actualizar factura
            const fechaPago = fecha_pago || new Date().toISOString().split('T')[0];
            const metodoPago = metodo_pago || 'transferencia';
            const referenciaOperacion = referencia_operacion || '';

            await new Promise((resolve, reject) => {
                this.db.run(`
                    UPDATE facturas 
                    SET estado = 'pagada', 
                        estado_fiscal = 'pagada',
                        metodo_pago = ?,
                        referencia_operacion = ?,
                        fecha_operacion = ?
                    WHERE id = ?
                `, [metodoPago, referenciaOperacion, fechaPago, facturaId], function(err) {
                    if (err) reject(err);
                    else {
                        if (this.changes === 0) {
                            reject(new Error('Factura no encontrada o no se pudo actualizar'));
                        } else {
                            resolve();
                        }
                    }
                });
            });

            // Registrar en auditoría
            try {
                await this.sistemaAuditoria.registrarOperacion(
                    'facturas',
                    facturaId,
                    'UPDATE',
                    { estado: factura.estado, estado_fiscal: factura.estado_fiscal },
                    { estado: 'pagada', estado_fiscal: 'pagada', metodo_pago: metodoPago, referencia_operacion: referenciaOperacion, fecha_operacion: fechaPago },
                    'sistema'
                );
            } catch (auditError) {
                this.logger.warn('Error al registrar en auditoría (no crítico)', { error: auditError.message });
            }

            // Invalidar caché
            if (this.cacheManager) {
                this.cacheManager.delPattern('facturas:*');
            }

            this.logger.info('Factura marcada como pagada', { facturaId, metodoPago, fechaPago });
            res.json({ 
                success: true, 
                message: 'Factura marcada como pagada exitosamente',
                data: {
                    id: facturaId,
                    estado: 'pagada',
                    fecha_pago: fechaPago,
                    metodo_pago: metodoPago
                }
            });
        } catch (error) {
            this.logger.error('Error marcando factura como pagada', { error: error.message, id });
            this.errorHandler.handleGenericError(error, res, 'marcar factura como pagada', { id             });
        }
    };

    /**
     * PUT /api/facturas/:id/marcar-pendiente
     */
    marcarPendiente = async (req, res) => {
        const { id } = req.params;

        try {
            const facturaId = parseInt(id, 10);
            
            if (isNaN(facturaId) || facturaId <= 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de factura inválido',
                    received: id
                });
            }

            const resultado = await this.service.marcarPendiente(facturaId);

            // Registrar en auditoría
            try {
                await this.sistemaAuditoria.registrarOperacion(
                    'facturas',
                    facturaId,
                    'UPDATE',
                    { estado: resultado.estado_anterior },
                    { estado: 'pendiente', estado_fiscal: 'pendiente' },
                    'sistema'
                );
            } catch (auditError) {
                this.logger.warn('Error al registrar en auditoría (no crítico)', { error: auditError.message });
            }

            this.logger.info('Factura marcada como pendiente', { facturaId });
            res.json({ 
                success: true, 
                message: 'Factura marcada como pendiente exitosamente',
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error marcando factura como pendiente', { error: error.message, id });
            
            const statusCode = error.message.includes('no encontrada') ? 404 : 500;
            this.errorHandler.handleGenericError(error, res, 'marcar factura como pendiente', { id });
        }
    };

    /**
     * POST /api/facturas/:id/enviar-verifactu
     */
    enviarVeriFactu = async (req, res) => {
        const { id } = req.params;

        try {
            const facturaId = parseInt(id, 10);
            
            if (isNaN(facturaId) || facturaId <= 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de factura inválido',
                    received: id
                });
            }

            const resultado = await this.service.enviarVeriFactu(facturaId);

            // Registrar en auditoría
            try {
                await this.sistemaAuditoria.registrarOperacion(
                    'facturas',
                    facturaId,
                    'UPDATE',
                    { estado_fiscal: 'pendiente' },
                    { estado_fiscal: resultado.estado_fiscal, respuesta_aeat: resultado.respuesta_aeat },
                    'sistema'
                );
            } catch (auditError) {
                this.logger.warn('Error al registrar en auditoría (no crítico)', { error: auditError.message });
            }

            // Invalidar caché
            if (this.cacheManager) {
                this.cacheManager.delPattern('facturas:*');
            }

            this.logger.info('Factura enviada a VeriFactu', { 
                facturaId, 
                estado: resultado.estado_fiscal 
            });
            
            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error enviando factura a VeriFactu', { error: error.message, id });
            this.errorHandler.handleGenericError(error, res, 'enviar factura a VeriFactu', { id });
        }
    };

    /**
     * PUT /api/facturas/:id/anular
     */
    anular = async (req, res) => {
        const { id } = req.params;

        try {
            const facturaId = parseInt(id, 10);
            
            if (isNaN(facturaId) || facturaId <= 0) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID de factura inválido',
                    received: id
                });
            }

            const resultado = await this.service.anular(facturaId);

            // Registrar en auditoría
            try {
                await this.sistemaAuditoria.registrarOperacion(
                    'facturas',
                    facturaId,
                    'UPDATE',
                    { estado: resultado.estado_anterior },
                    { estado: 'anulado', estado_fiscal: 'anulado' },
                    'sistema'
                );
            } catch (auditError) {
                this.logger.warn('Error al registrar en auditoría (no crítico)', { error: auditError.message });
            }

            this.logger.info('Factura anulada', { facturaId, total: resultado.total });
            res.json({ 
                success: true, 
                message: 'Factura anulada exitosamente',
                data: resultado
            });
        } catch (error) {
            this.logger.error('Error anulando factura', { error: error.message, id });
            
            const statusCode = error.message.includes('no encontrada') || error.message.includes('ya está anulada')
                ? (error.message.includes('ya está anulada') ? 400 : 404)
                : 500;
            
            res.status(statusCode).json({ 
                success: false,
                error: error.message || 'Error interno del servidor'
            });
        }
    };
}

module.exports = FacturaController;

