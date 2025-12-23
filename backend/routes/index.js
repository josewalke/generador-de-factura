const express = require('express');
const createClientesRouter = require('./clientesRoutes');
const createEmpresasRouter = require('./empresasRoutes');

/**
 * Configurar todas las rutas de la aplicación
 */
function configureRoutes(app, db, logger, cacheManager, paginationManager) {
    const router = express.Router();

    // Rutas de clientes (refactorizadas)
    app.use('/api/clientes', createClientesRouter(db, logger, cacheManager));

    // Rutas de empresas (ya existentes)
    app.use('/api/empresas', createEmpresasRouter(db, cacheManager, paginationManager, logger));

    // Nota: Las demás rutas (coches, productos, facturas, proformas, etc.)
    // se mantendrán en server.js por ahora y se migrarán gradualmente
    // Esto permite una migración incremental sin romper el código existente

    return router;
}

module.exports = configureRoutes;



