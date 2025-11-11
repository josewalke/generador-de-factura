const crypto = require('crypto');
const SQLAdapter = require('./sqlAdapter');
const config = require('../config/config');

/**
 * Sistema de Control de Acceso por Roles
 * Implementa control de acceso basado en roles para cumplir con Ley Antifraude
 */
class SistemaControlAcceso {
    constructor(database) {
        this.db = database;
        this.roles = {
            'admin': {
                nivel: 100,
                permisos: ['*'], // Todos los permisos
                descripcion: 'Administrador del sistema'
            },
            'contable': {
                nivel: 80,
                permisos: [
                    'facturas:crear',
                    'facturas:leer',
                    'facturas:actualizar',
                    'facturas:eliminar',
                    'clientes:crear',
                    'clientes:leer',
                    'clientes:actualizar',
                    'empresas:leer',
                    'auditoria:leer',
                    'backup:realizar',
                    'verifactu:generar',
                    'verifactu:enviar'
                ],
                descripcion: 'Contable con acceso completo a facturación'
            },
            'operador': {
                nivel: 60,
                permisos: [
                    'facturas:crear',
                    'facturas:leer',
                    'clientes:leer',
                    'empresas:leer'
                ],
                descripcion: 'Operador con acceso limitado'
            },
            'consulta': {
                nivel: 40,
                permisos: [
                    'facturas:leer',
                    'clientes:leer',
                    'empresas:leer',
                    'auditoria:leer'
                ],
                descripcion: 'Solo consulta de datos'
            },
            'auditor': {
                nivel: 90,
                permisos: [
                    'facturas:leer',
                    'clientes:leer',
                    'empresas:leer',
                    'auditoria:leer',
                    'auditoria:verificar',
                    'backup:listar',
                    'backup:verificar'
                ],
                descripcion: 'Auditor con acceso de solo lectura y verificación'
            }
        };
        
        this.sesionesActivas = new Map();
        this.intentosFallidos = new Map();
        this.maxIntentos = 5;
        this.tiempoBloqueo = 15 * 60 * 1000; // 15 minutos
    }

    /**
     * Inicializa el sistema de control de acceso
     */
    async inicializar() {
        try {
            // Crear tabla de usuarios si no existe
            await this.crearTablaUsuarios();
            
            // Crear tabla de sesiones si no existe
            await this.crearTablaSesiones();
            
            // Crear usuario administrador por defecto si no existe
            await this.crearUsuarioAdmin();
            
            console.log('✅ Sistema de Control de Acceso inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar Control de Acceso:', error);
            throw error;
        }
    }

