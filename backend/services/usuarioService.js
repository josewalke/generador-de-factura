/**
 * Servicio de Usuarios
 * Encapsula la lógica de negocio para gestión de usuarios
 */

class UsuarioService {
    constructor(db, sistemaControlAcceso, sistemaLogsSeguridad) {
        this.db = db;
        this.sistemaControlAcceso = sistemaControlAcceso;
        this.sistemaLogsSeguridad = sistemaLogsSeguridad;
    }

    /**
     * Obtener todos los usuarios
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username, rol, nombre, email, activo, ultimo_acceso FROM usuarios WHERE activo = 1';
            this.db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Crear nuevo usuario
     */
    async create(datosUsuario) {
        const resultado = await this.sistemaControlAcceso.crearUsuario(datosUsuario);
        return resultado;
    }

    /**
     * Obtener roles disponibles
     */
    obtenerRoles() {
        return this.sistemaControlAcceso.obtenerRoles();
    }

    /**
     * Registrar evento de gestión de usuario
     */
    async registrarGestionUsuario(usuarioId, username, accion, usuarioGestionado, ipAddress) {
        if (this.sistemaLogsSeguridad) {
            await this.sistemaLogsSeguridad.registrarGestionUsuario(
                usuarioId,
                username,
                accion,
                usuarioGestionado,
                ipAddress
            );
        }
    }
}

module.exports = UsuarioService;


