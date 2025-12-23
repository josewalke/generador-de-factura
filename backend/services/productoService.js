const config = require('../config/config');

class ProductoService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Obtener todos los productos activos
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            this.db.all('SELECT * FROM productos WHERE activo = ? ORDER BY descripcion', [activoValue], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Obtener producto por ID
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            this.db.get('SELECT * FROM productos WHERE id = ? AND activo = ?', [id, activoValue], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Buscar producto por código
     */
    async buscarPorCodigo(codigo) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            this.db.get('SELECT * FROM productos WHERE codigo = ? AND activo = ?', [codigo, activoValue], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Verificar si un código de producto ya existe
     */
    async codigoExiste(codigo, excludeId = null) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? true : 1;

            let query = 'SELECT id FROM productos WHERE codigo = ? AND activo = ?';
            let params = [codigo, activoValue];

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
     * Crear nuevo producto
     */
    async create(productoData) {
        const { codigo, descripcion, precio, stock, categoria } = productoData;

        // Validar campos obligatorios
        if (!codigo || !descripcion || precio === undefined) {
            throw new Error('Campos obligatorios faltantes: codigo, descripcion, precio');
        }

        // Verificar que el código no esté duplicado
        const codigoExiste = await this.codigoExiste(codigo);
        if (codigoExiste) {
            const error = new Error('El código ya existe');
            error.code = 'DUPLICATE_CODIGO';
            error.statusCode = 409;
            throw error;
        }

        // Insertar producto
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
                VALUES (?, ?, ?, ?, ?)
            `, [codigo, descripcion, precio, stock, categoria], function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    id: this.lastID,
                    codigo,
                    descripcion,
                    precio,
                    stock,
                    categoria
                });
            });
        });
    }

    /**
     * Crear producto desde coche
     */
    async createDesdeCoche(cocheId, precio, cantidad = 1) {
        // Obtener los datos del coche
        const coche = await new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM coches WHERE id = ? AND activo = 1', [cocheId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });

        if (!coche) {
            throw new Error('Coche no encontrado o inactivo');
        }

        // Generar código único basado en la matrícula
        const codigo = coche.matricula;

        // Verificar que el código no esté duplicado
        const codigoExiste = await this.codigoExiste(codigo);
        if (codigoExiste) {
            const error = new Error('Ya existe un producto para este coche');
            error.code = 'DUPLICATE_PRODUCTO_COCHE';
            error.statusCode = 409;
            throw error;
        }

        // Generar descripción automática
        const descripcion = `${coche.modelo} - ${coche.matricula} - ${coche.color} - ${coche.kms.toLocaleString()} km`;

        // Crear el producto
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
                VALUES (?, ?, ?, ?, ?)
            `, [codigo, descripcion, precio, cantidad, 'vehiculo'], function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    id: this.lastID,
                    codigo,
                    descripcion,
                    precio,
                    stock: cantidad,
                    categoria: 'vehiculo',
                    coche: coche
                });
            });
        });
    }

    /**
     * Actualizar producto
     */
    async update(id, productoData) {
        const { codigo, descripcion, precio, stock, categoria } = productoData;

        // Si se está actualizando el código, verificar que no esté duplicado
        if (codigo) {
            const codigoExiste = await this.codigoExiste(codigo, id);
            if (codigoExiste) {
                const error = new Error('El código ya existe');
                error.code = 'DUPLICATE_CODIGO';
                error.statusCode = 409;
                throw error;
            }
        }

        // Construir la consulta dinámicamente
        const updates = [];
        const values = [];

        if (codigo !== undefined) {
            updates.push('codigo = ?');
            values.push(codigo);
        }
        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            values.push(descripcion);
        }
        if (precio !== undefined) {
            updates.push('precio = ?');
            values.push(precio);
        }
        if (stock !== undefined) {
            updates.push('stock = ?');
            values.push(stock);
        }
        if (categoria !== undefined) {
            updates.push('categoria = ?');
            values.push(categoria);
        }

        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);

        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? true : 1;
        const query = `UPDATE productos SET ${updates.join(', ')} WHERE id = ? AND activo = ?`;
        values.push(activoValue);

        return new Promise((resolve, reject) => {
            this.db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    reject(new Error('Producto no encontrado o inactivo'));
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }

    /**
     * Eliminar producto (soft delete)
     */
    async delete(id) {
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? false : 0;

        return new Promise((resolve, reject) => {
            this.db.run('UPDATE productos SET activo = ? WHERE id = ?', [activoValue, id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    reject(new Error('Producto no encontrado'));
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }
}

module.exports = ProductoService;