    /**
     * Crea la tabla de usuarios
     */
    async crearTablaUsuarios() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no está disponible'));
                return;
            }
            
            const dbType = config.get('database.type') || 'postgresql';
            const isPostgreSQL = dbType === 'postgresql';
            
            let query = `
                CREATE TABLE IF NOT EXISTS usuarios (
                    id ${isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
                    username ${isPostgreSQL ? 'VARCHAR(255)' : 'TEXT'} UNIQUE NOT NULL,
                    password_hash ${isPostgreSQL ? 'TEXT' : 'TEXT'} NOT NULL,
                    salt ${isPostgreSQL ? 'TEXT' : 'TEXT'} NOT NULL,
                    role ${isPostgreSQL ? 'VARCHAR(50)' : 'TEXT'} NOT NULL DEFAULT 'operador',
                    nombre ${isPostgreSQL ? 'VARCHAR(255)' : 'TEXT'},
                    email ${isPostgreSQL ? 'VARCHAR(255)' : 'TEXT'},
                    activo ${isPostgreSQL ? 'BOOLEAN DEFAULT true' : 'BOOLEAN DEFAULT 1'},
                    ultimo_acceso ${isPostgreSQL ? 'TIMESTAMP' : 'DATETIME'},
                    intentos_fallidos INTEGER DEFAULT 0,
                    bloqueado_hasta ${isPostgreSQL ? 'TIMESTAMP' : 'DATETIME'},
                    fecha_creacion ${isPostgreSQL ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
                    fecha_actualizacion ${isPostgreSQL ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'}
                )
            `;
            
            if (isPostgreSQL) {
                query = SQLAdapter.adaptCreateTable(query);
            }
            
            this.db.run(query, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Crea la tabla de sesiones
     */
    async crearTablaSesiones() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no está disponible'));
                return;
            }
            
            const dbType = config.get('database.type') || 'postgresql';
            const isPostgreSQL = dbType === 'postgresql';
            
            let query = `
                CREATE TABLE IF NOT EXISTS sesiones (
                    id ${isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
                    usuario_id INTEGER NOT NULL,
                    token ${isPostgreSQL ? 'VARCHAR(255)' : 'TEXT'} UNIQUE NOT NULL,
                    ip_address ${isPostgreSQL ? 'VARCHAR(45)' : 'TEXT'},
                    user_agent ${isPostgreSQL ? 'TEXT' : 'TEXT'},
                    fecha_inicio ${isPostgreSQL ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
                    fecha_expiracion ${isPostgreSQL ? 'TIMESTAMP' : 'DATETIME'} NOT NULL,
                    activa ${isPostgreSQL ? 'BOOLEAN DEFAULT true' : 'BOOLEAN DEFAULT 1'},
                    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
                )
            `;
            
            if (isPostgreSQL) {
                query = SQLAdapter.adaptCreateTable(query);
            }
            
            this.db.run(query, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Crea usuario administrador por defecto
     */
    async crearUsuarioAdmin() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT COUNT(*) as count FROM usuarios WHERE role = ?';
            this.db.get(query, ['admin'], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row.count === 0) {
                    const salt = crypto.randomBytes(32).toString('hex');
                    const passwordHash = crypto.pbkdf2Sync('admin123', salt, 10000, 64, 'sha512').toString('hex');
                    
                    const insertQuery = `
                        INSERT INTO usuarios (username, password_hash, salt, role, nombre, email)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    this.db.run(insertQuery, [
                        'admin',
                        passwordHash,
                        salt,
                        'admin',
                        'Administrador del Sistema',
                        'admin@telwagen.com'
                    ], (err) => {
                        if (err) reject(err);
                        else {
                            console.log('✅ Usuario administrador creado (admin/admin123)');
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Genera hash de contraseña
     */
    generarHashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }

    /**
     * Autentica un usuario
     */
    async autenticar(username, password, ipAddress = null, userAgent = null) {
        try {
            // Verificar si el usuario está bloqueado
            const usuario = await this.obtenerUsuario(username);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }

            if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
                throw new Error('Usuario temporalmente bloqueado por intentos fallidos');
            }

            // Verificar contraseña
            const hashCalculado = this.generarHashPassword(password, usuario.salt);
            if (hashCalculado !== usuario.password_hash) {
                await this.registrarIntentoFallido(username);
                throw new Error('Contraseña incorrecta');
            }

            // Generar token de sesión
            const token = crypto.randomBytes(32).toString('hex');
            const fechaExpiracion = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas

            // Crear sesión
            await this.crearSesion(usuario.id, token, ipAddress, userAgent, fechaExpiracion);

            // Actualizar último acceso
            await this.actualizarUltimoAcceso(usuario.id);

            // Limpiar intentos fallidos
            await this.limpiarIntentosFallidos(username);

            return {
                token,
                usuario: {
                    id: usuario.id,
                    username: usuario.username,
                    rol: usuario.role,
                    nombre: usuario.nombre,
                    email: usuario.email
                },
                expiracion: fechaExpiracion
            };
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            throw error;
        }
    }

    /**
     * Obtiene un usuario por username
     */
    async obtenerUsuario(username) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM usuarios WHERE username = ? AND activo = 1';
            this.db.get(query, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Crea una nueva sesión
     */
    async crearSesion(usuarioId, token, ipAddress, userAgent, fechaExpiracion) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sesiones (usuario_id, token, ip_address, user_agent, fecha_expiracion)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [usuarioId, token, ipAddress, userAgent, fechaExpiracion], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Actualiza el último acceso del usuario
     */
    async actualizarUltimoAcceso(usuarioId) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?';
            this.db.run(query, [usuarioId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Registra un intento fallido de autenticación
     */
    async registrarIntentoFallido(username) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE usuarios 
                SET intentos_fallidos = intentos_fallidos + 1,
                    bloqueado_hasta = CASE 
                        WHEN intentos_fallidos >= ? THEN datetime('now', '+15 minutes')
                        ELSE bloqueado_hasta 
                    END
                WHERE username = ?
            `;
            
            this.db.run(query, [this.maxIntentos - 1, username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Limpia los intentos fallidos de un usuario
     */
    async limpiarIntentosFallidos(username) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE username = ?';
            this.db.run(query, [username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Verifica si un token es válido
     */
    async verificarToken(token) {
        return new Promise((resolve, reject) => {
            const dbType = config.get('database.type') || 'postgresql';
            const isPostgreSQL = dbType === 'postgresql';
            const activaValue = isPostgreSQL ? 'true' : '1';
            const fechaNow = isPostgreSQL ? 'NOW()' : "datetime('now')";
            
            const query = `
                SELECT s.*, u.username, u.role as rol, u.nombre, u.email
                FROM sesiones s
                JOIN usuarios u ON s.usuario_id = u.id
                WHERE s.token = ? AND s.activa = ${activaValue} AND s.fecha_expiracion > ${fechaNow}
            `;
            
            this.db.get(query, [token], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Verifica si un usuario tiene un permiso específico
     */
    tienePermiso(rol, permiso) {
        const rolInfo = this.roles[rol];
        if (!rolInfo) return false;
        
        // Admin tiene todos los permisos
        if (rolInfo.permisos.includes('*')) return true;
        
        return rolInfo.permisos.includes(permiso);
    }

    /**
     * Middleware para verificar autenticación
     */
    middlewareAutenticacion() {
        return async (req, res, next) => {
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        error: 'Token de autenticación requerido'
                    });
                }

                const sesion = await this.verificarToken(token);
                if (!sesion) {
                    return res.status(401).json({
                        success: false,
                        error: 'Token inválido o expirado'
                    });
                }

                req.usuario = {
                    id: sesion.usuario_id,
                    username: sesion.username,
                    rol: sesion.rol,
                    nombre: sesion.nombre,
                    email: sesion.email
                };

                next();
            } catch (error) {
                console.error('❌ Error en middleware de autenticación:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor'
                });
            }
        };
    }

    /**
     * Middleware para verificar permisos
     */
    middlewarePermisos(permiso) {
        return (req, res, next) => {
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
            }

            if (!this.tienePermiso(req.usuario.rol, permiso)) {
                return res.status(403).json({
                    success: false,
                    error: 'Permisos insuficientes'
                });
            }

            next();
        };
    }

    /**
     * Cierra una sesión
     */
    async cerrarSesion(token) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE sesiones SET activa = 0 WHERE token = ?';
            this.db.run(query, [token], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Obtiene información de roles disponibles
     */
    obtenerRoles() {
        return this.roles;
    }

    /**
     * Crea un nuevo usuario
     */
    async crearUsuario(datosUsuario) {
        const { username, password, rol, nombre, email } = datosUsuario;
        
        if (!this.roles[rol]) {
            throw new Error('Rol no válido');
        }

        const salt = crypto.randomBytes(32).toString('hex');
        const passwordHash = this.generarHashPassword(password, salt);

        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO usuarios (username, password_hash, salt, role, nombre, email)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [username, passwordHash, salt, rol, nombre, email], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, username, rol, nombre, email });
            });
        });
    }
}

module.exports = SistemaControlAcceso;
