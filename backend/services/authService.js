/**
 * Servicio de Autenticación
 * Encapsula la lógica de negocio para autenticación de usuarios
 */

const AuthService = require('../modules/authService');
const RoleManager = require('../modules/roleManager');

class AuthServiceWrapper {
    constructor(db, sistemaLogsSeguridad, securityMonitor, sistemaControlAcceso) {
        this.authService = new AuthService();
        this.roleManager = new RoleManager();
        this.db = db;
        this.sistemaLogsSeguridad = sistemaLogsSeguridad;
        this.securityMonitor = securityMonitor;
        this.sistemaControlAcceso = sistemaControlAcceso;
    }

    /**
     * Autenticar usuario
     */
    async login(username, password, ipAddress, userAgent) {
        try {
            // Validar entrada
            if (!username || !password) {
                throw new Error('Username y password son requeridos');
            }

            // Autenticar usuario
            const resultado = await this.authService.authenticateUser(username, password, this.db);
            
            // Actualizar último acceso
            this.db.run('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?', 
                [new Date().toISOString(), resultado.user.id]);

            // Registrar evento de login exitoso
            if (this.sistemaLogsSeguridad) {
                await this.sistemaLogsSeguridad.registrarLogin(
                    resultado.user.id,
                    resultado.user.username,
                    ipAddress,
                    userAgent,
                    true
                );
            }

            return resultado;
        } catch (error) {
            // Registrar intento fallido en monitoreo de seguridad
            if (this.securityMonitor) {
                this.securityMonitor.logFailedLogin(username, ipAddress, userAgent);
            }
            
            // Registrar intento fallido
            if (this.sistemaLogsSeguridad) {
                await this.sistemaLogsSeguridad.registrarLogin(
                    null,
                    username,
                    ipAddress,
                    userAgent,
                    false
                );
            }

            throw error;
        }
    }

    /**
     * Refrescar token
     */
    refreshToken(token) {
        return this.authService.refreshToken(token);
    }

    /**
     * Obtener información del usuario actual
     */
    getMe(user) {
        return {
            user: user,
            permissions: this.roleManager.getRolePermissions(user.role),
            roleInfo: this.roleManager.getRoleInfo(user.role)
        };
    }

    /**
     * Obtener roles disponibles
     */
    getAllRoles() {
        return this.roleManager.getAllRoles();
    }

    /**
     * Verificar permisos
     */
    checkPermission(user, resource, action) {
        if (!resource || !action) {
            throw new Error('Resource y action son requeridos');
        }

        const hasPermission = this.roleManager.canAccess(user.role, resource, action);
        
        return {
            hasPermission,
            resource,
            action,
            userRole: user.role
        };
    }

    /**
     * Cerrar sesión
     */
    async logout(token, usuario, ipAddress) {
        try {
            await this.sistemaControlAcceso.cerrarSesion(token);
            
            // Registrar evento de logout
            if (this.sistemaLogsSeguridad) {
                await this.sistemaLogsSeguridad.registrarLogout(
                    usuario.id,
                    usuario.username,
                    ipAddress
                );
            }

            return { success: true, message: 'Sesión cerrada correctamente' };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener parseExpiration
     */
    parseExpiration(expiresIn) {
        return this.authService.parseExpiration(expiresIn);
    }
}

module.exports = AuthServiceWrapper;


