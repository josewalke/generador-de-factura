/**
 * Rutas de Usuarios
 * Define las rutas API para gestión de usuarios
 */

const express = require('express');

function createUsuariosRouter(usuarioService, sistemaControlAcceso) {
    const router = express.Router();
    const UsuarioController = require('../controllers/usuarioController');
    const controller = new UsuarioController(usuarioService);

    // GET /api/usuarios - Obtener todos los usuarios
    router.get('/', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('usuarios:leer'), 
        controller.getAll.bind(controller)
    );

    // POST /api/usuarios - Crear nuevo usuario
    router.post('/', 
        sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('usuarios:crear'), 
        controller.create.bind(controller)
    );

    return router;
}

// Función separada para la ruta de roles (está en /api/roles, no /api/usuarios/roles)
function createRolesRouter(usuarioService) {
    const router = express.Router();
    const UsuarioController = require('../controllers/usuarioController');
    const controller = new UsuarioController(usuarioService);

    // GET /api/roles - Obtener roles disponibles
    router.get('/', controller.getRoles.bind(controller));

    return router;
}

module.exports = createUsuariosRouter;
module.exports.createRolesRouter = createRolesRouter;

