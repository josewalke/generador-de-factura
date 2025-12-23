const config = require('../config/config');

class EmpresaService {
    constructor(db, logger, cacheManager, paginationManager, sistemaFirmaDigital) {
        this.db = db;
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.paginationManager = paginationManager;
        this.sistemaFirmaDigital = sistemaFirmaDigital;
    }

    /**
     * Obtener empresas con paginación y filtros
     */
    async getAll(queryParams) {
        const { page = 1, limit = 20, search = '' } = queryParams;
        
        // Usar caché si está disponible
        const cacheKey = `empresas:page:${page}:limit:${limit}:search:${search}`;
        const cachedResult = this.cacheManager?.get(cacheKey);
        
        if (cachedResult) {
            return { 
                data: cachedResult.data, 
                pagination: cachedResult.pagination, 
                cached: true 
            };
        }
        
        // Construir consulta con búsqueda
        let whereClause = '';
        let whereParams = [];
        
        if (search) {
            whereClause = 'WHERE nombre LIKE ? OR cif LIKE ?';
            whereParams = [`%${search}%`, `%${search}%`];
        }
        
        const result = await this.paginationManager.getPaginatedData('empresas', {
            page: parseInt(page),
            limit: parseInt(limit),
            where: whereClause,
            whereParams: whereParams,
            orderBy: 'nombre',
            orderDirection: 'ASC'
        });
        
        // Guardar en caché
        this.cacheManager?.set(cacheKey, result, 300); // 5 minutos TTL
        
        return { 
            data: result.data, 
            pagination: result.pagination, 
            cached: false 
        };
    }

    /**
     * Obtener empresa por ID
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error('Empresa no encontrada'));
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Crear nueva empresa
     */
    async create(empresaData) {
        const { nombre, cif, direccion, telefono, email, firmaDigitalThumbprint } = empresaData;
        
        // Validar campos obligatorios
        if (!nombre || !cif) {
            throw new Error('Campos obligatorios faltantes: nombre, cif');
        }
        
        // Verificar que el CIF no esté duplicado
        const empresaExistente = await new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM empresas WHERE cif = ?', [cif], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        if (empresaExistente) {
            const error = new Error('El CIF ya existe');
            error.code = 'DUPLICATE_CIF';
            error.field = 'cif';
            error.statusCode = 409;
            throw error;
        }
        
        // Crear la empresa con el certificado si se proporciona
        const empresaId = await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO empresas (nombre, cif, direccion, telefono, email, certificado_thumbprint)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [nombre, cif, direccion, telefono, email, firmaDigitalThumbprint || null], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
        
        // Si se especifica una firma digital, asociarla con la empresa
        let firmaDigitalAsociada = false;
        if (firmaDigitalThumbprint && this.sistemaFirmaDigital) {
            try {
                const resultadoAsociacion = await this.sistemaFirmaDigital.asociarCertificadoConEmpresa(empresaId, firmaDigitalThumbprint);
                
                if (resultadoAsociacion.success) {
                    this.logger.info(`Firma digital asociada con nueva empresa ${nombre}`);
                    firmaDigitalAsociada = true;
                } else {
                    this.logger.warn(`No se pudo asociar firma digital: ${resultadoAsociacion.error}`);
                }
            } catch (error) {
                this.logger.warn(`Error al asociar firma digital: ${error.message}`);
            }
        }
        
        // Obtener la empresa creada para devolverla
        const empresaCreada = await this.getById(empresaId);
        
        // Invalidar caché de empresas después de crear una nueva
        this.cacheManager?.delPattern('empresas:.*');
        
        return {
            empresa: empresaCreada,
            firmaDigitalAsociada
        };
    }

    /**
     * Actualizar empresa
     */
    async update(id, empresaData) {
        const empresaId = parseInt(id, 10);
        const { nombre, cif, direccion, telefono, email, firmaDigitalThumbprint } = empresaData;
        
        // Validar ID
        if (isNaN(empresaId) || empresaId <= 0) {
            throw new Error('ID de empresa inválido');
        }
        
        // Si se está actualizando el CIF, verificar que no esté duplicado
        if (cif) {
            const cifDuplicado = await new Promise((resolve, reject) => {
                this.db.get('SELECT id FROM empresas WHERE cif = ? AND id != ?', [cif, empresaId], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(!!row);
                    }
                });
            });
            
            if (cifDuplicado) {
                const error = new Error('El CIF ya existe');
                error.code = 'DUPLICATE_CIF';
                error.field = 'cif';
                error.statusCode = 409;
                throw error;
            }
        }
        
        // Actualizar datos básicos de la empresa
        const changes = await new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE empresas 
                SET nombre = ?, cif = ?, direccion = ?, telefono = ?, email = ?, certificado_thumbprint = ?
                WHERE id = ?
            `, [nombre, cif, direccion, telefono, email, firmaDigitalThumbprint || null, empresaId], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    resolve(null);
                } else {
                    resolve(this.changes);
                }
            });
        });
        
        // Si no se encontró la empresa, retornar error 404
        if (changes === null) {
            throw new Error('Empresa no encontrada');
        }
        
        // Si se especifica una firma digital, asociarla con la empresa
        let firmaDigitalAsociada = false;
        if (firmaDigitalThumbprint && this.sistemaFirmaDigital) {
            try {
                const resultadoAsociacion = await this.sistemaFirmaDigital.asociarCertificadoConEmpresa(empresaId, firmaDigitalThumbprint);
                
                if (resultadoAsociacion.success) {
                    this.logger.info(`Firma digital asociada con empresa ${nombre}`);
                    firmaDigitalAsociada = true;
                } else {
                    this.logger.warn(`No se pudo asociar firma digital: ${resultadoAsociacion.error}`);
                }
            } catch (error) {
                this.logger.warn(`Error al asociar firma digital: ${error.message}`);
            }
        }
        
        // Obtener la empresa actualizada para devolverla
        const empresaActualizada = await this.getById(empresaId);
        
        // Invalidar caché de empresas después de actualizar
        this.cacheManager?.delPattern('empresas:.*');
        
        return {
            empresa: empresaActualizada,
            firmaDigitalAsociada
        };
    }

    /**
     * Eliminar empresa
     */
    async delete(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM empresas WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Empresa no encontrada'));
                } else {
                    // Invalidar caché de empresas después de eliminar
                    this.cacheManager?.delPattern('empresas:.*');
                    resolve({ success: true });
                }
            });
        });
    }
}

module.exports = EmpresaService;
