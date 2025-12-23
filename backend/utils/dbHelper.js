/**
 * Helper para operaciones comunes de base de datos
 * Proporciona funciones reutilizables para consultas comunes
 */

class DbHelper {
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Ejecuta una consulta GET (SELECT) y retorna una promesa
     * @param {string} query - Query SQL
     * @param {Array} params - Parámetros de la query
     * @returns {Promise<Object|null>} Resultado de la consulta
     */
    async get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    if (this.logger) {
                        this.logger.error('Error en db.get', { 
                            query, 
                            params, 
                            error: err.message 
                        }, 'database');
                    }
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Ejecuta una consulta ALL (SELECT múltiples filas) y retorna una promesa
     * @param {string} query - Query SQL
     * @param {Array} params - Parámetros de la query
     * @returns {Promise<Array>} Resultado de la consulta
     */
    async all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    if (this.logger) {
                        this.logger.error('Error en db.all', { 
                            query, 
                            params, 
                            error: err.message 
                        }, 'database');
                    }
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Ejecuta una consulta RUN (INSERT/UPDATE/DELETE) y retorna una promesa
     * @param {string} query - Query SQL
     * @param {Array} params - Parámetros de la query
     * @returns {Promise<Object>} Objeto con lastID y changes
     */
    async run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    if (this.logger) {
                        this.logger.error('Error en db.run', { 
                            query, 
                            params, 
                            error: err.message 
                        }, 'database');
                    }
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Verifica si un registro existe
     * @param {string} table - Nombre de la tabla
     * @param {string} field - Campo a verificar
     * @param {*} value - Valor a buscar
     * @returns {Promise<boolean>} True si existe, false si no
     */
    async exists(table, field, value) {
        const query = `SELECT 1 FROM ${table} WHERE ${field} = ? LIMIT 1`;
        const result = await this.get(query, [value]);
        return result !== null;
    }

    /**
     * Obtiene un registro por ID
     * @param {string} table - Nombre de la tabla
     * @param {number} id - ID del registro
     * @returns {Promise<Object|null>} Registro encontrado o null
     */
    async getById(table, id) {
        const query = `SELECT * FROM ${table} WHERE id = ?`;
        return await this.get(query, [id]);
    }

    /**
     * Elimina un registro por ID
     * @param {string} table - Nombre de la tabla
     * @param {number} id - ID del registro
     * @returns {Promise<boolean>} True si se eliminó, false si no existía
     */
    async deleteById(table, id) {
        const query = `DELETE FROM ${table} WHERE id = ?`;
        const result = await this.run(query, [id]);
        return result.changes > 0;
    }
}

module.exports = DbHelper;







