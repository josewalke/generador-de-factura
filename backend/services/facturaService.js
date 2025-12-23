const config = require('../config/config');

class FacturaService {
    constructor(db, logger, cacheManager, paginationManager, sistemaIntegridad, sistemaAuditoria, sistemaFirmaDigital, generadorVeriFactu) {
        this.db = db;
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.paginationManager = paginationManager;
        this.sistemaIntegridad = sistemaIntegridad;
        this.sistemaAuditoria = sistemaAuditoria;
        this.sistemaFirmaDigital = sistemaFirmaDigital;
        this.generadorVeriFactu = generadorVeriFactu;
    }

    /**
     * Obtener facturas con paginación y filtros
     */
    async getAll(queryParams) {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            empresa_id = '', 
            cliente_id = '', 
            fecha_desde = '', 
            fecha_hasta = '', 
            include_detalles = 'false', 
            include_resumen = 'false',
            force_refresh = 'false'
        } = queryParams;

        const includeDetalles = include_detalles === 'true';
        const includeResumen = include_resumen === 'true';
        const forceRefresh = force_refresh === 'true' || queryParams.no_cache === 'true';

        // Verificar caché
        const cacheKey = `facturas:page:${page}:limit:${limit}:search:${search}:empresa:${empresa_id}:cliente:${cliente_id}:fecha_desde:${fecha_desde}:fecha_hasta:${fecha_hasta}:det:${includeDetalles}:res:${includeResumen}`;
        const cachedResult = !forceRefresh ? this.cacheManager?.get(cacheKey) : null;

        if (cachedResult && !forceRefresh) {
            // Verificación rápida del total de facturas
            try {
                const dbType = config.get('database.type') || 'postgresql';
                const activoValue = dbType === 'postgresql' ? 'true' : '1';
                const quickCheck = await new Promise((resolve) => {
                    try {
                        this.db.get(`SELECT COUNT(*) as total FROM facturas WHERE (activo = ${activoValue} OR activo IS NULL)`, [], (err, row) => {
                            if (err) {
                                resolve(null);
                            } else {
                                resolve(row?.total || 0);
                            }
                        });
                    } catch (error) {
                        resolve(null);
                    }
                });

                if (quickCheck !== null) {
                    const cachedTotal = cachedResult.pagination?.totalCount || cachedResult.data?.length || 0;
                    if (quickCheck === cachedTotal) {
                        return { ...cachedResult, cached: true };
                    } else {
                        this.cacheManager?.delPattern('facturas:*');
                    }
                } else {
                    return { ...cachedResult, cached: true };
                }
            } catch (error) {
                return { ...cachedResult, cached: true };
            }
        }

        // Construir consulta con filtros
        const joins = [
            { type: 'LEFT', table: 'clientes c', condition: 'f.cliente_id = c.id' },
            { type: 'LEFT', table: 'empresas e', condition: 'f.empresa_id = e.id' },
            { type: 'LEFT', table: 'proformas p', condition: 'f.proforma_id = p.id' }
        ];

        let whereConditions = [];
        let whereParams = [];
        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';
        
        whereConditions.push(`(f.activo = ${activoValue} OR f.activo IS NULL)`);

