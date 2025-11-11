const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

class AuthService {
    constructor() {
        this.jwtSecret = config.get('security.jwt.secret');
        this.jwtExpiresIn = config.get('security.jwt.expiresIn');
        this.saltRounds = 12;
    }

    /**
     * Generar hash de contraseña
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<string>} Hash de la contraseña
     */
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            console.error('Error hashing password:', error);
            throw new Error('Error al procesar contraseña');
        }
    }

    /**
     * Verificar contraseña
     * @param {string} password - Contraseña en texto plano
     * @param {string} hash - Hash de la contraseña
     * @returns {Promise<boolean>} True si la contraseña es correcta
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }

    /**
     * Generar token JWT
     * @param {Object} payload - Datos del usuario
     * @returns {string} Token JWT
     */
    generateToken(payload) {
        try {
            const tokenPayload = {
                userId: payload.id,
                username: payload.username,
                role: payload.role || 'user',
                empresaId: payload.empresaId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + this.parseExpiration(this.jwtExpiresIn)
            };

            return jwt.sign(tokenPayload, this.jwtSecret, {
                expiresIn: this.jwtExpiresIn,
                issuer: 'telwagen-desktop-app',
                audience: 'telwagen-users'
            });
        } catch (error) {
            console.error('Error generating token:', error);
            throw new Error('Error al generar token de autenticación');
        }
    }

    /**
     * Verificar token JWT
     * @param {string} token - Token JWT
     * @returns {Object} Datos decodificados del token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'telwagen-desktop-app',
                audience: 'telwagen-users'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expirado');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token inválido');
            } else {
                console.error('Error verifying token:', error);
                throw new Error('Error al verificar token');
            }
        }
    }

    /**
     * Refrescar token
     * @param {string} token - Token actual
     * @returns {string} Nuevo token
     */
    refreshToken(token) {
        try {
            const decoded = this.verifyToken(token);
            return this.generateToken({
                id: decoded.userId,
                username: decoded.username,
                role: decoded.role,
                empresaId: decoded.empresaId
            });
        } catch (error) {
            throw new Error('No se puede refrescar el token: ' + error.message);
        }
    }

    /**
     * Crear usuario por defecto para aplicación de escritorio
     * @param {Object} db - Instancia de base de datos
     * @returns {Promise<Object>} Usuario creado
     */
    async createDefaultUser(db) {
        try {
            // Verificar si ya existe un usuario
            const existingUser = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM usuarios WHERE username = ?', ['admin'], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existingUser) {
                console.log('✅ Usuario por defecto ya existe');
                return existingUser;
            }

            // Crear usuario por defecto
            const defaultPassword = 'admin123'; // Cambiar en producción
            const hashedPassword = await this.hashPassword(defaultPassword);

            const dbType = config.get('database.type') || 'postgresql';
            const isPostgreSQL = dbType === 'postgresql';
            
            const userId = await new Promise((resolve, reject) => {
                if (isPostgreSQL && db.query) {
                    // PostgreSQL: usar RETURNING id
                    db.query(`
                        INSERT INTO usuarios (username, password_hash, role, activo, fecha_creacion)
                        VALUES ($1, $2, $3, $4, $5) RETURNING id
                    `, ['admin', hashedPassword, 'admin', true, new Date().toISOString()])
                        .then(result => resolve(result.rows[0].id))
                        .catch(reject);
                } else {
                    // SQLite: usar lastID
                    db.run(`
                        INSERT INTO usuarios (username, password_hash, role, activo, fecha_creacion)
                        VALUES (?, ?, ?, ?, ?)
                    `, ['admin', hashedPassword, 'admin', 1, new Date().toISOString()], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                }
            });

            console.log('✅ Usuario por defecto creado: admin / admin123');
            return {
                id: userId,
                username: 'admin',
                role: 'admin',
                activo: 1
            };
        } catch (error) {
            console.error('Error creating default user:', error);
            throw error;
        }
    }

    /**
     * Autenticar usuario
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @param {Object} db - Instancia de base de datos
     * @returns {Promise<Object>} Resultado de autenticación
     */
    async authenticateUser(username, password, db) {
        try {
            // Buscar usuario
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña
            const isValidPassword = await this.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                throw new Error('Contraseña incorrecta');
            }

            // Generar token
            const token = this.generateToken({
                id: user.id,
                username: user.username,
                role: user.role,
                empresaId: user.empresa_id
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    empresaId: user.empresa_id
                },
                token: token,
                expiresIn: this.parseExpiration(this.jwtExpiresIn)
            };
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    /**
     * Parsear tiempo de expiración
     * @param {string} expiresIn - Tiempo de expiración (ej: '1h', '24h')
     * @returns {number} Segundos
     */
    parseExpiration(expiresIn) {
        const timeUnits = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400
        };

        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 3600; // 1 hora por defecto
        }

        const [, value, unit] = match;
        return parseInt(value) * timeUnits[unit];
    }

    /**
     * Middleware de autenticación para Express
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    authMiddleware(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Token de autenticación requerido',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }

            const token = authHeader.substring(7); // Remover 'Bearer '
            const decoded = this.verifyToken(token);

            // Agregar información del usuario al request
            req.user = {
                id: decoded.userId,
                username: decoded.username,
                role: decoded.role,
                empresaId: decoded.empresaId
            };

            next();
        } catch (error) {
            return res.status(401).json({
                error: 'Token de autenticación inválido',
                code: 'AUTH_TOKEN_INVALID',
                details: error.message
            });
        }
    }

    /**
     * Middleware de autorización por roles
     * @param {Array} allowedRoles - Roles permitidos
     * @returns {Function} Middleware function
     */
    requireRole(allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Usuario no autenticado',
                    code: 'AUTH_REQUIRED'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Acceso denegado. Rol insuficiente.',
                    code: 'AUTH_INSUFFICIENT_ROLE',
                    required: allowedRoles,
                    current: req.user.role
                });
            }

            next();
        };
    }
}

module.exports = AuthService;


