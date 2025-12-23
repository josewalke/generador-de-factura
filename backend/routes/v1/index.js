/**
 * Router principal para API v1
 * Centraliza todas las rutas versionadas
 * 
 * @module routes/v1
 */

const express = require('express');

/**
 * Crea el router principal de la API v1
 * @param {Object} dependencies - Dependencias necesarias para las rutas
 * @returns {express.Router} Router de Express configurado
 */
function createV1Router(dependencies) {
    const router = express.Router();
    
    // Importar todos los routers de v1
    const createClientesRouter = require('../clientesRoutes');
    const createCochesRouter = require('../cochesRoutes');
    const createProductosRouter = require('../productosRoutes');
    const createFacturasRouter = require('../facturasRoutes');
    const createProformasRouter = require('../proformasRoutes');
    const createAbonosRouter = require('../abonosRoutes');
    const createEmpresasRouter = require('../empresasRoutes');
    const createValidacionRouter = require('../validacionRoutes');
    const createBackupRouter = require('../backupRoutes');
    const createAuditoriaRouter = require('../auditoriaRoutes');
    const createPerformanceRouter = require('../performanceRoutes');
    const createDebugRouter = require('../debugRoutes');
    const createMetricsRouter = require('../metricsRoutes');
    const createConfiguracionRouter = require('../configuracionRoutes');
    const createResetDataRouter = require('../resetDataRoutes');
    const createLogsRouter = require('../logsRoutes');
    const createImportarExportarRouter = require('../importarExportarRoutes');
    const createAuthRouter = require('../authRoutes');
    const createCifradoRouter = require('../cifradoRoutes');
    const createSecurityRouter = require('../securityRoutes');
    const createLogsSeguridadRouter = require('../logsSeguridadRoutes');
    const createUsuariosRouter = require('../usuariosRoutes');
    const { createRolesRouter } = require('../usuariosRoutes');

    const {
        db,
        logger,
        cacheManager,
        paginationManager,
        sistemaIntegridad,
        sistemaAuditoria,
        sistemaFirmaDigital,
        generadorVeriFactu,
        sistemaBackup,
        sistemaValidacionFiscal,
        configuracionEmpresa,
        insertSampleData,
        preheatCache,
        authServiceWrapper,
        cifradoService,
        securityService,
        logsSeguridadService,
        usuarioService,
        sistemaControlAcceso,
        config,
        importadorExcel
    } = dependencies;

    // Registrar todas las rutas bajo /api/v1
    router.use('/clientes', createClientesRouter(db, logger, cacheManager));
    router.use('/coches', createCochesRouter(db, logger, cacheManager));
    router.use('/productos', createProductosRouter(db, logger, cacheManager));
    router.use('/facturas', createFacturasRouter(
        db, 
        logger, 
        cacheManager, 
        paginationManager, 
        sistemaIntegridad, 
        sistemaAuditoria, 
        sistemaFirmaDigital, 
        generadorVeriFactu
    ));
    router.use('/proformas', createProformasRouter(db, logger, cacheManager, paginationManager));
    router.use('/abonos', createAbonosRouter(db, logger, cacheManager, paginationManager));
    router.use('/empresas', createEmpresasRouter(db, logger, cacheManager, paginationManager, sistemaFirmaDigital));
    router.use('/validacion', createValidacionRouter(sistemaValidacionFiscal, logger));
    router.use('/backup', createBackupRouter(sistemaBackup, logger));
    router.use('/auditoria', createAuditoriaRouter(sistemaAuditoria, logger));
    router.use('/performance', createPerformanceRouter(cacheManager, paginationManager, preheatCache, logger));
    router.use('/debug', createDebugRouter(db, logger));
    router.use('/metrics', createMetricsRouter(db, logger));
    router.use('/configuracion', createConfiguracionRouter(configuracionEmpresa, logger));
    router.use('/reset-data', createResetDataRouter(db, logger, insertSampleData));
    router.use('/logs', createLogsRouter(logger));
    router.use('/', createImportarExportarRouter(db, logger, importadorExcel));
    
    // Rutas de autenticación y seguridad
    router.use('/auth', createAuthRouter(authServiceWrapper, config, sistemaControlAcceso));
    router.use('/cifrado', createCifradoRouter(cifradoService, sistemaControlAcceso));
    router.use('/security', createSecurityRouter(securityService));
    router.use('/logs-seguridad', createLogsSeguridadRouter(logsSeguridadService, sistemaControlAcceso));
    router.use('/usuarios', createUsuariosRouter(usuarioService, sistemaControlAcceso));
    router.use('/roles', createRolesRouter(usuarioService));

    return router;
}

module.exports = createV1Router;

