const config = require('../config/config');

class AbonoService {
    constructor(db, logger, paginationManager) {
        this.db = db;
        this.logger = logger;
        this.paginationManager = paginationManager;
    }

    /**
     * Construir filtros para abonos
     */
    buildFilters(queryParams) {
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? true : 1;
        const likeOperator = dbType === 'postgresql' ? 'ILIKE' : 'LIKE';
        
        const search = queryParams.search || '';
        const empresaId = queryParams.empresa_id || '';
        const clienteId = queryParams.cliente_id || '';
        const fechaDesde = queryParams.fecha_desde || '';
        const fechaHasta = queryParams.fecha_hasta || '';
        
        const conditions = ['(a.activo = ? OR a.activo IS NULL)'];
        const params = [activoValue];
        let paramIndex = 1;
        
        if (search) {
            const likeValue = `%${search}%`;
            conditions.push(`(a.numero_abono ${likeOperator} ? OR c.nombre ${likeOperator} ? OR e.nombre ${likeOperator} ?)`);
            params.push(likeValue, likeValue, likeValue);
            paramIndex += 3;
        }
        
        if (empresaId) {
            conditions.push('a.empresa_id = ?');
            params.push(empresaId);
            paramIndex++;
        }
        
        if (clienteId) {
            conditions.push('a.cliente_id = ?');
            params.push(clienteId);
            paramIndex++;
        }
        
        if (fechaDesde) {
            conditions.push('a.fecha_emision >= ?');
            params.push(fechaDesde);
            paramIndex++;
        }
        
        if (fechaHasta) {
            conditions.push('a.fecha_emision <= ?');
            params.push(fechaHasta);
            paramIndex++;
        }
        
        return {
            whereClause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
            params
        };
    }

    /**
     * Obtener todos los abonos con paginación
     */
    async getAll(queryParams = {}) {
        const { page = 1, limit = 20, include_detalles = 'false' } = queryParams;
        const includeDetalles = include_detalles === 'true';
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        
        const { whereClause, params } = this.buildFilters(queryParams);
        
        // Usar paginationManager si está disponible
        if (this.paginationManager) {
            const joins = [
                { type: 'LEFT', table: 'clientes c', condition: 'a.cliente_id = c.id' },
                { type: 'LEFT', table: 'empresas e', condition: 'a.empresa_id = e.id' },
                { type: 'LEFT', table: 'facturas f', condition: 'a.factura_id = f.id' }
            ];
            
            const result = await this.paginationManager.getPaginatedDataWithJoins('abonos a', joins, {
                page: pageNum,
                limit: limitNum,
                where: whereClause.replace('WHERE ', ''),
                whereParams: params,
                orderBy: 'a.fecha_emision',
                orderDirection: 'DESC',
                select: `a.*, c.nombre as cliente_nombre, e.nombre as empresa_nombre, f.numero_factura as factura_numero`
            });
            
            let abonos = result.data || [];
            
            // Si se solicitan detalles, obtenerlos
            if (includeDetalles && abonos.length > 0) {
                for (const abono of abonos) {
                    abono.detalles = await this.getDetalles(abono.id);
                }
            }
            
            return {
                data: abonos,
                pagination: result.pagination
            };
        }
        
        // Fallback: consulta manual si no hay paginationManager
        const offset = (pageNum - 1) * limitNum;
        const query = `
            SELECT 
                a.*,
                c.nombre as cliente_nombre,
                e.nombre as empresa_nombre,
                f.numero_factura as factura_numero
            FROM abonos a
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN empresas e ON a.empresa_id = e.id
            LEFT JOIN facturas f ON a.factura_id = f.id
            ${whereClause}
            ORDER BY a.fecha_emision DESC, a.id DESC
            LIMIT ? OFFSET ?
        `;
        
        const queryParams_final = [...params, limitNum, offset];
        
        const abonos = await new Promise((resolve, reject) => {
            this.db.all(query, queryParams_final, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        // Obtener total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM abonos a
            LEFT JOIN clientes c ON a.cliente_id = c.id
            LEFT JOIN empresas e ON a.empresa_id = e.id
            ${whereClause}
        `;
        
        const totalResult = await new Promise((resolve, reject) => {
            this.db.get(countQuery, params, (err, row) => {
                if (err) reject(err);
                else resolve(row?.total || 0);
            });
        });
        
        const total = Number(totalResult);
        const totalPages = Math.ceil(total / limitNum);
        
        // Si se solicitan detalles, obtenerlos
        if (includeDetalles && abonos.length > 0) {
            for (const abono of abonos) {
                abono.detalles = await this.getDetalles(abono.id);
            }
        }
        
        return {
            data: abonos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                totalPages: totalPages
            }
        };
    }

    /**
     * Obtener detalles de un abono
     */
    async getDetalles(abonoId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT da.*, 
                       p.descripcion as producto_descripcion,
                       co.matricula as coche_matricula,
                       co.modelo as coche_modelo,
                       co.color as coche_color,
                       co.kms as coche_kms,
                       co.chasis as coche_chasis
                FROM detalles_abono da
                LEFT JOIN productos p ON da.producto_id = p.id
                LEFT JOIN coches co ON da.coche_id = co.id
                WHERE da.abono_id = ?
            `, [abonoId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Obtener abono por ID
     */
    async getById(id, includeDetalles = false) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    a.*,
                    c.nombre as cliente_nombre,
                    c.identificacion as cliente_identificacion,
                    e.nombre as empresa_nombre,
                    e.cif as empresa_cif,
                    f.numero_factura as factura_numero
                FROM abonos a
                LEFT JOIN clientes c ON a.cliente_id = c.id
                LEFT JOIN empresas e ON a.empresa_id = e.id
                LEFT JOIN facturas f ON a.factura_id = f.id
                WHERE a.id = ?
            `;
            
            this.db.get(query, [id], async (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!row) {
                    resolve(null);
                    return;
                }
                
                // Si se solicitan detalles, obtenerlos
                if (includeDetalles) {
                    try {
                        row.detalles = await this.getDetalles(id);
                    } catch (detallesError) {
                        this.logger.warn('Error obteniendo detalles del abono', { error: detallesError.message, abonoId: id });
                        row.detalles = [];
                    }
                }
                
                resolve(row);
            });
        });
    }
}

module.exports = AbonoService;



