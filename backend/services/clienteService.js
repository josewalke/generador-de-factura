const config = require('../config/config');

class ClienteService {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Obtener todos los clientes
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }

            this.db.all('SELECT * FROM clientes ORDER BY fecha_creacion DESC', (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    /**
     * Obtener cliente por ID
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Buscar cliente por identificación
     */
    async buscarPorIdentificacion(identificacion) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM clientes WHERE identificacion = ?', [identificacion], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row || null);
            });
        });
    }

    /**
     * Crear nuevo cliente
     */
    async create(clienteData) {
        const { nombre, direccion, codigo_postal, identificacion, email, telefono } = clienteData;

        // Validar campos obligatorios
        if (!nombre || !direccion || !identificacion) {
            throw new Error('Campos obligatorios faltantes: nombre, direccion, identificacion');
        }

        // Verificar que la identificación no esté duplicada
        const clienteExistente = await this.buscarPorIdentificacion(identificacion);
        if (clienteExistente) {
            const error = new Error('La identificación ya existe');
            error.code = 'DUPLICATE_IDENTIFICACION';
            error.statusCode = 409;
            throw error;
        }

        // Insertar cliente
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO clientes (nombre, direccion, codigo_postal, identificacion, email, telefono)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [nombre, direccion, codigo_postal, identificacion, email, telefono], function(err) {
                if (err) {
                    reject(err);
                    return;
                }

                // Obtener el ID insertado
                const id = this.lastID;
                
                // Si el ID no se obtuvo (fallback para PostgreSQL)
                if (!id) {
                    this.db.get('SELECT id FROM clientes WHERE identificacion = ? ORDER BY id DESC LIMIT 1', [identificacion], (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({ id: row?.id, ...clienteData });
                    });
                } else {
                    resolve({ id, nombre, direccion, codigo_postal, identificacion, email, telefono });
                }
            });
        });
    }

    /**
     * Actualizar cliente
     */
    async update(id, clienteData) {
        const { nombre, direccion, codigo_postal, identificacion, email, telefono } = clienteData;

        // Construir la consulta dinámicamente
        const updates = [];
        const values = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            values.push(nombre);
        }
        if (direccion !== undefined) {
            updates.push('direccion = ?');
            values.push(direccion);
        }
        if (codigo_postal !== undefined) {
            updates.push('codigo_postal = ?');
            values.push(codigo_postal);
        }
        if (identificacion !== undefined) {
            // Verificar que la nueva identificación no esté duplicada
            const clienteExistente = await this.buscarPorIdentificacion(identificacion);
            if (clienteExistente && clienteExistente.id !== parseInt(id)) {
                const error = new Error('La identificación ya existe');
                error.code = 'DUPLICATE_IDENTIFICACION';
                error.statusCode = 409;
                throw error;
            }
            updates.push('identificacion = ?');
            values.push(identificacion);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (telefono !== undefined) {
            updates.push('telefono = ?');
            values.push(telefono);
        }

        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);

        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    reject(new Error('Cliente no encontrado'));
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }

    /**
     * Eliminar cliente (soft delete)
     */
    async delete(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM clientes WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    reject(new Error('Cliente no encontrado'));
                    return;
                }
                resolve({ id, changes: this.changes });
            });
        });
    }
}

module.exports = ClienteService;



