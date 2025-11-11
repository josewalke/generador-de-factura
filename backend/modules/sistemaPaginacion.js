// Sistema de Paginación Optimizado para Grandes Volúmenes de Datos
const sqlite3 = require('sqlite3').verbose();

class PaginationManager {
    constructor(config) {
        this.config = config.pagination;
        this.db = null;
    }

    /**
     * Establece la conexión a la base de datos
     */
    setDatabase(db) {
        this.db = db;
    }

    /**
     * Ejecuta una consulta paginada
     */
    async executePaginatedQuery(query, params = [], options = {}) {
        const {
            page = 1,
            limit = this.config.defaultLimit,
            offset = null,
            orderBy = null,
            orderDirection = 'ASC'
        } = options;

        // Validar límites
        const validatedLimit = Math.min(limit, this.config.maxLimit);
        const validatedOffset = offset !== null ? offset : (page - 1) * validatedLimit;

        // Construir consulta con ORDER BY si se especifica
        let finalQuery = query;
        if (orderBy) {
            finalQuery += ` ORDER BY ${orderBy} ${orderDirection}`;
        }

        // Agregar LIMIT y OFFSET
        finalQuery += ` LIMIT ? OFFSET ?`;

        const finalParams = [...params, validatedLimit, validatedOffset];

        try {
            const rows = await this.executeQuery(finalQuery, finalParams);
            const totalCount = await this.getTotalCount(query, params);
            
            return {
                data: rows,
                pagination: {
                    page,
                    limit: validatedLimit,
                    offset: validatedOffset,
                    totalCount,
                    totalPages: Math.ceil(totalCount / validatedLimit),
                    hasNext: page < Math.ceil(totalCount / validatedLimit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('❌ Error en consulta paginada:', error);
            throw error;
        }
    }

    /**
     * Ejecuta una consulta SQL
     */
    executeQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no está disponible'));
                return;
            }
            
            if (this.db.all) {
                // Usar método all con callback (SQLite o wrapper)
                this.db.all(query, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            } else if (this.db.query) {
                // Usar método query async (PostgreSQL directo)
                this.db.query(query, params)
                    .then(result => resolve(result.rows))
                    .catch(reject);
            } else {
                reject(new Error('Método de base de datos no disponible'));
            }
        });
    }