        if (search) {
            whereConditions.push('(f.numero_factura LIKE ? OR c.nombre LIKE ? OR e.nombre LIKE ?)');
            whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (empresa_id) {
            whereConditions.push('f.empresa_id = ?');
            whereParams.push(empresa_id);
        }

        if (cliente_id) {
            whereConditions.push('f.cliente_id = ?');
            whereParams.push(cliente_id);
        }

        if (fecha_desde) {
            whereConditions.push('f.fecha_emision >= ?');
            whereParams.push(fecha_desde);
        }

        if (fecha_hasta) {
            whereConditions.push('f.fecha_emision <= ?');
            whereParams.push(fecha_hasta);
        }

        const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : null;

        const result = await this.paginationManager.getPaginatedDataWithJoins('facturas f', joins, {
            page: parseInt(page),
            limit: maxLimit,
            where: whereClause,
            whereParams: whereParams,
            orderBy: 'COALESCE(f.fecha_creacion, f.fecha_emision)',
            orderDirection: 'DESC',
            select: `f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion, e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                     p.id as proforma_id_relacionada, p.numero_proforma as proforma_numero, p.estado as proforma_estado,
                     (SELECT COUNT(*) FROM detalles_factura df WHERE df.factura_id = f.id AND df.coche_id IS NOT NULL) as coches_count`
        });

        let facturas = result.data || [];

        // Incluir detalles si se solicita
        if (includeDetalles && facturas.length > 0) {
            facturas = await this.attachDetalles(facturas);
        }

        // Incluir resumen si se solicita
        let resumen = undefined;
        if (includeResumen) {
            try {
                resumen = await this.getResumen(queryParams);
            } catch (resumenError) {
                this.logger.warn('No se pudo calcular el resumen de facturas', { error: resumenError.message });
            }
        }

        const responsePayload = {
            data: facturas,
            pagination: result.pagination,
            resumen
        };

        // Guardar en caché con TTL de 30 segundos
        this.cacheManager?.set(cacheKey, responsePayload, 30);

        return { ...responsePayload, cached: false };
    }

