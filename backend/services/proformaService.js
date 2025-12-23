const config = require('../config/config');

class ProformaService {
    constructor(db, logger, cacheManager, paginationManager) {
        this.db = db;
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.paginationManager = paginationManager;
    }

    /**
     * Obtener proformas con paginación y filtros
     */
    async getAll(queryParams) {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            empresa_id = '', 
            cliente_id = '', 
            coche_id = '',
            force_refresh = 'false'
        } = queryParams;

        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        const forceRefresh = force_refresh === 'true' || queryParams.no_cache === 'true';
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';

        // Verificar caché
        const cacheKey = `proformas:page:${page}:limit:${maxLimit}:search:${search}:empresa:${empresa_id}:cliente:${cliente_id}:coche:${coche_id}`;
        const cachedResult = !forceRefresh ? this.cacheManager?.get(cacheKey) : null;

        if (cachedResult && !forceRefresh) {
            // Verificación rápida del total de proformas
            try {
                const quickCheck = await new Promise((resolve) => {
                    try {
                        this.db.get(`SELECT COUNT(*) as total FROM proformas WHERE (activo = ${activoValue} OR activo IS NULL)`, [], (err, row) => {
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
                        this.cacheManager?.delPattern('proformas:*');
                    }
                } else {
                    return { ...cachedResult, cached: true };
                }
            } catch (error) {
                return { ...cachedResult, cached: true };
            }
        }

        // Construir consulta con filtros
        let whereConditions = [`(p.activo = ${activoValue} OR p.activo IS NULL)`];
        let whereParams = [];

        if (search) {
            whereConditions.push('(p.numero_proforma LIKE ? OR c.nombre LIKE ? OR e.nombre LIKE ?)');
            whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (empresa_id) {
            whereConditions.push('p.empresa_id = ?');
            whereParams.push(empresa_id);
        }

        if (cliente_id) {
            whereConditions.push('p.cliente_id = ?');
            whereParams.push(cliente_id);
        }

        if (coche_id) {
            whereConditions.push('p.coche_id = ?');
            whereParams.push(coche_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const joins = [
            { type: 'LEFT', table: 'clientes c', condition: 'p.cliente_id = c.id' },
            { type: 'LEFT', table: 'empresas e', condition: 'p.empresa_id = e.id' },
            { type: 'LEFT', table: 'coches co', condition: 'p.coche_id = co.id' }
        ];

        const result = await this.paginationManager.getPaginatedDataWithJoins('proformas p', joins, {
            page: parseInt(page),
            limit: maxLimit,
            where: whereClause,
            whereParams: whereParams,
            orderBy: 'COALESCE(p.fecha_creacion, p.fecha_emision)',
            orderDirection: 'DESC',
            select: `p.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion, e.nombre as empresa_nombre, e.cif as empresa_cif, co.matricula as coche_matricula, co.modelo as coche_modelo, co.marca as coche_marca,
                     (SELECT COUNT(*) FROM detalles_proforma dp WHERE dp.proforma_id = p.id AND dp.coche_id IS NOT NULL) as coches_count`
        });

        const responsePayload = {
            data: result.data || [],
            pagination: result.pagination
        };

        // Guardar en caché con TTL de 30 segundos
        this.cacheManager?.set(cacheKey, responsePayload, 30);

        return { ...responsePayload, cached: false };
    }

    /**
     * Obtener proforma por ID
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT p.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion, c.identificacion as cliente_identificacion,
                       e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                       co.matricula as coche_matricula, co.modelo as coche_modelo, co.marca as coche_marca, co.color as coche_color, co.kms as coche_kms, co.chasis as coche_chasis
                FROM proformas p 
                LEFT JOIN clientes c ON p.cliente_id = c.id 
                LEFT JOIN empresas e ON p.empresa_id = e.id
                LEFT JOIN coches co ON p.coche_id = co.id
                WHERE p.id = ?
            `, [id], async (err, proforma) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!proforma) {
                    resolve(null);
                    return;
                }

                // Obtener detalles
                try {
                    const detalles = await new Promise((resolveDet, rejectDet) => {
                        this.db.all(`
                            SELECT dp.*, COALESCE(dp.descripcion, pr.descripcion) as descripcion, COALESCE(dp.tipo_impuesto, 'igic') as tipo_impuesto,
                                   co.matricula as coche_matricula, co.chasis as coche_chasis, co.color as coche_color, 
                                   co.kms as coche_kms, co.modelo as coche_modelo, co.marca as coche_marca
                            FROM detalles_proforma dp
                            LEFT JOIN productos pr ON dp.producto_id = pr.id
                            LEFT JOIN coches co ON dp.coche_id = co.id
                            WHERE dp.proforma_id = ?
                        `, [id], (err, rows) => {
                            if (err) rejectDet(err);
                            else resolveDet(rows || []);
                        });
                    });

                    proforma.detalles = detalles;
                    resolve(proforma);
                } catch (error) {
                    proforma.detalles = [];
                    resolve(proforma);
                }
            });
        });
    }

    /**
     * Obtener siguiente número de proforma para una empresa
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

        // Buscar el último número de proforma
        const ultimoNumero = await new Promise((resolve, reject) => {
            this.db.get(`
                SELECT MAX(CAST(SUBSTR(numero_proforma, ${prefijo.length + 1}, 3) AS INTEGER)) as ultimo_numero
                FROM proformas 
                WHERE empresa_id = ? AND numero_proforma LIKE '${prefijo}%/${año}'
            `, [empresaIdNumero], (err, row) => {
                if (err) reject(err);
                else resolve(row?.ultimo_numero || 0);
            });
        });

        const siguienteNumero = ultimoNumero + 1;
        const numeroFormateado = `${prefijo}${siguienteNumero.toString().padStart(3, '0')}/${año}`;

        // Verificar que el número no existe
        const existe = await new Promise((resolve, reject) => {
            this.db.get("SELECT id FROM proformas WHERE numero_proforma = ? AND empresa_id = ?", 
                [numeroFormateado, empresaIdNumero], (err, row) => {
                    if (err) reject(err);
                    else resolve(!!row);
                });
        });

        if (existe) {
            throw new Error(`El número ${numeroFormateado} ya existe. Contacte al administrador.`);
        }

        return {
            numero_proforma: numeroFormateado,
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
     * Crear proforma
     */
    async create(data) {
        const { productos, ...proformaData } = data;
        
        // Validar empresa_id
        if (!proformaData.empresa_id) {
            throw new Error('empresa_id es obligatorio para crear una proforma');
        }
        
        // Verificar que la empresa existe
        const empresaExiste = await new Promise((resolve, reject) => {
            this.db.get("SELECT id, nombre FROM empresas WHERE id = ?", [proformaData.empresa_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!empresaExiste) {
            throw new Error(`La empresa con ID ${proformaData.empresa_id} no existe en la base de datos`);
        }
        
        // Validar número de proforma único si se proporciona
        if (proformaData.numero_proforma) {
            const numeroExiste = await new Promise((resolve, reject) => {
                this.db.get("SELECT id FROM proformas WHERE numero_proforma = ? AND empresa_id = ?", 
                    [proformaData.numero_proforma, proformaData.empresa_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(!!row);
                    });
            });
            
            if (numeroExiste) {
                throw new Error(`El número de proforma "${proformaData.numero_proforma}" ya existe para la empresa "${empresaExiste.nombre}"`);
            }
        }
        
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? true : 1;
        
        // Insertar proforma
        const query = `
            INSERT INTO proformas (
                numero_proforma, empresa_id, cliente_id, coche_id, fecha_emision, fecha_validez,
                subtotal, igic, total, notas, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            proformaData.numero_proforma, 
            proformaData.empresa_id, 
            proformaData.cliente_id || null, 
            proformaData.coche_id || null, 
            proformaData.fecha_emision, 
            proformaData.fecha_validez || null,
            proformaData.subtotal, 
            proformaData.igic, 
            proformaData.total, 
            proformaData.notas || null, 
            activoValue
        ];
        
        const proformaId = await new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        
        // Insertar detalles si se proporcionan
        if (productos && Array.isArray(productos) && productos.length > 0) {
            for (const producto of productos) {
                const productoId = producto.id && producto.id > 0 ? producto.id : null;
                const cocheIdDetalle = producto.coche_id || producto.cocheId || producto.cocheID || proformaData.coche_id || null;
                
                await new Promise((resolve, reject) => {
                    const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                    const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                    const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                    const cantidad = producto.cantidad || 1;
                    
                    this.db.run(`
                        INSERT INTO detalles_proforma (proforma_id, producto_id, coche_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [proformaId, productoId, cocheIdDetalle, cantidad, precioUnitario, producto.subtotal || (precioUnitario * cantidad), igic, producto.total || (precioUnitario * cantidad + igic), producto.descripcion || null, tipoImpuesto], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }
        
        // Invalidar caché
        this.cacheManager?.delPattern('proformas:*');
        
        return {
            id: proformaId,
            numero_proforma: proformaData.numero_proforma,
            total: proformaData.total
        };
    }

    /**
     * Actualizar proforma
     */
    async update(id, data) {
        const { productos, ...proformaData } = data;
        
        // Construir actualización
        const updates = [];
        const values = [];
        
        const camposPermitidos = [
            'numero_proforma', 'empresa_id', 'cliente_id', 'coche_id',
            'fecha_emision', 'fecha_validez', 'subtotal', 'igic', 'total', 'notas', 'estado'
        ];
        
        camposPermitidos.forEach(campo => {
            if (proformaData[campo] !== undefined) {
                updates.push(`${campo} = ?`);
                values.push(proformaData[campo]);
            }
        });
        
        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }
        
        values.push(id);
        
        // Actualizar proforma
        await new Promise((resolve, reject) => {
            this.db.run(`UPDATE proformas SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
                if (err) reject(err);
                else {
                    if (this.changes === 0) {
                        reject(new Error('Proforma no encontrada'));
                    } else {
                        resolve();
                    }
                }
            });
        });
        
        // Si se proporcionan productos, actualizar detalles
        if (productos && Array.isArray(productos)) {
            // Eliminar detalles existentes
            await new Promise((resolve, reject) => {
                this.db.run('DELETE FROM detalles_proforma WHERE proforma_id = ?', [id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Insertar nuevos detalles
            const dbType = config.get('database.type') || 'postgresql';
            for (const producto of productos) {
                const productoId = producto.id && producto.id > 0 ? producto.id : null;
                const cocheIdDetalle = producto.coche_id || producto.cocheId || producto.cocheID || proformaData.coche_id || null;
                
                await new Promise((resolve, reject) => {
                    const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                    const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                    const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                    const cantidad = producto.cantidad || 1;
                    
                    this.db.run(`
                        INSERT INTO detalles_proforma (proforma_id, producto_id, coche_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [id, productoId, cocheIdDetalle, cantidad, precioUnitario, producto.subtotal || (precioUnitario * cantidad), igic, producto.total || (precioUnitario * cantidad + igic), producto.descripcion || null, tipoImpuesto], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }
        
        // Invalidar caché
        this.cacheManager?.delPattern('proformas:*');
        
        // Retornar proforma actualizada
        return await this.getById(id);
    }

    /**
     * Eliminar proforma
     */
    async delete(id) {
        // Eliminar detalles primero
        await new Promise((resolve, reject) => {
            this.db.run('DELETE FROM detalles_proforma WHERE proforma_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Eliminar proforma
        const changes = await new Promise((resolve, reject) => {
            this.db.run('DELETE FROM proformas WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        if (changes === 0) {
            throw new Error('Proforma no encontrada');
        }
        
        // Invalidar caché
        this.cacheManager?.delPattern('proformas:*');
        
        return { success: true };
    }
}

module.exports = ProformaService;

