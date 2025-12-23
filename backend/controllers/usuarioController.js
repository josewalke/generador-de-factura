/**
 * Controlador de Usuarios
 * Maneja las peticiones HTTP relacionadas con gestión de usuarios
 */

class UsuarioController {
    constructor(usuarioService) {
        this.usuarioService = usuarioService;
    }

    /**
     * GET /api/usuarios
     */
    async getAll(req, res) {
        try {
            const usuarios = await this.usuarioService.getAll();
            res.json({ success: true, data: usuarios });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * POST /api/usuarios
     */
    async create(req, res) {
        try {
            const datosUsuario = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            const resultado = await this.usuarioService.create(datosUsuario);
            
            // Registrar evento de creación de usuario
            await this.usuarioService.registrarGestionUsuario(
                req.usuario.id,
                req.usuario.username,
                'crear',
                datosUsuario.username,
                ipAddress
            );

            res.json({ success: true, data: resultado });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/roles
     */
    getRoles(req, res) {
        try {
            const roles = this.usuarioService.obtenerRoles();
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
}

module.exports = UsuarioController;