    /**
     * Adjuntar detalles a facturas
     */
    async attachDetalles(facturas) {
        const facturaIds = facturas.map(f => f.id).filter(Boolean);
        if (facturaIds.length === 0) return facturas;

        const placeholders = facturaIds.map(() => '?').join(', ');
        const detallesQuery = `
            SELECT df.*, COALESCE(df.descripcion, p.descripcion) as descripcion,
                   COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto,
                   df.factura_id,
                   c.matricula as coche_matricula,
                   c.chasis as coche_chasis,
                   c.color as coche_color,
                   c.kms as coche_kms,
                   c.modelo as coche_modelo
            FROM detalles_factura df
            LEFT JOIN productos p ON df.producto_id = p.id
            LEFT JOIN coches c ON (COALESCE(df.descripcion, p.descripcion) LIKE '%' || c.matricula || '%')
            WHERE df.factura_id IN (${placeholders})
            ORDER BY df.factura_id, df.id
        `;

        const detalles = await new Promise((resolve, reject) => {
            this.db.all(detallesQuery, facturaIds, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const detalleMap = {};
        (detalles || []).forEach(detalle => {
            if (!detalleMap[detalle.factura_id]) {
                detalleMap[detalle.factura_id] = [];
            }
            detalleMap[detalle.factura_id].push(detalle);
        });

        return facturas.map(factura => ({
            ...factura,
            detalles: detalleMap[factura.id] || []
        }));
    }

    /**
     * Obtener resumen de facturas
     */
    async getResumen(queryParams) {
        const { empresa_id = '', cliente_id = '', fecha_desde = '', fecha_hasta = '' } = queryParams;
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';

        let whereConditions = [`(f.activo = ${activoValue} OR f.activo IS NULL)`];
        let whereParams = [];

        if (empresa_id) {
            whereConditions.push('f.empresa_id = ?');
            whereParams.push(empresa_id);
        }

        if (cliente_id) {
            whereConditions.push('f.cliente_id = ?');
            whereParams.push(cliente_id);
        }

        if (fecha_desde) {
            whereConditions.push('f.fecha_emision >= ?');
            whereParams.push(fecha_desde);
        }

        if (fecha_hasta) {
            whereConditions.push('f.fecha_emision <= ?');
            whereParams.push(fecha_hasta);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                COUNT(*) as total_facturas,
                SUM(total) as total_importe,
                SUM(CASE WHEN estado = 'pagada' THEN total ELSE 0 END) as total_pagado,
                SUM(CASE WHEN estado = 'pendiente' OR estado IS NULL THEN total ELSE 0 END) as total_pendiente,
                AVG(total) as promedio_factura
            FROM facturas f
            WHERE ${whereClause}
        `;

        return new Promise((resolve, reject) => {
            this.db.get(query, whereParams, (err, row) => {
                if (err) reject(err);
                else resolve(row || {});
            });
        });
    }

    /**
     * Obtener factura por ID
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT f.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion, c.identificacion as cliente_identificacion,
                       e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                       p.id as proforma_id_relacionada, p.numero_proforma as proforma_numero, p.estado as proforma_estado, p.fecha_emision as proforma_fecha_emision
                FROM facturas f 
                LEFT JOIN clientes c ON f.cliente_id = c.id 
                LEFT JOIN empresas e ON f.empresa_id = e.id
                LEFT JOIN proformas p ON f.proforma_id = p.id
                WHERE f.id = ?
            `, [id], async (err, factura) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!factura) {
                    resolve(null);
                    return;
                }

                // Obtener detalles
                try {
                    const detalles = await new Promise((resolveDet, rejectDet) => {
                        this.db.all(`
                            SELECT df.*, COALESCE(df.descripcion, p.descripcion) as descripcion, COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto,
                                   c.matricula as coche_matricula, c.chasis as coche_chasis, c.color as coche_color, 
                                   c.kms as coche_kms, c.modelo as coche_modelo
                            FROM detalles_factura df
                            LEFT JOIN productos p ON df.producto_id = p.id
                            LEFT JOIN coches c ON df.coche_id = c.id
                            WHERE df.factura_id = ?
                        `, [id], (err, rows) => {
                            if (err) rejectDet(err);
                            else resolveDet(rows || []);
                        });
                    });

                    factura.detalles = detalles;
                    resolve(factura);
                } catch (error) {
                    factura.detalles = [];
                    resolve(factura);
                }
            });
        });
    }

    /**
     * Obtener siguiente número de factura para una empresa
     */
    async getSiguienteNumero(empresaId) {
        // Validar empresaId
        if (!empresaId || isNaN(empresaId) || parseInt(empresaId) <= 0) {
            throw new Error('ID de empresa inválido. Debe ser un número positivo.');
        }

        const empresaIdNumero = parseInt(empresaId);
        const año = new Date().getFullYear();

        // Verificar que la empresa existe
        const empresa = await new Promise((resolve, reject) => {
            this.db.get("SELECT id, nombre, direccion FROM empresas WHERE id = ?", [empresaIdNumero], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!empresa) {
            throw new Error(`La empresa con ID ${empresaIdNumero} no existe en la base de datos`);
        }

        // Generar prefijo basado en nombre y ubicación
        const prefijo = this.generarPrefijoEmpresa(empresa.nombre, empresa.direccion);

        // Buscar el último número de factura
        const ultimoNumero = await new Promise((resolve, reject) => {
            this.db.get(`
                SELECT MAX(CAST(SUBSTR(numero_factura, ${prefijo.length + 1}, 3) AS INTEGER)) as ultimo_numero
                FROM facturas 
                WHERE empresa_id = ? AND numero_factura LIKE '${prefijo}%/${año}'
            `, [empresaIdNumero], (err, row) => {
                if (err) reject(err);
                else resolve(row?.ultimo_numero || 0);
            });
        });

        const siguienteNumero = ultimoNumero + 1;
        const numeroFormateado = `${prefijo}${siguienteNumero.toString().padStart(3, '0')}/${año}`;

        // Verificar que el número no existe
        const existe = await new Promise((resolve, reject) => {
            this.db.get("SELECT id FROM facturas WHERE numero_factura = ? AND empresa_id = ?", 
                [numeroFormateado, empresaIdNumero], (err, row) => {
                    if (err) reject(err);
                    else resolve(!!row);
                });
        });

        if (existe) {
            throw new Error(`El número ${numeroFormateado} ya existe. Contacte al administrador.`);
        }

        return {
            numero_factura: numeroFormateado,
            empresa_id: empresaIdNumero,
            prefijo: prefijo,
            empresa_nombre: empresa.nombre,
            empresa_ubicacion: empresa.direccion,
            año: año
        };
    }

    /**
     * Generar prefijo de empresa basado en nombre y ubicación
     */
    generarPrefijoEmpresa(nombre, direccion) {
        // Extraer iniciales del nombre (máximo 3 letras)
        const iniciales = nombre
            .split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join('')
            .substring(0, 3)
            .padEnd(3, 'X');

        // Extraer código de provincia si está en la dirección
        const codigoProvincia = direccion?.match(/\b([A-Z]{2})\b/)?.[1] || 'XX';

        return `${iniciales}-${codigoProvincia}`;
    }

    /**
     * Obtener años disponibles en facturas
     */
    async getAnios() {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const isPostgreSQL = dbType === 'postgresql';
            
            // En PostgreSQL, usar EXTRACT para obtener el año de una fecha
            // En SQLite, SUBSTR funciona porque las fechas se almacenan como texto
            const query = isPostgreSQL
                ? `SELECT DISTINCT CAST(EXTRACT(YEAR FROM fecha_emision) AS INTEGER) as año
                   FROM facturas
                   WHERE fecha_emision IS NOT NULL
                   ORDER BY año DESC`
                : `SELECT DISTINCT CAST(SUBSTR(fecha_emision, 1, 4) AS INTEGER) as año
                   FROM facturas
                   WHERE fecha_emision IS NOT NULL
                   ORDER BY año DESC`;
            
            this.logger.debug('Ejecutando query para obtener años', { query, isPostgreSQL, dbType }, 'database');
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    this.logger.error('Error obteniendo años de facturas', { error: err.message, query }, 'database');
                    reject(err);
                    return;
                }
                resolve((rows || []).map(row => row.año || row.anio || row.year));
            });
        });
    }

    /**
     * Marcar factura como pendiente (revertir pago)
     */
    async marcarPendiente(id) {
        // Obtener factura actual
        const factura = await new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM facturas WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        // Actualizar factura
        const changes = await new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE facturas 
                SET estado = 'pendiente', 
                    estado_fiscal = 'pendiente'
                WHERE id = ?
            `, [id], function(err) {
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

        // Invalidar caché
        this.cacheManager?.delPattern('facturas:*');

        return {
            id: id,
            estado: 'pendiente',
            estado_anterior: factura.estado
        };
    }

    /**
     * Enviar factura a VeriFactu (simulado)
     */
    async enviarVeriFactu(id) {
        // Obtener datos de la factura
        const factura = await this.getById(id);
        
        if (!factura) {
            throw new Error('Factura no encontrada');
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
            throw new Error('Factura no encontrada');
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
        
        // Simular envío a AEAT
        const respuestaAEAT = this.generadorVeriFactu.generarRespuestaAEAT(xmlVeriFactu);
        
        // Actualizar factura con respuesta de AEAT
        await new Promise((resolve, reject) => {
            this.db.run('UPDATE facturas SET respuesta_aeat = ?, estado_fiscal = ? WHERE id = ?', 
                [JSON.stringify(respuestaAEAT), respuestaAEAT.valido ? 'enviada' : 'error'], 
                function(err) {
                    if (err) reject(err);
                    else resolve();
                });
        });

        return {
            factura_id: id,
            respuesta_aeat: respuestaAEAT,
            xml_enviado: xmlVeriFactu,
            estado_fiscal: respuestaAEAT.valido ? 'enviada' : 'error'
        };
    }

    /**
     * Anular factura
     */
    async anular(id) {
        // Obtener factura actual
        const factura = await new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM facturas WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        // Verificar si ya está anulada
        if (factura.estado === 'anulado' || factura.estado === 'anulada') {
            throw new Error('La factura ya está anulada');
        }

        // Actualizar factura como anulada
        await new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE facturas 
                SET estado = 'anulado', 
                    estado_fiscal = 'anulado'
                WHERE id = ?
            `, [id], function(err) {
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

        // Invalidar caché
        this.cacheManager?.delPattern('facturas:*');

        return {
            id: id,
            estado: 'anulado',
            estado_anterior: factura.estado,
            total: factura.total
        };
    }

    /**
     * Helper: Asegurar columnas de Ley Antifraude
     */
    async ensureFacturaLeyAntifraudeColumns(isPostgreSQL) {
        const columns = [
            { name: 'numero_serie', type: 'TEXT' },
            { name: 'fecha_operacion', type: 'DATE' },
            { name: 'tipo_documento', type: 'TEXT DEFAULT \'factura\'' },
            { name: 'metodo_pago', type: 'TEXT DEFAULT \'transferencia\'' },
            { name: 'referencia_operacion', type: 'TEXT' },
            { name: 'hash_documento', type: 'TEXT' },
            { name: 'sellado_temporal', type: isPostgreSQL ? 'TIMESTAMP' : 'DATETIME' },
            { name: 'estado_fiscal', type: 'TEXT DEFAULT \'pendiente\'' },
            { name: 'codigo_verifactu', type: 'TEXT' },
            { name: 'respuesta_aeat', type: 'TEXT' }
        ];

        for (const column of columns) {
            try {
                if (isPostgreSQL) {
                    await this.db.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
                } else {
                    await new Promise((resolve, reject) => {
                        this.db.run(`ALTER TABLE facturas ADD COLUMN ${column.name} ${column.type}`, (err) => {
                            if (err && !err.message.toLowerCase().includes('duplicate column name')) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            } catch (error) {
                if (!error.message.includes('duplicate') && !error.message.includes('already exists') && !error.message.includes('ya existe')) {
                    this.logger?.error(`Error asegurando columna ${column.name} en facturas`, { error: error.message });
                }
            }
        }
    }

    /**
     * Helper: Asegurar columna coche_id en detalles_factura
     */
    async ensureDetalleFacturaCocheColumn(isPostgreSQL) {
        try {
            if (isPostgreSQL) {
                await this.db.query('ALTER TABLE detalles_factura ADD COLUMN IF NOT EXISTS coche_id INTEGER');
            } else {
                await new Promise((resolve, reject) => {
                    this.db.run('ALTER TABLE detalles_factura ADD COLUMN coche_id INTEGER', (err) => {
                        if (err && !err.message.toLowerCase().includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        } catch (error) {
            if (!error.message.includes('duplicate') && !error.message.includes('already exists')) {
                this.logger?.error('Error asegurando columna coche_id en detalles_factura', { error: error.message });
            }
        }
    }

    /**
     * Helper: Ejecutar query GET
     */
    async runGet(query, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            this.db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || {});
            });
        });
    }

    /**
     * Crear factura (complejo - incluye validaciones, hash, sellado, detalles, actualización de coches/proformas, firma digital)
     */
    async create(data) {
        const {
            numero_factura,
            empresa_id,
            cliente_id,
            fecha_emision,
            fecha_vencimiento,
            subtotal,
            igic,
            total,
            notas,
            productos,
            proforma_id,
            fecha_operacion,
            tipo_documento = 'factura',
            metodo_pago = 'transferencia',
            referencia_operacion
        } = data;

        // ==================== VALIDACIONES ESTRICTAS ====================
        
        if (!empresa_id || empresa_id === null || empresa_id === undefined) {
            throw new Error('empresa_id es obligatorio para crear una factura');
        }

        // Verificar que la empresa existe
        const empresaExiste = await new Promise((resolve, reject) => {
            this.db.get("SELECT id, nombre FROM empresas WHERE id = ?", [empresa_id], (err, row) => {
                if (err) {
                    this.logger?.error('Error verificando empresa', { error: err.message, empresa_id }, 'database');
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (!empresaExiste) {
            throw new Error(`La empresa con ID ${empresa_id} no existe en la base de datos`);
        }

        // Validar número de factura único
        if (numero_factura) {
            const numeroExiste = await new Promise((resolve, reject) => {
                this.db.get("SELECT id FROM facturas WHERE numero_factura = ? AND empresa_id = ?", 
                    [numero_factura, empresa_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
            });

            if (numeroExiste) {
                throw new Error(`El número de factura "${numero_factura}" ya existe para la empresa "${empresaExiste.nombre}"`);
            }
        }

        // Validar cliente_id si se proporciona
        if (cliente_id) {
            const clienteExiste = await new Promise((resolve, reject) => {
                this.db.get("SELECT id, nombre FROM clientes WHERE id = ?", [cliente_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!clienteExiste) {
                throw new Error(`El cliente con ID ${cliente_id} no existe en la base de datos`);
            }
        }

        // Validar proforma_id si se proporciona
        if (proforma_id) {
            const proformaExiste = await new Promise((resolve, reject) => {
                this.db.get("SELECT id, numero_proforma FROM proformas WHERE id = ?", [proforma_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!proformaExiste) {
                throw new Error(`La proforma con ID ${proforma_id} no existe en la base de datos`);
            }
        }

        // ==================== FIN VALIDACIONES ====================

        // Generar número de serie único
        const numero_serie = this.sistemaIntegridad.generarNumeroSerie(empresa_id, numero_factura);

        // Preparar datos para hash de integridad
        const datosFactura = {
            numero_factura,
            empresa_id,
            cliente_id,
            fecha_emision,
            fecha_operacion: fecha_operacion || fecha_emision,
            subtotal,
            igic,
            total,
            productos: productos || []
        };

        // Generar hash de integridad
        const hash_documento = this.sistemaIntegridad.generarHashIntegridad(datosFactura);

        // Generar sellado temporal
        const selladoTemporal = this.sistemaIntegridad.generarSelladoTemporal(datosFactura);

        // Asegurar columnas de Ley Antifraude
        const dbType = config.get('database.type') || 'postgresql';
        const isPostgreSQL = dbType === 'postgresql';
        const activoValue = isPostgreSQL ? true : 1;

        await this.ensureFacturaLeyAntifraudeColumns(isPostgreSQL);

        // Insertar factura
        const query = `
            INSERT INTO facturas (
                numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
                subtotal, igic, total, notas, numero_serie, fecha_operacion,
                tipo_documento, metodo_pago, referencia_operacion, hash_documento,
                sellado_temporal, estado_fiscal, proforma_id, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
            subtotal, igic, total, notas, numero_serie, fecha_operacion || fecha_emision,
            tipo_documento, metodo_pago, referencia_operacion || '', hash_documento,
            selladoTemporal.timestamp, 'pendiente', proforma_id || null, activoValue
        ];

        const facturaId = await new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        // Asegurar columna coche_id en detalles_factura
        await this.ensureDetalleFacturaCocheColumn(isPostgreSQL);

        // Insertar detalles y actualizar coches
        if (productos && productos.length > 0) {
            await this.insertarDetallesYActualizarCoches(facturaId, productos, isPostgreSQL);
        }

        // Actualizar estado de proformas
        await this.actualizarEstadoProformas(facturaId, numero_factura, isPostgreSQL);

        // Generar código VeriFactu
        const datosCompletosFactura = {
            id: facturaId,
            numero_factura,
            numero_serie,
            empresa_id,
            cliente_id,
            fecha_emision,
            fecha_operacion: fecha_operacion || fecha_emision,
            subtotal,
            igic,
            total,
            hash_documento,
            sellado_temporal: selladoTemporal.timestamp
        };

        const codigoVeriFactu = this.sistemaIntegridad.generarCodigoVeriFactu(datosCompletosFactura);

        // Actualizar factura con código VeriFactu
        await new Promise((resolve, reject) => {
            this.db.run('UPDATE facturas SET codigo_verifactu = ? WHERE id = ?', [codigoVeriFactu, facturaId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Generar firma digital
        const datosFacturaParaFirma = {
            ...datosCompletosFactura,
            codigo_verifactu: codigoVeriFactu,
            productos: productos || []
        };

        const resultadoFirma = await this.sistemaFirmaDigital.firmarDocumentoConEmpresa(empresa_id, datosFacturaParaFirma);

        if (resultadoFirma.success) {
            const firmaDigital = {
                firma: resultadoFirma.firma,
                archivo: resultadoFirma.firma.archivo,
                certificado: resultadoFirma.firma.certificado
            };

            await new Promise((resolve, reject) => {
                this.db.run('UPDATE facturas SET respuesta_aeat = ? WHERE id = ?', 
                    [JSON.stringify({ firma_digital: firmaDigital.firma, archivo_firma: firmaDigital.archivo }), facturaId], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
        }

        // Registrar en auditoría
        await this.sistemaAuditoria.registrarCreacionFactura(datosCompletosFactura);

        // Invalidar caché
        this.cacheManager?.delPattern('facturas:*');
        this.cacheManager?.delPattern('proformas:*');

        return {
            id: facturaId,
            numero_factura,
            numero_serie,
            hash_documento,
            sellado_temporal: selladoTemporal.timestamp,
            codigo_verifactu: codigoVeriFactu,
            total
        };
    }

    /**
     * Insertar detalles de factura y actualizar estado de coches
     */
    async insertarDetallesYActualizarCoches(facturaId, productos, isPostgreSQL) {
        const inactivoValue = isPostgreSQL ? false : 0;

        for (const producto of productos) {
            const productoId = producto.id && producto.id > 0 ? producto.id : null;
            const cocheId = producto.coche_id || producto.cocheId || producto.cocheID || null;

            // Insertar detalle
            await new Promise((resolve, reject) => {
                const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                const cantidad = producto.cantidad || 1;

                this.db.run(`
                    INSERT INTO detalles_factura (factura_id, producto_id, coche_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [facturaId, productoId, cocheId, cantidad, precioUnitario, producto.subtotal || (precioUnitario * cantidad), igic, producto.total || (precioUnitario * cantidad + igic), producto.descripcion || null, tipoImpuesto], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Marcar coche como vendido si existe cocheId
            const cocheIdNumero = cocheId ? parseInt(cocheId) : null;
            if (cocheIdNumero && cocheIdNumero > 0) {
                await new Promise((resolve, reject) => {
                    this.db.run(`UPDATE coches SET activo = ? WHERE id = ?`, [inactivoValue, cocheIdNumero], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                // Actualizar producto asociado
                const cocheInfo = await this.runGet('SELECT matricula FROM coches WHERE id = ?', [cocheId]);
                if (cocheInfo?.matricula) {
                    await new Promise((resolve, reject) => {
                        this.db.run(`UPDATE productos SET activo = ? WHERE codigo = ?`, [inactivoValue, cocheInfo.matricula], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            } else if (producto.descripcion && producto.descripcion.includes(' - ')) {
                // Extraer matrícula de la descripción
                const partes = producto.descripcion.split(' - ');
                if (partes.length >= 2) {
                    const matricula = partes[1].trim();
                    if (/[A-Z0-9]/.test(matricula)) {
                        // Marcar coche como vendido
                        await new Promise((resolve, reject) => {
                            this.db.run(`UPDATE coches SET activo = ? WHERE matricula = ?`, [inactivoValue, matricula], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });

                        // Marcar producto como vendido
                        await new Promise((resolve, reject) => {
                            this.db.run(`UPDATE productos SET activo = ? WHERE codigo = ?`, [inactivoValue, matricula], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    }
                }
            }
        }
    }

    /**
     * Actualizar estado de proformas relacionadas
     */
    async actualizarEstadoProformas(facturaId, numero_factura, isPostgreSQL) {
        // Obtener coches de la factura
        let cochesFactura = [];
        
        if (isPostgreSQL) {
            const result = await this.db.query(`
                SELECT DISTINCT coche_id
                FROM detalles_factura 
                WHERE factura_id = $1 AND coche_id IS NOT NULL
            `, [facturaId]);
            cochesFactura = result.rows.map(row => row.coche_id).filter(id => id !== null && id !== undefined);
        } else {
            cochesFactura = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT DISTINCT coche_id
                    FROM detalles_factura 
                    WHERE factura_id = ? AND coche_id IS NOT NULL
                `, [facturaId], (err, rows) => {
                    if (err) reject(err);
                    else {
                        const cocheIds = rows.map(row => row.coche_id).filter(id => id !== null && id !== undefined);
                        resolve(cocheIds);
                    }
                });
            });
        }

        if (cochesFactura.length === 0) return;

        // Buscar proformas relacionadas
        let proformasConCoches = [];
        
        if (isPostgreSQL) {
            const cochesPlaceholders = cochesFactura.map((_, i) => `$${i + 1}`).join(',');
            const query = `
                SELECT DISTINCT p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id,
                       (SELECT COUNT(DISTINCT dp2.coche_id) 
                        FROM detalles_proforma dp2 
                        WHERE dp2.proforma_id = p.id 
                          AND dp2.coche_id IS NOT NULL) as total_coches_proforma,
                       (SELECT COUNT(DISTINCT dp3.coche_id)
                        FROM detalles_proforma dp3
                        WHERE dp3.proforma_id = p.id
                          AND dp3.coche_id IS NOT NULL
                          AND EXISTS (
                              SELECT 1 
                              FROM detalles_factura df
                              INNER JOIN facturas f ON df.factura_id = f.id
                              WHERE df.coche_id = dp3.coche_id
                                AND (f.estado IS NULL OR f.estado != 'anulado')
                                AND (f.activo = true OR f.activo IS NULL)
                          )) as coches_facturados
                FROM proformas p
                INNER JOIN detalles_proforma dp ON dp.proforma_id = p.id
                WHERE dp.coche_id IN (${cochesPlaceholders})
                  AND dp.coche_id IS NOT NULL
                  AND p.estado NOT IN ('anulado', 'cancelada')
                GROUP BY p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id
            `;
            const result = await this.db.query(query, cochesFactura);
            proformasConCoches = result.rows || [];
        } else {
            const placeholders = cochesFactura.map(() => '?').join(',');
            proformasConCoches = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT DISTINCT p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id,
                           (SELECT COUNT(DISTINCT dp2.coche_id) 
                            FROM detalles_proforma dp2 
                            WHERE dp2.proforma_id = p.id 
                              AND dp2.coche_id IS NOT NULL) as total_coches_proforma,
                           (SELECT COUNT(DISTINCT dp3.coche_id)
                            FROM detalles_proforma dp3
                            WHERE dp3.proforma_id = p.id
                              AND dp3.coche_id IS NOT NULL
                              AND EXISTS (
                                  SELECT 1 
                                  FROM detalles_factura df
                                  INNER JOIN facturas f ON df.factura_id = f.id
                                  WHERE df.coche_id = dp3.coche_id
                                    AND (f.estado IS NULL OR f.estado != 'anulado')
                                    AND (f.activo = 1 OR f.activo IS NULL)
                              )) as coches_facturados
                    FROM proformas p
                    INNER JOIN detalles_proforma dp ON dp.proforma_id = p.id
                    WHERE dp.coche_id IN (${placeholders})
                      AND dp.coche_id IS NOT NULL
                      AND p.estado NOT IN ('anulado', 'cancelada')
                    GROUP BY p.id, p.numero_proforma, p.estado, p.cliente_id, p.empresa_id
                `, cochesFactura, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
        }

        // Actualizar estado de proformas
        for (const proforma of proformasConCoches) {
            const totalCoches = parseInt(proforma.total_coches_proforma) || 0;
            const cochesFacturados = parseInt(proforma.coches_facturados) || 0;

            if (totalCoches > 0) {
                let nuevoEstado = null;
                let notaEstado = '';

                if (cochesFacturados === totalCoches) {
                    nuevoEstado = 'facturada';
                    notaEstado = `Facturada completamente: ${cochesFacturados}/${totalCoches} coches`;
                } else if (cochesFacturados > 0 && cochesFacturados < totalCoches) {
                    nuevoEstado = 'semifacturado';
                    notaEstado = `Parcialmente facturada: ${cochesFacturados}/${totalCoches} coches en factura ${numero_factura}`;
                } else {
                    continue;
                }

                if (nuevoEstado) {
                    if (isPostgreSQL) {
                        await this.db.query(`
                            UPDATE proformas 
                            SET estado = $1,
                                notas = CASE 
                                    WHEN notas IS NULL OR notas = '' THEN $2
                                    ELSE notas || ' | ' || $2
                                END
                            WHERE id = $3
                        `, [nuevoEstado, notaEstado, proforma.id]);
                    } else {
                        await new Promise((resolve, reject) => {
                            this.db.run(`
                                UPDATE proformas 
                                SET estado = ?,
                                    notas = CASE 
                                        WHEN notas IS NULL OR notas = '' THEN ?
                                        ELSE notas || ' | ' || ?
                                    END
                                WHERE id = ?
                            `, [nuevoEstado, notaEstado, notaEstado, proforma.id], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    }
                    this.cacheManager?.delPattern('proformas:*');
                }
            }
        }
    }
}

module.exports = FacturaService;

