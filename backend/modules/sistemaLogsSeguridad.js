const SQLAdapter = require('./sqlAdapter');
const config = require('../config/config');

/**
 * Sistema de Logs de Seguridad
 * Registra eventos de seguridad para cumplir con Ley Antifraude
 */
class SistemaLogsSeguridad {
    constructor(database) {
        this.db = database;
        this.nivelesLog = {
            'INFO': 1,
            'WARNING': 2,
            'ERROR': 3,
            'CRITICAL': 4,
            'SECURITY': 5
        };
        
        this.tiposEvento = {
            'LOGIN': 'Inicio de sesión',
            'LOGOUT': 'Cierre de sesión',
            'LOGIN_FAILED': 'Intento de inicio de sesión fallido',
            'PERMISSION_DENIED': 'Acceso denegado por permisos',
            'DATA_ACCESS': 'Acceso a datos sensibles',
            'DATA_MODIFICATION': 'Modificación de datos',
            'DATA_DELETION': 'Eliminación de datos',
            'BACKUP_CREATED': 'Creación de backup',
            'BACKUP_RESTORED': 'Restauración de backup',
            'INTEGRITY_CHECK': 'Verificación de integridad',
            'VERIFACTU_GENERATED': 'Generación de VeriFactu',
            'VERIFACTU_SENT': 'Envío a VeriFactu',
            'ENCRYPTION': 'Cifrado de datos',
            'DECRYPTION': 'Descifrado de datos',
            'USER_CREATED': 'Creación de usuario',
            'USER_MODIFIED': 'Modificación de usuario',
            'USER_DELETED': 'Eliminación de usuario',
            'ROLE_CHANGED': 'Cambio de rol de usuario',
            'SYSTEM_ERROR': 'Error del sistema',
            'SECURITY_VIOLATION': 'Violación de seguridad'
        };
    }

    /**
     * Inicializa el sistema de logs de seguridad
     */
    async inicializar() {
        try {
            await this.crearTablaLogs();
            console.log('✅ Sistema de Logs de Seguridad inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar Logs de Seguridad:', error);
            throw error;
        }
    }

