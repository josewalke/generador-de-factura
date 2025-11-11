// Módulo de conexión a base de datos (PostgreSQL)
let Pool;
try {
    const pg = require('pg');
    Pool = pg.Pool;
} catch (error) {
    // El módulo pg no está instalado, se manejará en connect()
    Pool = null;
}

const config = require('../config/config');

class Database {
    constructor() {
        this.pool = null;
        this.config = config.getAll();
        this.isConnected = false;
    }

    /**
     * Conectar a PostgreSQL
     */
    async connect() {
        try {
            if (!Pool) {
                throw new Error('Módulo pg no está instalado. Ejecuta: npm install pg');
            }
            
            const dbConfig = this.config.database;
            
            this.pool = new Pool({
                host: dbConfig.host || 'localhost',
                port: dbConfig.port || 5432,
                database: dbConfig.database || 'telwagen',
                user: dbConfig.user || 'postgres',
                password: dbConfig.password || '',
                max: dbConfig.maxConnections || 20,
                idleTimeoutMillis: dbConfig.idleTimeout || 30000,
                connectionTimeoutMillis: dbConfig.connectionTimeout || 2000,
            });

            // Probar la conexión
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('Error conectando a PostgreSQL:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Convertir parámetros de SQLite (?) a PostgreSQL ($1, $2, ...)
     */
    convertParams(query, params) {
        if (!params || params.length === 0) {
            return { query, params: [] };
        }
        
        // Si la query ya usa $1, $2, etc., no convertir
        if (query.includes('$1')) {
            return { query, params };
        }
        
        // Convertir ? a $1, $2, etc.
        let paramIndex = 1;
        const convertedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
        
        return { query: convertedQuery, params };
    }

    /**
     * Ejecutar query
     */
    async query(text, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }
        
        const start = Date.now();
        try {
            // Convertir parámetros de SQLite a PostgreSQL
            const { query: convertedQuery, params: convertedParams } = this.convertParams(text, params);
            
            const result = await this.pool.query(convertedQuery, convertedParams);
            const duration = Date.now() - start;
            
            // Log de query si está disponible
            if (global.logger) {
                global.logger.databaseQuery(text, duration, result.rowCount || 0, params);
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            if (global.logger) {
                global.logger.error('Error en query PostgreSQL', { 
                    error: error.message, 
                    query: text.substring(0, 200),
                    duration: `${duration}ms`
                }, 'database');
            }
            throw error;
        }
    }

    /**
     * Obtener un cliente del pool para transacciones
     */
    async getClient() {
        if (!this.isConnected) {
            await this.connect();
        }
        return await this.pool.connect();
    }

    /**
     * Ejecutar transacción
     */
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cerrar conexión
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
        }
    }

    /**
     * Verificar conexión
     */
    async ping() {
        try {
            const result = await this.query('SELECT 1');
            return result.rows.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Métodos compatibles con SQLite para migración gradual
     */
    
    // all() - equivalente a db.all()
    async all(query, params = []) {
        const result = await this.query(query, params);
        return result.rows;
    }

    // get() - equivalente a db.get()
    async get(query, params = []) {
        const result = await this.query(query, params);
        return result.rows[0] || null;
    }

    // run() - equivalente a db.run() - retorna lastID y changes
    async run(query, params = []) {
        const result = await this.query(query, params);
        return {
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount || 0
        };
    }

    // run con callback para compatibilidad
    runWithCallback(query, params = [], callback) {
        // Convertir parámetros
        const { query: convertedQuery, params: convertedParams } = this.convertParams(query, params);
        
        // Para INSERT, agregar RETURNING id si no está presente
        let finalQuery = convertedQuery;
        if (query.toUpperCase().trim().startsWith('INSERT') && !convertedQuery.includes('RETURNING') && !convertedQuery.includes('ON CONFLICT')) {
            finalQuery = convertedQuery.replace(/;$/, '') + ' RETURNING id';
        }
        
        this.query(finalQuery, convertedParams)
            .then(result => {
                // Para INSERT, obtener el ID
                let lastID = null;
                if (query.toUpperCase().trim().startsWith('INSERT')) {
                    if (result.rows && result.rows.length > 0 && result.rows[0].id) {
                        lastID = result.rows[0].id;
                    } else {
                        // Intentar obtener con LASTVAL()
                        this.query('SELECT LASTVAL() as id')
                            .then(idResult => {
                                lastID = idResult.rows[0]?.id || null;
                                const runResult = {
                                    lastID: lastID,
                                    changes: result.rowCount || 0
                                };
                                if (callback) callback(null, runResult);
                            })
                            .catch(() => {
                                const runResult = {
                                    lastID: null,
                                    changes: result.rowCount || 0
                                };
                                if (callback) callback(null, runResult);
                            });
                        return; // Salir temprano
                    }
                }
                
                const runResult = {
                    lastID: lastID,
                    changes: result.rowCount || 0
                };
                
                if (callback) {
                    callback(null, runResult);
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error, null);
                }
            });
    }

    // all con callback para compatibilidad
    allWithCallback(query, params = [], callback) {
        const { query: convertedQuery, params: convertedParams } = this.convertParams(query, params);
        
        this.query(convertedQuery, convertedParams)
            .then(result => {
                if (callback) {
                    callback(null, result.rows);
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error, null);
                }
            });
    }

    // get con callback para compatibilidad
    getWithCallback(query, params = [], callback) {
        const { query: convertedQuery, params: convertedParams } = this.convertParams(query, params);
        
        this.query(convertedQuery, convertedParams)
            .then(result => {
                if (callback) {
                    callback(null, result.rows[0] || null);
                }
            })
            .catch(error => {
                if (callback) {
                    callback(error, null);
                }
            });
    }
}

// Crear instancia singleton
const database = new Database();

module.exports = database;

