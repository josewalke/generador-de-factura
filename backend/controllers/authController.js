/**
 * Controlador de Autenticación
 * Maneja las peticiones HTTP relacionadas con autenticación
 */

class AuthController {
    constructor(authService, config) {
        this.authService = authService;
        this.config = config;
    }

    /**
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            const resultado = await this.authService.login(username, password, ipAddress, userAgent);

            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * POST /api/auth/refresh
     */
    refresh(req, res) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader.substring(7);
            
            const newToken = this.authService.refreshToken(token);
            
            res.json({
                success: true,
                data: {
                    token: newToken,
                    expiresIn: this.authService.parseExpiration(this.config.get('security.jwt.expiresIn'))
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/auth/me
     */
    getMe(req, res) {
        try {
            const data = this.authService.getMe(req.user);
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/auth/roles
     */
    getRoles(req, res) {
        try {
            const roles = this.authService.getAllRoles();
            res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * POST /api/auth/check-permission
     */
    checkPermission(req, res) {
        try {
            const { resource, action } = req.body;
            const data = this.authService.checkPermission(req.user, resource, action);
            
            res.json({
                success: true,
                data: data
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * POST /api/auth/logout
     */
    async logout(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            const resultado = await this.authService.logout(token, req.usuario, ipAddress);

            res.json(resultado);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = AuthController;


