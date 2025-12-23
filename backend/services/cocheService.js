const config = require('../config/config');

class CocheService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Obtener todos los coches
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;
            const vendidoValue = dbType === 'postgresql' ? false : 0;

            // Usar subconsultas para evitar duplicados cuando hay múltiples proformas o facturas
            this.db.all(`
                SELECT DISTINCT c.*,
                       CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                       f.numero_factura,
                       f.fecha_emision as fecha_venta,
                       f.total as precio_venta,
                       cl.nombre as cliente_nombre,
                       (SELECT p2.numero_proforma FROM proformas p2 
                        WHERE (p2.coche_id = c.id OR EXISTS (
                            SELECT 1 FROM detalles_proforma dp2 
                            WHERE dp2.proforma_id = p2.id 
                            AND dp2.coche_id = c.id
                        ))
                        AND (p2.activo = ? OR p2.activo IS NULL) 
                        ORDER BY p2.fecha_creacion DESC LIMIT 1) as numero_proforma,
                       CASE WHEN EXISTS (
                           SELECT 1 FROM proformas p3 
                           WHERE (p3.coche_id = c.id OR EXISTS (
                               SELECT 1 FROM detalles_proforma dp3 
                               WHERE dp3.proforma_id = p3.id 
                               AND dp3.coche_id = c.id
                           ))
                           AND (p3.activo = ? OR p3.activo IS NULL)
                       ) THEN 1 ELSE 0 END as tiene_proforma
                FROM coches c
                LEFT JOIN detalles_factura df ON df.coche_id = c.id
                LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE (c.activo = ? OR c.activo = ? OR c.activo IS NULL)
                ORDER BY c.fecha_creacion DESC
            `, [activoValue, activoValue, activoValue, vendidoValue], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Obtener coches disponibles (no vendidos y opcionalmente no proformados)
     * @param {boolean} excluirProformados - Si es true, excluye coches con proformas activas (para inventario). Si es false, solo excluye vendidos (para crear proformas/facturas)
     */
    async getDisponibles(excluirProformados = true) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            // Si excluirProformados es false, incluir información de proformas
            if (excluirProformados) {
                // Query para inventario (excluye proformados, no necesita info de proformas)
                let query = `
                    SELECT c.*,
                           0 as vendido,
                           NULL as numero_factura,
                           NULL as fecha_venta,
                           NULL as precio_venta,
                           NULL as cliente_nombre,
                           NULL as numero_proforma,
                           0 as tiene_proforma
                    FROM coches c
                    WHERE c.activo = ?
                    AND NOT EXISTS (
                        SELECT 1 FROM detalles_factura df
                        INNER JOIN facturas f ON df.factura_id = f.id
                        WHERE df.coche_id = c.id
                        AND f.estado IN ('pagada', 'pendiente')
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM proformas p
                        WHERE (p.coche_id = c.id OR EXISTS (
                            SELECT 1 FROM detalles_proforma dp 
                            WHERE dp.proforma_id = p.id 
                            AND dp.coche_id = c.id
                        ))
                        AND (p.activo = ? OR p.activo IS NULL)
                    )
                    ORDER BY c.fecha_creacion DESC
                `;

                this.db.all(query, [activoValue, activoValue], (err, rows) => {
                    if (err) {
                        this.logger?.error('Error en getDisponibles', { error: err.message, query, params: [activoValue, activoValue] }, 'database');
                        reject(err);
                        return;
                    }
                    this.logger?.debug('getDisponibles completado (excluyendo proformados)', { 
                        excluirProformados, 
                        cochesEncontrados: rows?.length || 0 
                    }, 'database');
                    resolve(rows || []);
                });
            } else {
                // Query para proformas/facturas (incluye proformados con información de proformas)
                let query = `
                    SELECT DISTINCT c.*,
                           0 as vendido,
                           NULL as numero_factura,
                           NULL as fecha_venta,
                           NULL as precio_venta,
                           NULL as cliente_nombre,
                           (SELECT p2.numero_proforma FROM proformas p2
                            WHERE (p2.coche_id = c.id OR EXISTS (
                                SELECT 1 FROM detalles_proforma dp2
                                WHERE dp2.proforma_id = p2.id
                                AND dp2.coche_id = c.id
                            ))
                            AND (p2.activo = ? OR p2.activo IS NULL)
                            ORDER BY p2.fecha_creacion DESC LIMIT 1) as numero_proforma,
                           CASE WHEN EXISTS (
                               SELECT 1 FROM proformas p3
                               WHERE (p3.coche_id = c.id OR EXISTS (
                                   SELECT 1 FROM detalles_proforma dp3
                                   WHERE dp3.proforma_id = p3.id
                                   AND dp3.coche_id = c.id
                               ))
                               AND (p3.activo = ? OR p3.activo IS NULL)
                           ) THEN CAST(1 AS INTEGER) ELSE CAST(0 AS INTEGER) END as tiene_proforma
                    FROM coches c
                    WHERE c.activo = ?
                    AND NOT EXISTS (
                        SELECT 1 FROM detalles_factura df
                        INNER JOIN facturas f ON df.factura_id = f.id
                        WHERE df.coche_id = c.id
                        AND f.estado IN ('pagada', 'pendiente')
                    )
                    ORDER BY c.fecha_creacion DESC
                `;

                this.db.all(query, [activoValue, activoValue, activoValue], (err, rows) => {
                    if (err) {
                        this.logger?.error('Error en getDisponibles', { error: err.message, query, params: [activoValue, activoValue, activoValue] }, 'database');
                        reject(err);
                        return;
                    }
                    
                    // Normalizar valores de tiene_proforma para asegurar consistencia
                    const rowsNormalizados = rows.map(row => ({
                        ...row,
                        tiene_proforma: row.tiene_proforma === 1 || row.tiene_proforma === true || row.tiene_proforma === '1' ? 1 : 0
                    }));
                    
                    this.logger?.debug('getDisponibles completado (incluyendo proformados)', { 
                        excluirProformados, 
                        cochesEncontrados: rowsNormalizados?.length || 0,
                        cochesConProforma: rowsNormalizados?.filter(r => r.tiene_proforma === 1).length || 0,
                        ejemploCoche: rowsNormalizados?.[0] ? {
                            id: rowsNormalizados[0].id,
                            matricula: rowsNormalizados[0].matricula,
                            tiene_proforma: rowsNormalizados[0].tiene_proforma,
                            numero_proforma: rowsNormalizados[0].numero_proforma
                        } : null
                    }, 'database');
                    
                    resolve(rowsNormalizados || []);
                });
            }
        });
    }

    /**
     * Obtener coches vendidos
     */
    async getVendidos() {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            this.db.all(`
                SELECT c.*,
                       1 as vendido,
                       f.numero_factura,
                       f.fecha_emision as fecha_venta,
                       f.total as precio_venta,
                       cl.nombre as cliente_nombre,
                       cl.id as cliente_id,
                       f.id as factura_id,
                       f.estado as estado_factura,
                       (SELECT p2.numero_proforma FROM proformas p2 
                        WHERE (p2.coche_id = c.id OR p2.id IN (SELECT dp2.proforma_id FROM detalles_proforma dp2 WHERE dp2.coche_id = c.id))
                        AND (p2.activo = ? OR p2.activo IS NULL) LIMIT 1) as numero_proforma,
                       CASE WHEN EXISTS (
                           SELECT 1 FROM proformas p3 
                           WHERE (p3.coche_id = c.id OR p3.id IN (SELECT dp3.proforma_id FROM detalles_proforma dp3 WHERE dp3.coche_id = c.id))
                           AND (p3.activo = ? OR p3.activo IS NULL)
                       ) THEN 1 ELSE 0 END as tiene_proforma
                FROM coches c
                INNER JOIN detalles_factura df ON df.coche_id = c.id
                INNER JOIN facturas f ON df.factura_id = f.id
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE (c.activo = ? OR c.activo IS NULL)
                AND f.estado IN ('pagada', 'pendiente')
                ORDER BY f.fecha_emision DESC, c.fecha_creacion DESC
            `, [activoValue, activoValue, activoValue], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Obtener coche por ID
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            this.db.get('SELECT * FROM coches WHERE id = ? AND activo = ?', [id, activoValue], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Verificar si un coche está vendido
     */
    async isVendido(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT c.id, c.matricula,
                       CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                       f.numero_factura,
                       f.id as factura_id
                FROM coches c
                LEFT JOIN detalles_factura df ON df.coche_id = c.id
                LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                WHERE c.id = ? AND f.id IS NOT NULL
                LIMIT 1
            `, [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row && row.vendido === 1);
            });
        });
    }

    /**
     * Verificar si una matrícula está duplicada
     */
    async matriculaExiste(matricula, excludeId = null) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            let query = 'SELECT id FROM coches WHERE matricula = ? AND activo = ?';
            let params = [matricula, activoValue];

            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }

            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(!!row);
            });
        });
    }

    /**
     * Extraer marca y modelo del campo modelo
     */
    extractMarcaModelo(modelo) {
        if (!modelo) {
            return { marca: null, modelo: null };
        }

        const partes = modelo.trim().split(' ');
        if (partes.length === 0) {
            return { marca: null, modelo: modelo };
        }

        const marca = partes[0];
        const modeloFinal = partes.length > 1 ? partes.slice(1).join(' ') : modelo;

        return { marca, modelo: modeloFinal };
    }

    /**
     * Crear nuevo coche
     */
    async create(cocheData) {
        const { matricula, chasis, color, kms, modelo, marca } = cocheData;

        // Validar datos requeridos
        if (!matricula || !chasis || !color || kms === undefined || kms === null || !modelo) {
            throw new Error('Faltan datos requeridos: matricula, chasis, color, kms, modelo');
        }

        // Extraer marca y modelo si no se proporciona marca
        let marcaFinal = marca;
        let modeloFinal = modelo;
        if (!marcaFinal && modeloFinal) {
            const extracted = this.extractMarcaModelo(modeloFinal);
            marcaFinal = extracted.marca;
            modeloFinal = extracted.modelo;
        }

        // Verificar que la matrícula no esté duplicada
        const matriculaDuplicada = await this.matriculaExiste(matricula);
        if (matriculaDuplicada) {
            const error = new Error('La matrícula ya existe');
            error.code = 'DUPLICATE_MATRICULA';
            error.statusCode = 409;
            throw error;
        }

        // Insertar coche
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO coches (matricula, chasis, color, kms, modelo, marca)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [matricula, chasis, color, kms, modeloFinal, marcaFinal || null], function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    id: this.lastID,
                    matricula,
                    chasis,
                    color,
                    kms,
                    modelo: modeloFinal,
                    marca: marcaFinal
                });
            });
        });
    }

    /**
     * Actualizar coche
     */
    async update(id, cocheData) {
        const { matricula, chasis, color, kms, modelo, marca } = cocheData;

        // Verificar si el coche está vendido
        const vendido = await this.isVendido(id);
        if (vendido) {
            const error = new Error('No se puede modificar un vehículo vendido');
            error.code = 'COCHE_VENDIDO';
            error.statusCode = 403;
            throw error;
        }

        // Extraer marca y modelo si es necesario
        let marcaFinal = marca;
        let modeloFinal = modelo;
        if (modeloFinal && !marcaFinal) {
            const extracted = this.extractMarcaModelo(modeloFinal);
            marcaFinal = extracted.marca;
            modeloFinal = extracted.modelo;
        }

        // Si se está actualizando la matrícula, verificar que no esté duplicada
        if (matricula) {
            const matriculaDuplicada = await this.matriculaExiste(matricula, id);
            if (matriculaDuplicada) {
                const error = new Error('La matrícula ya existe');
                error.code = 'DUPLICATE_MATRICULA';
                error.statusCode = 409;
                throw error;
            }
        }

        // Construir la consulta dinámicamente
        const updates = [];
        const values = [];

        if (matricula !== undefined) {
            updates.push('matricula = ?');
            values.push(matricula);
        }
        if (chasis !== undefined) {
            updates.push('chasis = ?');
            values.push(chasis);
        }
        if (color !== undefined) {
            updates.push('color = ?');
            values.push(color);
        }
        if (kms !== undefined) {
            updates.push('kms = ?');
            values.push(kms);
        }
        if (modeloFinal !== undefined) {
            updates.push('modelo = ?');
            values.push(modeloFinal);
        }
        if (marcaFinal !== undefined) {
            updates.push('marca = ?');
            values.push(marcaFinal || null);
        }

        if (updates.length === 0) {
            throw new Error('No hay campos válidos para actualizar');
        }

        values.push(id);

        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? true : 1;
        const query = `UPDATE coches SET ${updates.join(', ')} WHERE id = ? AND activo = ?`;
        values.push(activoValue);

        return new Promise((resolve, reject) => {
            this.db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    reject(new Error('Coche no encontrado o inactivo'));
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }

    /**
     * Eliminar coche (soft delete)
     */
    async delete(id) {
        // Verificar si el coche está vendido
        const vendido = await this.isVendido(id);
        if (vendido) {
            const error = new Error('No se puede eliminar un vehículo vendido');
            error.code = 'COCHE_VENDIDO';
            error.statusCode = 403;
            throw error;
        }

        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? false : 0;

        return new Promise((resolve, reject) => {
            this.db.run('UPDATE coches SET activo = ? WHERE id = ?', [activoValue, id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    reject(new Error('Coche no encontrado'));
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }
}

module.exports = CocheService;