    /**
     * Obtiene el conteo total para una consulta
     */
    getTotalCount(query, params = []) {
        return new Promise((resolve, reject) => {
            // Crear consulta de conteo basada en la consulta original
            const countQuery = this.buildCountQuery(query);
            
            this.db.get(countQuery, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count || 0);
                }
            });
        });
    }

    /**
     * Construye una consulta de conteo basada en la consulta original
     */
    buildCountQuery(query) {
        // Remover ORDER BY, LIMIT, OFFSET de la consulta original
        let countQuery = query
            .replace(/ORDER\s+BY\s+[^;]+/gi, '')
            .replace(/LIMIT\s+\d+/gi, '')
            .replace(/OFFSET\s+\d+/gi, '');

        // Si la consulta tiene JOINs complejos, usar subconsulta
        if (countQuery.includes('JOIN') || countQuery.includes('GROUP BY')) {
            countQuery = `SELECT COUNT(*) as count FROM (${countQuery}) as count_table`;
        } else {
            // Reemplazar SELECT con COUNT
            countQuery = countQuery.replace(/SELECT\s+.*?\s+FROM/i, 'SELECT COUNT(*) as count FROM');
        }

        return countQuery;
    }

    /**
     * Obtiene datos paginados para una tabla específica
     */
    async getPaginatedData(tableName, options = {}) {
        const {
            page = 1,
            limit = this.config.defaultLimit,
            where = null,
            whereParams = [],
            orderBy = 'id',
            orderDirection = 'DESC',
            select = '*'
        } = options;

        let query = `SELECT ${select} FROM ${tableName}`;
        
        if (where) {
            query += ` WHERE ${where}`;
        }

        return await this.executePaginatedQuery(query, whereParams, {
            page,
            limit,
            orderBy,
            orderDirection
        });
    }

    /**
     * Obtiene datos paginados con JOINs
     */
    async getPaginatedDataWithJoins(mainTable, joins, options = {}) {
        const {
            page = 1,
            limit = this.config.defaultLimit,
            where = null,
            whereParams = [],
            orderBy = `${mainTable}.id`,
            orderDirection = 'DESC',
            select = '*'
        } = options;

        let query = `SELECT ${select} FROM ${mainTable}`;
        
        // Agregar JOINs
        joins.forEach(join => {
            query += ` ${join.type || 'LEFT'} JOIN ${join.table} ON ${join.condition}`;
        });
        
        if (where) {
            query += ` WHERE ${where}`;
        }

        return await this.executePaginatedQuery(query, whereParams, {
            page,
            limit,
            orderBy,
            orderDirection
        });
    }

    /**
     * Obtiene estadísticas de paginación para una tabla
     */
    async getPaginationStats(tableName, where = null, whereParams = []) {
        let query = `SELECT COUNT(*) as total FROM ${tableName}`;
        
        if (where) {
            query += ` WHERE ${where}`;
        }

        const result = await this.executeQuery(query, whereParams);
        const total = result[0].total;

        return {
            total,
            totalPages: Math.ceil(total / this.config.defaultLimit),
            averagePageSize: Math.ceil(total / Math.ceil(total / this.config.defaultLimit))
        };
    }

    /**
     * Optimiza consultas para grandes volúmenes de datos
     */
    async optimizeQueryForLargeData(query, params = [], options = {}) {
        const {
            useIndex = true,
            batchSize = 1000,
            useStreaming = false
        } = options;

        // Si es una consulta de conteo, usar aproximación para grandes volúmenes
        if (query.includes('COUNT(*)') && useIndex) {
            // Usar índices para estimar conteo en lugar de contar filas
            const estimatedCount = await this.getEstimatedCount(query, params);
            if (estimatedCount > 100000) {
                return { estimated: true, count: estimatedCount };
            }
        }

        // Para consultas grandes, usar streaming
        if (useStreaming) {
            return await this.executeStreamingQuery(query, params, batchSize);
        }

        return await this.executeQuery(query, params);
    }

    /**
     * Obtiene conteo estimado usando índices
     */
    async getEstimatedCount(query, params = []) {
        return new Promise((resolve, reject) => {
            // Usar sqlite_stat1 para obtener estadísticas de índices
            const statsQuery = `
                SELECT name, stat FROM sqlite_stat1 
                WHERE tbl = ? AND idx IS NOT NULL
            `;
            
            this.db.get(statsQuery, [this.extractTableName(query)], (err, row) => {
                if (err || !row) {
                    // Fallback a conteo normal
                    this.getTotalCount(query, params).then(resolve).catch(reject);
                } else {
                    resolve(parseInt(row.stat.split(' ')[0]) || 0);
                }
            });
        });
    }

    /**
     * Extrae el nombre de la tabla de una consulta
     */
    extractTableName(query) {
        const match = query.match(/FROM\s+(\w+)/i);
        return match ? match[1] : null;
    }

    /**
     * Ejecuta consulta con streaming para grandes volúmenes
     */
    async executeStreamingQuery(query, params = [], batchSize = 1000) {
        return new Promise((resolve, reject) => {
            const results = [];
            let offset = 0;
            let hasMore = true;

            const processBatch = () => {
                const batchQuery = `${query} LIMIT ? OFFSET ?`;
                const batchParams = [...params, batchSize, offset];

                this.db.all(batchQuery, batchParams, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    results.push(...rows);
                    
                    if (rows.length < batchSize) {
                        hasMore = false;
                        resolve(results);
                    } else {
                        offset += batchSize;
                        setImmediate(processBatch);
                    }
                });
            };

            processBatch();
        });
    }

    /**
     * Crea índices optimizados para paginación
     */
    async createPaginationIndexes() {
        const indexes = [
            // Índices para facturas
            'CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON facturas(fecha_emision DESC)',
            'CREATE INDEX IF NOT EXISTS idx_facturas_empresa_fecha ON facturas(empresa_id, fecha_emision DESC)',
            'CREATE INDEX IF NOT EXISTS idx_facturas_cliente_fecha ON facturas(cliente_id, fecha_emision DESC)',
            
            // Índices para clientes
            'CREATE INDEX IF NOT EXISTS idx_clientes_identificacion ON clientes(identificacion)',
            'CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre)',
            
            // Índices para productos
            'CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo)',
            'CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria)',
            'CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo)',
            
            // Índices para coches
            'CREATE INDEX IF NOT EXISTS idx_coches_matricula ON coches(matricula)',
            'CREATE INDEX IF NOT EXISTS idx_coches_modelo ON coches(modelo)',
            'CREATE INDEX IF NOT EXISTS idx_coches_activo ON coches(activo)',
            
            // Índices para detalles de factura
            'CREATE INDEX IF NOT EXISTS idx_detalles_factura_id ON detalles_factura(factura_id)',
            'CREATE INDEX IF NOT EXISTS idx_detalles_producto_id ON detalles_factura(producto_id)',
            
            // Índices para auditoría
            'CREATE INDEX IF NOT EXISTS idx_audit_log_tabla_id ON audit_log(tabla, registro_id)',
            'CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON audit_log(fecha_operacion DESC)',
            'CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id)'
        ];

        for (const indexQuery of indexes) {
            try {
                await this.executeQuery(indexQuery);
                // Solo logear índices importantes
                const indexName = indexQuery.split(' ')[5];
                if (indexName && (indexName.includes('facturas') || indexName.includes('clientes'))) {
                    console.log(`✅ Índice creado: ${indexName}`);
                }
            } catch (error) {
                // Solo logear errores importantes
                if (!error.message.includes('no such table')) {
                    console.error(`❌ Error creando índice: ${error.message}`);
                }
            }
        }
    }

    /**
     * Analiza el rendimiento de una consulta
     */
    async analyzeQueryPerformance(query, params = []) {
        const startTime = Date.now();
        
        try {
            const result = await this.executeQuery(query, params);
            const executionTime = Date.now() - startTime;
            
            return {
                success: true,
                executionTime,
                rowCount: result.length,
                performance: {
                    fast: executionTime < 100,
                    medium: executionTime < 500,
                    slow: executionTime >= 500
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }
}

module.exports = PaginationManager;