    /**
     * Crea la tabla de logs de seguridad
     */
    async crearTablaLogs() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no está disponible'));
                return;
            }
            
            const dbType = config.get('database.type') || 'postgresql';
            const isPostgreSQL = dbType === 'postgresql';
            
            let query = `
                CREATE TABLE IF NOT EXISTS logs_seguridad (
                    id ${isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
                    timestamp ${isPostgreSQL ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
                    nivel ${isPostgreSQL ? 'VARCHAR(20)' : 'TEXT'} NOT NULL,
                    tipo_evento ${isPostgreSQL ? 'VARCHAR(50)' : 'TEXT'} NOT NULL,
                    descripcion ${isPostgreSQL ? 'TEXT' : 'TEXT'} NOT NULL,
                    usuario_id INTEGER,
                    usuario_nombre ${isPostgreSQL ? 'VARCHAR(255)' : 'TEXT'},
                    ip_address ${isPostgreSQL ? 'VARCHAR(45)' : 'TEXT'},
                    user_agent ${isPostgreSQL ? 'TEXT' : 'TEXT'},
                    detalles ${isPostgreSQL ? 'TEXT' : 'TEXT'},
                    hash_evento ${isPostgreSQL ? 'VARCHAR(64)' : 'TEXT'},
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
     * Registra un evento de seguridad
     */
    async registrarEvento(evento) {
        try {
            const {
                nivel = 'INFO',
                tipoEvento,
                descripcion,
                usuarioId = null,
                usuarioNombre = null,
                ipAddress = null,
                userAgent = null,
                detalles = null
            } = evento;

            // Validar nivel
            if (!this.nivelesLog[nivel]) {
                throw new Error(`Nivel de log no válido: ${nivel}`);
            }

            // Validar tipo de evento
            if (!this.tiposEvento[tipoEvento]) {
                throw new Error(`Tipo de evento no válido: ${tipoEvento}`);
            }

            // Generar hash del evento para integridad
            const datosEvento = JSON.stringify({
                timestamp: new Date().toISOString(),
                nivel,
                tipoEvento,
                descripcion,
                usuarioId,
                usuarioNombre,
                ipAddress,
                detalles
            });
            
            const hashEvento = this.generarHashEvento(datosEvento);

            return new Promise((resolve, reject) => {
                const query = `
                    INSERT INTO logs_seguridad (
                        nivel, tipo_evento, descripcion, usuario_id, usuario_nombre,
                        ip_address, user_agent, detalles, hash_evento
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                this.db.run(query, [
                    nivel, tipoEvento, descripcion, usuarioId, usuarioNombre,
                    ipAddress, userAgent, JSON.stringify(detalles), hashEvento
                ], function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`🔒 [${nivel}] ${tipoEvento}: ${descripcion}`);
                        resolve({ id: this.lastID, hashEvento });
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error al registrar evento de seguridad:', error);
            throw error;
        }
    }

    /**
     * Genera hash para verificar integridad del evento
     */
    generarHashEvento(datos) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(datos).digest('hex');
    }

    /**
     * Registra evento de inicio de sesión
     */
    async registrarLogin(usuarioId, usuarioNombre, ipAddress, userAgent, exitoso = true) {
        return this.registrarEvento({
            nivel: exitoso ? 'INFO' : 'WARNING',
            tipoEvento: exitoso ? 'LOGIN' : 'LOGIN_FAILED',
            descripcion: exitoso ? 
                `Usuario ${usuarioNombre} inició sesión correctamente` :
                `Intento de inicio de sesión fallido para ${usuarioNombre}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            userAgent,
            detalles: { exitoso }
        });
    }

    /**
     * Registra evento de cierre de sesión
     */
    async registrarLogout(usuarioId, usuarioNombre, ipAddress) {
        return this.registrarEvento({
            nivel: 'INFO',
            tipoEvento: 'LOGOUT',
            descripcion: `Usuario ${usuarioNombre} cerró sesión`,
            usuarioId,
            usuarioNombre,
            ipAddress
        });
    }

    /**
     * Registra evento de acceso denegado
     */
    async registrarAccesoDenegado(usuarioId, usuarioNombre, permiso, ipAddress) {
        return this.registrarEvento({
            nivel: 'WARNING',
            tipoEvento: 'PERMISSION_DENIED',
            descripcion: `Acceso denegado para ${usuarioNombre} al permiso: ${permiso}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { permiso }
        });
    }

    /**
     * Registra evento de acceso a datos sensibles
     */
    async registrarAccesoDatos(usuarioId, usuarioNombre, tipoDatos, operacion, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: 'DATA_ACCESS',
            descripcion: `Usuario ${usuarioNombre} ${operacion} datos sensibles: ${tipoDatos}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { tipoDatos, operacion }
        });
    }

    /**
     * Registra evento de modificación de datos
     */
    async registrarModificacionDatos(usuarioId, usuarioNombre, tabla, registroId, cambios, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: 'DATA_MODIFICATION',
            descripcion: `Usuario ${usuarioNombre} modificó registro ${registroId} en ${tabla}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { tabla, registroId, cambios }
        });
    }

    /**
     * Registra evento de cifrado/descifrado
     */
    async registrarCifrado(usuarioId, usuarioNombre, operacion, tipoDatos, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: operacion === 'cifrar' ? 'ENCRYPTION' : 'DECRYPTION',
            descripcion: `Usuario ${usuarioNombre} ${operacion} datos: ${tipoDatos}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { operacion, tipoDatos }
        });
    }

    /**
     * Registra evento de VeriFactu
     */
    async registrarVeriFactu(usuarioId, usuarioNombre, operacion, facturaId, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: operacion === 'generar' ? 'VERIFACTU_GENERATED' : 'VERIFACTU_SENT',
            descripcion: `Usuario ${usuarioNombre} ${operacion} VeriFactu para factura ${facturaId}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { operacion, facturaId }
        });
    }

    /**
     * Registra evento de backup
     */
    async registrarBackup(usuarioId, usuarioNombre, operacion, archivo, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: operacion === 'crear' ? 'BACKUP_CREATED' : 'BACKUP_RESTORED',
            descripcion: `Usuario ${usuarioNombre} ${operacion} backup: ${archivo}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { operacion, archivo }
        });
    }

    /**
     * Registra evento de verificación de integridad
     */
    async registrarVerificacionIntegridad(usuarioId, usuarioNombre, resultado, ipAddress) {
        return this.registrarEvento({
            nivel: resultado.integridad ? 'INFO' : 'ERROR',
            tipoEvento: 'INTEGRITY_CHECK',
            descripcion: `Usuario ${usuarioNombre} verificó integridad: ${resultado.integridad ? 'OK' : 'ERROR'}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: resultado
        });
    }

    /**
     * Registra evento de gestión de usuarios
     */
    async registrarGestionUsuario(usuarioId, usuarioNombre, operacion, usuarioObjetivo, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: operacion === 'crear' ? 'USER_CREATED' : 
                       operacion === 'modificar' ? 'USER_MODIFIED' : 'USER_DELETED',
            descripcion: `Usuario ${usuarioNombre} ${operacion} usuario: ${usuarioObjetivo}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { operacion, usuarioObjetivo }
        });
    }

    /**
     * Registra evento de cambio de rol
     */
    async registrarCambioRol(usuarioId, usuarioNombre, usuarioObjetivo, rolAnterior, rolNuevo, ipAddress) {
        return this.registrarEvento({
            nivel: 'SECURITY',
            tipoEvento: 'ROLE_CHANGED',
            descripcion: `Usuario ${usuarioNombre} cambió rol de ${usuarioObjetivo}: ${rolAnterior} → ${rolNuevo}`,
            usuarioId,
            usuarioNombre,
            ipAddress,
            detalles: { usuarioObjetivo, rolAnterior, rolNuevo }
        });
    }

    /**
     * Registra evento de error del sistema
     */
    async registrarErrorSistema(error, contexto, usuarioId = null, usuarioNombre = null) {
        return this.registrarEvento({
            nivel: 'ERROR',
            tipoEvento: 'SYSTEM_ERROR',
            descripcion: `Error del sistema: ${error.message}`,
            usuarioId,
            usuarioNombre,
            detalles: { 
                error: error.message, 
                stack: error.stack, 
                contexto 
            }
        });
    }

    /**
     * Registra evento de violación de seguridad
     */
    async registrarViolacionSeguridad(descripcion, detalles, ipAddress, userAgent) {
        return this.registrarEvento({
            nivel: 'CRITICAL',
            tipoEvento: 'SECURITY_VIOLATION',
            descripcion,
            ipAddress,
            userAgent,
            detalles
        });
    }

    /**
     * Obtiene logs de seguridad con filtros
     */
    async obtenerLogs(filtros = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM logs_seguridad WHERE 1=1';
            const params = [];

            if (filtros.nivel) {
                query += ' AND nivel = ?';
                params.push(filtros.nivel);
            }

            if (filtros.tipoEvento) {
                query += ' AND tipo_evento = ?';
                params.push(filtros.tipoEvento);
            }

            if (filtros.usuarioId) {
                query += ' AND usuario_id = ?';
                params.push(filtros.usuarioId);
            }

            if (filtros.fechaDesde) {
                query += ' AND timestamp >= ?';
                params.push(filtros.fechaDesde);
            }

            if (filtros.fechaHasta) {
                query += ' AND timestamp <= ?';
                params.push(filtros.fechaHasta);
            }

            query += ' ORDER BY timestamp DESC';

            if (filtros.limite) {
                query += ' LIMIT ?';
                params.push(filtros.limite);
            }

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Verifica la integridad de los logs
     */
    async verificarIntegridadLogs() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM logs_seguridad ORDER BY timestamp DESC LIMIT 100';
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const resultados = {
                    total: rows.length,
                    verificados: 0,
                    alterados: 0,
                    errores: []
                };

                rows.forEach(row => {
                    try {
                        const datosEvento = JSON.stringify({
                            timestamp: row.timestamp,
                            nivel: row.nivel,
                            tipo_evento: row.tipo_evento,
                            descripcion: row.descripcion,
                            usuario_id: row.usuario_id,
                            usuario_nombre: row.usuario_nombre,
                            ip_address: row.ip_address,
                            detalles: row.detalles
                        });
                        
                        const hashCalculado = this.generarHashEvento(datosEvento);
                        
                        if (hashCalculado === row.hash_evento) {
                            resultados.verificados++;
                        } else {
                            resultados.alterados++;
                            resultados.errores.push({
                                id: row.id,
                                timestamp: row.timestamp,
                                error: 'Hash de integridad no coincide'
                            });
                        }
                    } catch (error) {
                        resultados.errores.push({
                            id: row.id,
                            timestamp: row.timestamp,
                            error: error.message
                        });
                    }
                });

                resolve(resultados);
            });
        });
    }

    /**
     * Obtiene estadísticas de seguridad
     */
    async obtenerEstadisticas(fechaDesde = null, fechaHasta = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    nivel,
                    tipo_evento,
                    COUNT(*) as cantidad,
                    COUNT(DISTINCT usuario_id) as usuarios_unicos
                FROM logs_seguridad 
                WHERE 1=1
            `;
            const params = [];

            if (fechaDesde) {
                query += ' AND timestamp >= ?';
                params.push(fechaDesde);
            }

            if (fechaHasta) {
                query += ' AND timestamp <= ?';
                params.push(fechaHasta);
            }

            query += ' GROUP BY nivel, tipo_evento ORDER BY cantidad DESC';

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = SistemaLogsSeguridad;
