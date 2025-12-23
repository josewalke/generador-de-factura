const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { cacheHeaders, etagMiddleware, responseTimeMiddleware } = require('./middlewares/performance.middleware');
const { DatabaseCacheManager } = require('./modules/sistemaCache');
const PaginationManager = require('./modules/sistemaPaginacion');
const { LoggerFactory } = require('./modules/sistemaLogging');
const ImportadorExcel = require('./modules/importadorExcel');
const database = require('./modules/database');
const SQLAdapter = require('./modules/sqlAdapter');

// Exportar la instancia de la base de datos para uso en otros mÃ³dulos
let db;
let cacheManager;
let paginationManager;
let logger;
let importadorExcel;

// Inicializar logger
logger = LoggerFactory.create(config.getAll());

/**
 * Inicializa los sistemas de rendimiento del servidor
 * - Sistema de caché
 * - Sistema de paginación
 * - Importador Excel
 * - Precalentamiento de caché
 * 
 * @async
 * @function initPerformanceSystems
 * @returns {Promise<void>}
 */
async function initPerformanceSystems() {
    try {
        // Inicializar sistema de cachÃ©
        cacheManager = new DatabaseCacheManager(config.getAll());
        logger.systemEvent('Sistema de cachÃ© inicializado');
        
        // Inicializar sistema de paginaciÃ³n
        paginationManager = new PaginationManager(config.getAll());
        paginationManager.setDatabase(db);
        
        logger.systemEvent('Sistema de paginaciÃ³n inicializado');
        
        // Inicializar importador Excel
        importadorExcel = new ImportadorExcel(db);
        logger.systemEvent('Importador Excel inicializado');
        
        // Precalentar cachÃ© con datos frecuentes de forma asÃ­ncrona
        // Solo despuÃ©s de que db estÃ© disponible
        setImmediate(async () => {
            // Esperar a que db estÃ© disponible
            let attempts = 0;
            while (!db && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            if (db) {
                await preheatCache();
            } else {
                logger.warn('No se pudo precalentar cachÃ©: base de datos no disponible', {}, 'cache');
            }
        });
        
    } catch (error) {
        logger.error('Error inicializando sistemas de rendimiento', { error: error.message });
    }
}

/**
 * Precalienta el caché con datos frecuentes
 * Carga datos comunes en caché para mejorar rendimiento
 * 
 * @async
 * @function preheatCache
 * @returns {Promise<void>}
 */
async function preheatCache() {
    // Verificar que db estÃ© disponible antes de precalentar
    if (!db) {
        logger.warn('Base de datos no disponible para precalentar cachÃ©, omitiendo...', {}, 'cache');
        return;
    }
    
    try {
        const fetchFunctions = {
            'empresas:all': () => new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('Base de datos no disponible'));
                    return;
                }
                db.all('SELECT * FROM empresas ORDER BY nombre', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            'productos:all': () => new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('Base de datos no disponible'));
                    return;
                }
                const dbType = config.get('database.type') || 'postgresql';
                const activoValue = dbType === 'postgresql' ? 'true' : '1';
                db.all(`SELECT * FROM productos WHERE activo = ${activoValue} ORDER BY descripcion`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            'clientes:count': () => new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('Base de datos no disponible'));
                    return;
                }
                db.get('SELECT COUNT(*) as count FROM clientes', (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            }),
            'facturas:count': () => new Promise((resolve, reject) => {
                if (!db) {
                    reject(new Error('Base de datos no disponible'));
                    return;
                }
                db.get('SELECT COUNT(*) as count FROM facturas', (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            })
        };
        
        await cacheManager.preheat(fetchFunctions);
        logger.systemEvent('CachÃ© precalentado con datos frecuentes');
    } catch (error) {
        logger.error('Error precalentando cachÃ©', { error: error.message }, 'cache');
    }
}

// MÃ³dulos para cumplir con la Ley Antifraude
const SistemaIntegridad = require('./modules/sistemaIntegridad');
const SistemaAuditoria = require('./modules/sistemaAuditoria');
const GeneradorVeriFactu = require('./modules/generadorVeriFactu');
const SistemaBackup = require('./modules/sistemaBackup');
const SistemaCifrado = require('./modules/sistemaCifrado');
const SistemaControlAcceso = require('./modules/sistemaControlAcceso');
const SistemaLogsSeguridad = require('./modules/sistemaLogsSeguridad');
const SistemaValidacionFiscal = require('./modules/sistemaValidacionFiscal');
const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');
const AuthService = require('./modules/authService');
const HTTPSManager = require('./modules/httpsManager');
const RoleManager = require('./modules/roleManager');
const SecurityMonitor = require('./modules/securityMonitor');

// Rutas modulares
const createClientesRouter = require('./routes/clientesRoutes');
const createCochesRouter = require('./routes/cochesRoutes');
const createProductosRouter = require('./routes/productosRoutes');
const createFacturasRouter = require('./routes/facturasRoutes');
const createProformasRouter = require('./routes/proformasRoutes');
const createEmpresasRouter = require('./routes/empresasRoutes');
const createAbonosRouter = require('./routes/abonosRoutes');
const createValidacionRouter = require('./routes/validacionRoutes');
const createImportarExportarRouter = require('./routes/importarExportarRoutes');
const createAuthRouter = require('./routes/authRoutes');
const createCifradoRouter = require('./routes/cifradoRoutes');
const createSecurityRouter = require('./routes/securityRoutes');
const createLogsSeguridadRouter = require('./routes/logsSeguridadRoutes');
const createUsuariosRouter = require('./routes/usuariosRoutes');
const { createRolesRouter } = require('./routes/usuariosRoutes');
const createBackupRouter = require('./routes/backupRoutes');
const createAuditoriaRouter = require('./routes/auditoriaRoutes');
const createPerformanceRouter = require('./routes/performanceRoutes');
const createDebugRouter = require('./routes/debugRoutes');
const createMetricsRouter = require('./routes/metricsRoutes');
const createConfiguracionRouter = require('./routes/configuracionRoutes');
const createResetDataRouter = require('./routes/resetDataRoutes');
const createLogsRouter = require('./routes/logsRoutes');

const app = express();
const PORT = config.get('server.port');
let HOST = config.get('server.host');

// Asegurar que el servidor escuche en todas las interfaces
if (HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '::1') {
    logger.warn('ðŸ› ï¸ HOST configurado como localhost. Cambiando automÃ¡ticamente a 0.0.0.0 para permitir acceso externo.', {}, 'general');
    HOST = '0.0.0.0';
}

// Inicializar servicios de seguridad
const authService = new AuthService();
const httpsManager = new HTTPSManager();
const roleManager = new RoleManager();
const securityMonitor = new SecurityMonitor();

function buildFacturaFilters(queryParams = {}, excludeAnuladas = true) {
    const dbType = config.get('database.type') || 'postgresql';
    const activoValue = dbType === 'postgresql' ? 'true' : '1';
    const likeOperator = dbType === 'postgresql' ? 'ILIKE' : 'LIKE';
    
    const search = queryParams.search || '';
    const empresaId = queryParams.empresa_id || '';
    const clienteId = queryParams.cliente_id || '';
    const fechaDesde = queryParams.fecha_desde || '';
    const fechaHasta = queryParams.fecha_hasta || '';
    
    const conditions = [`(f.activo = ${activoValue} OR f.activo IS NULL)`];
    const params = [];
    
    // Excluir facturas anuladas de los cÃ¡lculos de ingresos
    if (excludeAnuladas) {
        conditions.push(`(f.estado IS NULL OR f.estado != 'anulado')`);
    }
    
    if (search) {
        const likeValue = `%${search}%`;
        conditions.push(`(f.numero_factura ${likeOperator} ? OR c.nombre ${likeOperator} ? OR e.nombre ${likeOperator} ?)`);
        params.push(likeValue, likeValue, likeValue);
    }
    
    if (empresaId) {
        conditions.push('f.empresa_id = ?');
        params.push(empresaId);
    }
    
    if (clienteId) {
        conditions.push('f.cliente_id = ?');
        params.push(clienteId);
    }
    
    if (fechaDesde) {
        conditions.push('f.fecha_emision >= ?');
        params.push(fechaDesde);
    }
    
    if (fechaHasta) {
        conditions.push('f.fecha_emision <= ?');
        params.push(fechaHasta);
    }
    
    return {
        whereClause: conditions.join(' AND '),
        params
    };
}

function fetchFacturaResumen(queryParams = {}) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no inicializada'));
            return;
        }
        
        // Excluir facturas anuladas de los cÃ¡lculos de ingresos
        const { whereClause, params } = buildFacturaFilters(queryParams, true);
        const query = `
            SELECT 
                COUNT(DISTINCT f.id) as total_facturas,
                COALESCE(SUM(CASE WHEN f.estado != 'anulado' THEN f.total ELSE 0 END), 0) as ingresos_totales,
                COALESCE(SUM(CASE WHEN f.estado = 'pagada' THEN f.total ELSE 0 END), 0) as ingresos_pagados
            FROM facturas f
            LEFT JOIN clientes c ON f.cliente_id = c.id
            LEFT JOIN empresas e ON f.empresa_id = e.id
            ${whereClause ? 'WHERE ' + whereClause : ''}
        `;
        
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            
            const total = Number(row?.total_facturas || 0);
            const ingresos = Number(row?.ingresos_pagados || 0);
            const ingresosTotales = Number(row?.ingresos_totales || 0);
            
            resolve({
                totalFacturas: total,
                ingresos,
                ingresosTotales,
                promedio: total > 0 ? ingresos / total : 0
            });
        });
    });
}

function runGet(query, params = []) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Base de datos no inicializada'));
            return;
        }
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row || {});
        });
    });
}

async function ensureFacturaLeyAntifraudeColumns(isPostgreSQL) {
    const columns = [
        { name: 'numero_serie', type: 'TEXT' },
        { name: 'fecha_operacion', type: 'DATE' },
        { name: 'tipo_documento', type: 'TEXT DEFAULT \'factura\'' },
        { name: 'metodo_pago', type: 'TEXT DEFAULT \'transferencia\'' },
        { name: 'referencia_operacion', type: 'TEXT' },
        { name: 'hash_documento', type: 'TEXT' },
        { name: 'sellado_temporal', type: isPostgreSQL ? 'TIMESTAMP' : 'DATETIME' },
        { name: 'estado_fiscal', type: 'TEXT DEFAULT \'pendiente\'' },
        { name: 'codigo_verifactu', type: 'TEXT' },
        { name: 'respuesta_aeat', type: 'TEXT' }
    ];

    for (const column of columns) {
        try {
            if (isPostgreSQL) {
                // PostgreSQL: usar IF NOT EXISTS
                await db.query(`ALTER TABLE facturas ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`);
            } else {
                // SQLite: intentar aÃ±adir y ignorar si ya existe
                await new Promise((resolve, reject) => {
                    db.run(`ALTER TABLE facturas ADD COLUMN ${column.name} ${column.type}`, (err) => {
                        if (err && !err.message.toLowerCase().includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
            logger.debug(`Columna ${column.name} verificada en facturas`);
        } catch (error) {
            // Ignorar errores de columna duplicada
            if (!error.message.includes('duplicate') && !error.message.includes('already exists') && !error.message.includes('ya existe')) {
                logger.error(`Error asegurando columna ${column.name} en facturas`, { error: error.message });
            }
        }
    }
    logger.systemEvent('Columnas de Ley Antifraude verificadas en facturas');
}

async function ensureDetalleFacturaCocheColumn(isPostgreSQL) {
    try {
        if (isPostgreSQL) {
            await db.query('ALTER TABLE detalles_factura ADD COLUMN IF NOT EXISTS coche_id INTEGER');
        } else {
            await new Promise((resolve, reject) => {
                db.run(`ALTER TABLE detalles_factura ADD COLUMN coche_id INTEGER`, (err) => {
                    if (err && !err.message.toLowerCase().includes('duplicate column name')) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        logger.systemEvent('Columna coche_id verificada en detalles_factura');
    } catch (error) {
        logger.error('Error asegurando columna coche_id en detalles_factura', { error: error.message });
    }
}

async function migrateDetalleFacturaCocheId() {
    if (!db) return;
    const dbType = config.get('database.type') || 'postgresql';
    try {
        if (dbType === 'postgresql') {
            await db.query(`
                WITH matches AS (
                    SELECT df.id, c.id as coche_id
                    FROM detalles_factura df
                    JOIN coches c ON LOWER(COALESCE(df.descripcion, '')) LIKE '%' || LOWER(c.matricula) || '%'
                    WHERE df.coche_id IS NULL AND c.matricula IS NOT NULL
                )
                UPDATE detalles_factura df
                SET coche_id = matches.coche_id
                FROM matches
                WHERE df.id = matches.id
            `);
        } else {
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE detalles_factura
                    SET coche_id = (
                        SELECT c.id
                        FROM coches c
                        WHERE LOWER(COALESCE(detalles_factura.descripcion, '')) LIKE '%' || LOWER(c.matricula) || '%'
                        ORDER BY c.id
                        LIMIT 1
                    )
                    WHERE coche_id IS NULL
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        logger.systemEvent('MigraciÃ³n coche_id en detalles_factura completada');
    } catch (error) {
        logger.warn('No se pudo migrar coche_id en detalles_factura', { error: error.message });
    }
}

async function ensureCocheMarcaColumn(isPostgreSQL) {
    try {
        if (isPostgreSQL) {
            await db.query('ALTER TABLE coches ADD COLUMN IF NOT EXISTS marca TEXT');
        } else {
            await new Promise((resolve, reject) => {
                db.run(`ALTER TABLE coches ADD COLUMN marca TEXT`, (err) => {
                    if (err && !err.message.toLowerCase().includes('duplicate column name')) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        logger.systemEvent('Columna marca verificada en coches');
    } catch (error) {
        logger.error('Error asegurando columna marca en coches', { error: error.message });
    }
}

async function migrateCocheMarcaFromModelo() {
    if (!db) return;
    const dbType = config.get('database.type') || 'postgresql';
    try {
        if (dbType === 'postgresql') {
            // Actualizar marca desde modelo para registros con marca NULL, vacÃ­a o 'N/A'
            await db.query(`
                UPDATE coches
                SET marca = TRIM(SPLIT_PART(modelo, ' ', 1)),
                    modelo = CASE 
                        WHEN POSITION(' ' IN modelo) > 0 
                        THEN TRIM(SUBSTRING(modelo FROM POSITION(' ' IN modelo) + 1))
                        ELSE modelo
                    END
                WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                  AND modelo IS NOT NULL 
                  AND modelo != ''
                  AND TRIM(modelo) != ''
            `);
        } else {
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE coches
                    SET marca = TRIM(SUBSTR(modelo, 1, CASE WHEN INSTR(modelo || ' ', ' ') > 0 THEN INSTR(modelo || ' ', ' ') - 1 ELSE LENGTH(modelo) END)),
                        modelo = CASE 
                            WHEN INSTR(modelo || ' ', ' ') > 0 
                            THEN TRIM(SUBSTR(modelo, INSTR(modelo || ' ', ' ') + 1))
                            ELSE modelo
                        END
                    WHERE (marca IS NULL OR marca = '' OR marca = 'N/A') 
                      AND modelo IS NOT NULL 
                      AND modelo != ''
                      AND TRIM(modelo) != ''
                `, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        logger.systemEvent('MigraciÃ³n marca desde modelo completada');
    } catch (error) {
        logger.warn('No se pudo migrar marca desde modelo', { error: error.message });
    }
}

// Middleware de autenticaciÃ³n para endpoints protegidos
const requireAuth = (req, res, next) => {
    authService.authMiddleware(req, res, next);
};

const requireRole = (roles) => {
    return authService.requireRole(roles);
};

// Middleware de seguridad mejorado
if (config.get('security.helmet')) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:", "http:"], // Permitir conexiones HTTPS y HTTP
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
            maxAge: 31536000, // 1 aÃ±o
            includeSubDomains: true,
            preload: true
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    }));
}

// Rate limiting general
const limiter = rateLimit({
    windowMs: config.get('security.rateLimit.windowMs'),
    max: config.get('security.rateLimit.max'),
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intÃ©ntelo de nuevo mÃ¡s tarde.',
        retryAfter: Math.ceil(config.get('security.rateLimit.windowMs') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Saltar rate limiting para localhost en desarrollo
        return config.get('server.environment') === 'development' && 
               (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
    }
});

app.use(limiter);

// Rate limiting mÃ¡s estricto para login (protecciÃ³n contra fuerza bruta)
const loginLimiter = rateLimit({
    windowMs: config.get('security.rateLimit.loginWindowMs'),
    max: config.get('security.rateLimit.loginMax'),
    message: {
        error: 'Demasiados intentos de login. IntÃ©ntelo de nuevo mÃ¡s tarde.',
        retryAfter: Math.ceil(config.get('security.rateLimit.loginWindowMs') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // No contar intentos exitosos
});

// Aplicar rate limiting estricto a endpoints de autenticaciÃ³n
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// Middleware de logging optimizado con monitoreo de seguridad
app.use((req, res, next) => {
    const start = Date.now();
    
    // Log de inicio de peticiÃ³n
    logger.debug(`Incoming request: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? logger.sanitizeData(req.body) : null
    }, 'api');
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Log detallado de la peticiÃ³n
        logger.apiRequest(req.method, req.url, res.statusCode, duration, req);
        
        // Registrar en monitoreo de seguridad
        securityMonitor.logHTTPRequest(req, duration, res.statusCode);
        
        // Detectar cÃ³digos de error
        if (res.statusCode >= 400) {
            logger.error(`HTTP Error ${res.statusCode}: ${req.method} ${req.url}`, {
                statusCode: res.statusCode,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                duration: `${duration}ms`,
                query: req.query,
                body: req.method !== 'GET' ? logger.sanitizeData(req.body) : null
            }, 'api');
            
            securityMonitor.logSecurityEvent('http_error', {
                statusCode: res.statusCode,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            }, res.statusCode >= 500 ? 'high' : 'medium');
        }
    });
    
    next();
});

// Middleware de validaciÃ³n de entrada
app.use((req, res, next) => {
    // Sanitizar parÃ¡metros de consulta
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].replace(/[<>\"'%;()&+]/g, '');
            }
        });
    }
    
    // Validar tamaÃ±o del body
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
        return res.status(413).json({ error: 'Payload demasiado grande' });
    }
    
    next();
});

app.use(cors(config.get('server.cors')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// MIDDLEWARES DE RENDIMIENTO
// ========================================

// Compresión de respuestas (GZIP) - Reduce tamaño de respuestas en ~70%
app.use(compression({
    level: 6, // Nivel de compresión balanceado (0-9)
    threshold: 1024, // Solo comprimir respuestas > 1KB
    filter: (req, res) => {
        // No comprimir si el cliente no lo soporta
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Usar el filtro por defecto de compression
        return compression.filter(req, res);
    }
}));

// Headers de caché HTTP para respuestas GET
app.use(cacheHeaders(300)); // 5 minutos de caché por defecto

// ETag para validación condicional (reduce ancho de banda)
app.use(etagMiddleware());

// Medición de tiempo de respuesta (para monitoreo)
app.use(responseTimeMiddleware());

// ========================================
// FIN MIDDLEWARES DE RENDIMIENTO
// ========================================

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Validar tipo MIME
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        // Validar extensiÃ³n
        const allowedExtensions = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB lÃ­mite (reducido por seguridad)
        files: 1 // Solo un archivo por vez
    }
});

// Cargar configuraciÃ³n dinÃ¡mica de empresa
let configuracionEmpresa = null;
config.loadFromDatabase().then(() => {
    configuracionEmpresa = config.get('empresa');
    logger.systemEvent('ConfiguraciÃ³n de empresa cargada', { empresa: configuracionEmpresa.nombre });
});

// Inicializar base de datos
async function initDatabaseConnection() {
    const dbType = config.get('database.type') || 'postgresql';
    
    if (dbType === 'postgresql') {
        // Usar PostgreSQL
        try {
            await database.connect();
            db = database;
            logger.systemEvent('Base de datos PostgreSQL conectada exitosamente', {
                host: config.get('database.host'),
                database: config.get('database.database')
            });
            
            // Crear wrapper compatible con SQLite
            db = {
                // MÃ©todos con callback para compatibilidad (usados por el cÃ³digo existente)
                all: (query, params, callback) => {
                    if (typeof params === 'function') {
                        callback = params;
                        params = [];
                    }
                    database.allWithCallback(query, params, callback);
                },
                get: (query, params, callback) => {
                    if (typeof params === 'function') {
                        callback = params;
                        params = [];
                    }
                    database.getWithCallback(query, params, callback);
                },
                run: (query, params, callback) => {
                    if (typeof params === 'function') {
                        callback = params;
                        params = [];
                    }
                    // Wrapper para simular comportamiento de SQLite (this.lastID)
                    database.runWithCallback(query, params, (err, result) => {
                        if (!callback) {
                            return; // No hay callback, no hacer nada
                        }
                        if (err) {
                            callback(err);
                            return;
                        }
                        // Crear un objeto que simule 'this' de SQLite
                        const sqliteContext = {
                            lastID: result?.lastID || null,
                            changes: result?.changes || 0
                        };
                        // Llamar al callback con el contexto simulado
                        callback.call(sqliteContext, err);
                    });
                },
                
                // MÃ©todos async (para nuevo cÃ³digo)
                query: (text, params) => database.query(text, params),
                
                // Para compatibilidad con cÃ³digo existente
                serialize: (callback) => {
                    // En PostgreSQL no necesitamos serialize, ejecutamos directamente
                    if (callback) callback();
                },
                close: () => database.close()
            };
            
            await initDatabase();
        } catch (error) {
            logger.error('Error al conectar con PostgreSQL', { error: error.message, stack: error.stack });
            throw error;
        }
    } else {
        // Usar SQLite (compatibilidad)
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = config.get('database.path');
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                logger.error('Error al conectar con la base de datos SQLite', { error: err.message });
            } else {
                logger.systemEvent('Base de datos SQLite conectada exitosamente');
                
                // Configurar la base de datos para mejor manejo de concurrencia y memoria
                db.run(`PRAGMA busy_timeout = ${config.get('database.timeout')}`);
                db.run(`PRAGMA journal_mode = ${config.get('database.journalMode')}`);
                db.run(`PRAGMA synchronous = ${config.get('database.synchronous')}`);
                db.run(`PRAGMA cache_size = ${config.get('database.cacheSize')}`);
                db.run(`PRAGMA temp_store = memory`);
                db.run(`PRAGMA mmap_size = 268435456`);
                db.run(`PRAGMA optimize`);
                
                initDatabase();
            }
        });
    }
}

// Inicializar conexiÃ³n
initDatabaseConnection().catch(err => {
    logger.error('Error fatal al inicializar base de datos', { error: err.message });
    process.exit(1);
});

// FunciÃ³n utilitaria para ejecutar operaciones de base de datos con reintentos
function ejecutarConReintentos(operacion, maxReintentos = 3, delay = 100) {
    return new Promise((resolve, reject) => {
        let intentos = 0;
        
        function intentar() {
            operacion()
                .then(resolve)
                .catch(err => {
                    if (err.code === 'SQLITE_BUSY' && intentos < maxReintentos) {
                        intentos++;
                        logger.warn(`Base de datos ocupada, reintentando... (${intentos}/${maxReintentos})`, {}, 'database');
                        setTimeout(intentar, delay * intentos);
                    } else {
                        reject(err);
                    }
                });
        }
        
        intentar();
    });
}

// Inicializar mÃ³dulos de la Ley Antifraude
let sistemaIntegridad, sistemaAuditoria, generadorVeriFactu, sistemaBackup;
let sistemaCifrado, sistemaControlAcceso, sistemaLogsSeguridad, sistemaValidacionFiscal;
let sistemaFirmaDigital;
let modulosAntifraudeInicializados = false;

// FunciÃ³n para inicializar mÃ³dulos despuÃ©s de la base de datos
function initModulosAntifraude() {
    // Evitar inicializaciÃ³n duplicada
    if (modulosAntifraudeInicializados) {
        logger.debug('MÃ³dulos de Ley Antifraude ya inicializados, omitiendo...', {}, 'operations');
        return;
    }
    try {
        // Verificar que db estÃ© definido antes de continuar
        if (!db) {
            logger.warn('Base de datos no estÃ¡ lista aÃºn, reintentando inicializaciÃ³n de mÃ³dulos...', {}, 'operations');
            // Reintentar despuÃ©s de un breve delay
            setTimeout(() => {
                if (db) {
                    initModulosAntifraude();
                } else {
                    logger.error('No se pudo inicializar mÃ³dulos: base de datos no disponible', {}, 'operations');
                }
            }, 500);
            return;
        }
        
        sistemaIntegridad = new SistemaIntegridad();
        sistemaAuditoria = new SistemaAuditoria(db);
        generadorVeriFactu = new GeneradorVeriFactu();
        sistemaBackup = new SistemaBackup(db, {
            directorioBackup: './backups',
            frecuenciaBackup: 24 * 60 * 60 * 1000, // 24 horas
            retencionDias: 1460 // 4 aÃ±os
        });
        
        // Nuevos mÃ³dulos de seguridad
        sistemaCifrado = new SistemaCifrado();
        sistemaControlAcceso = new SistemaControlAcceso(db);
        sistemaLogsSeguridad = new SistemaLogsSeguridad(db);
        sistemaValidacionFiscal = new SistemaValidacionFiscal();
        sistemaFirmaDigital = new SistemaFirmaDigital(db);
        
        // Inicializar sistemas que requieren base de datos de forma asÃ­ncrona
        // para no bloquear el arranque del servidor
        setImmediate(async () => {
            try {
                await sistemaControlAcceso.inicializar();
                await sistemaLogsSeguridad.inicializar();
                
                // Iniciar backup automÃ¡tico de forma asÃ­ncrona (no bloquea el arranque)
                sistemaBackup.iniciarBackupAutomatico();
                
                logger.systemEvent('MÃ³dulos de Ley Antifraude inicializados correctamente');
                logger.systemEvent('Sistema de cifrado activado');
                logger.systemEvent('Sistema de control de acceso activado');
                logger.systemEvent('Sistema de logs de seguridad activado');
                logger.systemEvent('Sistema de validaciÃ³n fiscal activado');
                logger.systemEvent('Sistema de firma digital activado');
                logger.systemEvent('Sistema de backup automÃ¡tico activado');
                
                // Configurar endpoints de seguridad despuÃ©s de la inicializaciÃ³n
                configurarEndpointsSeguridad();
                
                // Registrar rutas modulares despuÃ©s de que todo estÃ© inicializado
                registrarRutasModulares();
                
                // Marcar como inicializado
                modulosAntifraudeInicializados = true;
            } catch (initError) {
                logger.error('Error al inicializar mÃ³dulos de seguridad', { 
                    error: initError.message, 
                    stack: initError.stack 
                }, 'operations');
            }
        });
        
    } catch (error) {
        logger.error('Error al crear mÃ³dulos de Ley Antifraude', { error: error.message, stack: error.stack }, 'operations');
    }
}

// FunciÃ³n para registrar rutas modulares
function registrarRutasModulares() {
    if (!db) {
        logger.warn('Base de datos no disponible, reintentando registro de rutas...', {}, 'operations');
        setTimeout(registrarRutasModulares, 500);
        return;
    }

    if (!modulosAntifraudeInicializados) {
        logger.warn('MÃ³dulos antifraude no inicializados, reintentando registro de rutas...', {}, 'operations');
        setTimeout(registrarRutasModulares, 500);
        return;
    }

    if (!cacheManager || !paginationManager) {
        logger.warn('Sistemas de rendimiento no inicializados, reintentando registro de rutas...', {}, 'operations');
        setTimeout(registrarRutasModulares, 500);
        return;
    }

    try {
        // Crear instancias de servicios para autenticaciÃ³n y seguridad
        const AuthServiceWrapper = require('./services/authService');
        const CifradoService = require('./services/cifradoService');
        const SecurityService = require('./services/securityService');
        const LogsSeguridadService = require('./services/logsSeguridadService');
        const UsuarioService = require('./services/usuarioService');

        const authServiceWrapper = new AuthServiceWrapper(db, sistemaLogsSeguridad, securityMonitor, sistemaControlAcceso);
        const cifradoService = new CifradoService(sistemaCifrado, sistemaLogsSeguridad);
        const securityService = new SecurityService(securityMonitor);
        const logsSeguridadService = new LogsSeguridadService(sistemaLogsSeguridad);
        const usuarioService = new UsuarioService(db, sistemaControlAcceso, sistemaLogsSeguridad);

        // Registrar rutas modulares
        // Compatibilidad: Mantener rutas sin versión para compatibilidad hacia atrás
        // Versión v1 disponible en /api/v1/* (opcional, no afecta rutas existentes)
        app.use('/api/clientes', createClientesRouter(db, logger, cacheManager));
        app.use('/api/coches', createCochesRouter(db, logger, cacheManager));
        app.use('/api/productos', createProductosRouter(db, logger, cacheManager));
        app.use('/api/facturas', createFacturasRouter(
            db, 
            logger, 
            cacheManager, 
            paginationManager, 
            sistemaIntegridad, 
            sistemaAuditoria, 
            sistemaFirmaDigital, 
            generadorVeriFactu
        ));
        app.use('/api/proformas', createProformasRouter(db, logger, cacheManager, paginationManager));
        app.use('/api/abonos', createAbonosRouter(db, logger, cacheManager, paginationManager));
        app.use('/api/empresas', createEmpresasRouter(db, logger, cacheManager, paginationManager, sistemaFirmaDigital));
        app.use('/api/validacion', createValidacionRouter(sistemaValidacionFiscal, logger));
        app.use('/api/backup', createBackupRouter(sistemaBackup, logger));
        app.use('/api/auditoria', createAuditoriaRouter(sistemaAuditoria, logger));
        app.use('/api/performance', createPerformanceRouter(cacheManager, paginationManager, preheatCache, logger));
        app.use('/api/debug', createDebugRouter(db, logger));
        app.use('/api/metrics', createMetricsRouter(db, logger));
        app.use('/api/configuracion', createConfiguracionRouter(configuracionEmpresa, logger));
        app.use('/api/reset-data', createResetDataRouter(db, logger, insertSampleData));
        app.use('/api/logs', createLogsRouter(logger));
        app.use('/api', createImportarExportarRouter(db, logger, importadorExcel));
        
        // Registrar rutas de autenticaciÃ³n y seguridad
        app.use('/api/auth', createAuthRouter(authServiceWrapper, config, sistemaControlAcceso));
        app.use('/api/cifrado', createCifradoRouter(cifradoService, sistemaControlAcceso));
        app.use('/api/security', createSecurityRouter(securityService));
        app.use('/api/logs-seguridad', createLogsSeguridadRouter(logsSeguridadService, sistemaControlAcceso));
        app.use('/api/usuarios', createUsuariosRouter(usuarioService, sistemaControlAcceso));
        app.use('/api/roles', createRolesRouter(usuarioService));

        logger.systemEvent('Rutas modulares registradas correctamente');
        console.log('âœ… Rutas modulares registradas: clientes, coches, productos, facturas, proformas, abonos, validacion, importar/exportar, auth, cifrado, security, logs-seguridad, usuarios, roles');
    } catch (error) {
        logger.error('Error registrando rutas modulares', { error: error.message, stack: error.stack }, 'operations');
    }
}

// Inicializar tablas
async function initDatabase() {
    logger.systemEvent('Inicializando base de datos');
    
    const dbType = config.get('database.type') || 'postgresql';
    const isPostgreSQL = dbType === 'postgresql';
    
    // FunciÃ³n helper para ejecutar queries
    const executeQuery = async (query, callback) => {
        try {
            if (isPostgreSQL) {
                const adaptedQuery = SQLAdapter.adapt(query);
                const result = await db.query(adaptedQuery);
                if (callback) callback(null, result);
            } else {
                db.run(query, callback);
            }
        } catch (error) {
            if (callback) callback(error, null);
        }
    };
    
    // Crear tablas secuencialmente
    try {
        // Adaptar queries para PostgreSQL si es necesario
        const adaptQuery = (query) => {
            return isPostgreSQL ? SQLAdapter.adapt(query) : query;
        };
        
        // FunciÃ³n helper para ejecutar CREATE TABLE
        const createTable = async (query, tableName) => {
            try {
                const adaptedQuery = adaptQuery(query);
                if (isPostgreSQL) {
                    await db.query(adaptedQuery);
                } else {
                    await new Promise((resolve, reject) => {
                        db.run(adaptedQuery, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
                logger.debug(`Tabla ${tableName} creada/verificada`, {}, 'database');
            } catch (err) {
                // Ignorar error si la tabla ya existe o columna duplicada
                if (!err.message.includes('already exists') && 
                    !err.message.includes('duplicate column name')) {
                    logger.error(`Error al crear tabla ${tableName}`, { error: err.message }, 'database');
                }
            }
        };
        
        // Tabla de clientes
        await createTable(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                direccion TEXT NOT NULL,
                codigo_postal TEXT,
                identificacion TEXT UNIQUE NOT NULL,
                email TEXT,
                telefono TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, 'clientes');
        
        // AÃ±adir columna codigo_postal si no existe (solo para SQLite, PostgreSQL ya la tiene)
        if (!isPostgreSQL) {
            try {
                await new Promise((resolve, reject) => {
                    db.run('ALTER TABLE clientes ADD COLUMN codigo_postal TEXT', (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (err) {
                // Ignorar si la columna ya existe
            }
        }

        // Tabla de empresas
        await createTable(`
            CREATE TABLE IF NOT EXISTS empresas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                cif TEXT NOT NULL UNIQUE,
                direccion TEXT,
                telefono TEXT,
                email TEXT,
                logo TEXT,
                certificado_thumbprint TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo INTEGER DEFAULT 1
            )
        `, 'empresas');

        // Tabla de usuarios para autenticaciÃ³n
        await createTable(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                empresa_id INTEGER,
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                ultimo_acceso DATETIME,
                FOREIGN KEY (empresa_id) REFERENCES empresas (id)
            )
        `, 'usuarios');
        
        // Crear usuario por defecto para aplicaciÃ³n de escritorio
        setImmediate(async () => {
            try {
                await authService.createDefaultUser(db);
            } catch (error) {
                logger.error('Error creando usuario por defecto', { error: error.message });
            }
        });

        // Tabla de coches
        await createTable(`
            CREATE TABLE IF NOT EXISTS coches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                matricula TEXT UNIQUE NOT NULL,
                chasis TEXT NOT NULL,
                color TEXT NOT NULL,
                kms INTEGER NOT NULL,
                modelo TEXT NOT NULL,
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, 'coches');

        // Tabla de productos/vehÃ­culos
        await createTable(`
            CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT,
                descripcion TEXT NOT NULL,
                precio REAL NOT NULL,
                stock INTEGER DEFAULT 0,
                categoria TEXT DEFAULT 'vehiculo',
                activo BOOLEAN DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, 'productos');
        
        // Agregar columna codigo si no existe (solo para SQLite)
        if (!isPostgreSQL) {
            try {
                await new Promise((resolve, reject) => {
                    db.run('ALTER TABLE productos ADD COLUMN codigo TEXT', (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (err) {
                // Ignorar si la columna ya existe
            }
        }

        // Tabla de facturas
        await createTable(`
            CREATE TABLE IF NOT EXISTS facturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_factura TEXT NOT NULL,
                empresa_id INTEGER NOT NULL,
                cliente_id INTEGER,
                fecha_emision DATE NOT NULL,
                fecha_vencimiento DATE,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                estado TEXT DEFAULT 'pendiente',
                notas TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo ${isPostgreSQL ? 'BOOLEAN DEFAULT true' : 'INTEGER DEFAULT 1'},
                FOREIGN KEY (empresa_id) REFERENCES empresas (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                UNIQUE(numero_factura, empresa_id)
            )
        `, 'facturas');
        
        // Agregar columna activo si no existe (para tablas existentes)
        try {
            if (isPostgreSQL) {
                // Intentar agregar la columna directamente, ignorar si ya existe
                try {
                    await db.query('ALTER TABLE facturas ADD COLUMN activo BOOLEAN DEFAULT true');
                    logger.debug('Columna activo agregada a facturas');
                } catch (alterErr) {
                    // Ignorar si la columna ya existe
                    if (!alterErr.message.includes('duplicate column') && 
                        !alterErr.message.includes('ya existe') &&
                        !alterErr.message.includes('already exists')) {
                        // Si es otro error, lo relanzamos
                        throw alterErr;
                    }
                    logger.debug('Columna activo ya existe en facturas');
                }
            } else {
                await new Promise((resolve, reject) => {
                    db.run('ALTER TABLE facturas ADD COLUMN activo INTEGER DEFAULT 1', (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        } catch (err) {
            // Ignorar si la columna ya existe
            logger.debug('Columna activo ya existe en facturas o error al agregarla', { error: err.message });
        }

        // Asegurar columnas de Ley Antifraude en facturas
        await ensureFacturaLeyAntifraudeColumns(isPostgreSQL);
        logger.systemEvent('Columnas de Ley Antifraude verificadas en facturas');
        
        // Agregar columna proforma_id si no existe (para relaciÃ³n con proformas)
        try {
            if (isPostgreSQL) {
                try {
                    await db.query('ALTER TABLE facturas ADD COLUMN proforma_id INTEGER');
                    logger.debug('Columna proforma_id agregada a facturas');
                } catch (alterErr) {
                    if (!alterErr.message.includes('duplicate column') && 
                        !alterErr.message.includes('ya existe') &&
                        !alterErr.message.includes('already exists')) {
                        throw alterErr;
                    }
                    logger.debug('Columna proforma_id ya existe en facturas');
                }
            } else {
                await new Promise((resolve, reject) => {
                    db.run('ALTER TABLE facturas ADD COLUMN proforma_id INTEGER', (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        } catch (err) {
            logger.debug('Columna proforma_id ya existe en facturas o error al agregarla', { error: err.message });
        }

        // Tabla de detalles de factura
        await createTable(`
            CREATE TABLE IF NOT EXISTS detalles_factura (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                factura_id INTEGER,
                producto_id INTEGER,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                descripcion TEXT,
                tipo_impuesto TEXT DEFAULT 'igic',
                FOREIGN KEY (factura_id) REFERENCES facturas (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )
        `, 'detalles_factura');
        
        await ensureDetalleFacturaCocheColumn(isPostgreSQL);
        
        // Agregar columnas adicionales si no existen (solo para SQLite, PostgreSQL ya las tiene)
        if (!isPostgreSQL) {
            // Agregar columna descripcion si no existe
            try {
                await new Promise((resolve, reject) => {
                    db.run(`ALTER TABLE detalles_factura ADD COLUMN descripcion TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (err) {
                // Ignorar si la columna ya existe
            }
            
            // Agregar columna tipo_impuesto si no existe
            try {
                await new Promise((resolve, reject) => {
                    db.run(`ALTER TABLE detalles_factura ADD COLUMN tipo_impuesto TEXT DEFAULT 'igic'`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (err) {
                // Ignorar si la columna ya existe
            }
        }
        
        await migrateDetalleFacturaCocheId();
        
        // Asegurar columna marca en coches
        await ensureCocheMarcaColumn(isPostgreSQL);
        
        // Migrar marca desde modelo existente
        await migrateCocheMarcaFromModelo();

        // Tabla de proformas (presupuestos sin validez fiscal)
        await createTable(`
            CREATE TABLE IF NOT EXISTS proformas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_proforma TEXT NOT NULL,
                empresa_id INTEGER NOT NULL,
                cliente_id INTEGER,
                coche_id INTEGER,
                fecha_emision DATE NOT NULL,
                fecha_validez DATE,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                estado TEXT DEFAULT 'pendiente',
                notas TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo ${isPostgreSQL ? 'BOOLEAN DEFAULT true' : 'INTEGER DEFAULT 1'},
                FOREIGN KEY (empresa_id) REFERENCES empresas (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                FOREIGN KEY (coche_id) REFERENCES coches (id),
                UNIQUE(numero_proforma, empresa_id)
            )
        `, 'proformas');

        // Tabla de detalles de proforma
        await createTable(`
            CREATE TABLE IF NOT EXISTS detalles_proforma (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proforma_id INTEGER NOT NULL,
                producto_id INTEGER,
                coche_id INTEGER,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                descripcion TEXT,
                tipo_impuesto TEXT DEFAULT 'igic',
                FOREIGN KEY (proforma_id) REFERENCES proformas (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id),
                FOREIGN KEY (coche_id) REFERENCES coches (id)
            )
        `, 'detalles_proforma');

        // Tabla de abonos (notas de crÃ©dito)
        await createTable(`
            CREATE TABLE IF NOT EXISTS abonos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_abono TEXT NOT NULL,
                factura_id INTEGER NOT NULL,
                empresa_id INTEGER NOT NULL,
                cliente_id INTEGER,
                fecha_emision DATE NOT NULL,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                estado TEXT DEFAULT 'pendiente',
                notas TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo ${isPostgreSQL ? 'BOOLEAN DEFAULT true' : 'INTEGER DEFAULT 1'},
                numero_serie TEXT,
                fecha_operacion DATE,
                tipo_documento TEXT DEFAULT 'abono',
                metodo_pago TEXT,
                referencia_operacion TEXT,
                hash_documento TEXT,
                sellado_temporal DATETIME,
                estado_fiscal TEXT DEFAULT 'pendiente',
                codigo_verifactu TEXT,
                respuesta_aeat TEXT,
                FOREIGN KEY (factura_id) REFERENCES facturas (id),
                FOREIGN KEY (empresa_id) REFERENCES empresas (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                UNIQUE(numero_abono, empresa_id)
            )
        `, 'abonos');

        // Tabla de detalles de abono
        await createTable(`
            CREATE TABLE IF NOT EXISTS detalles_abono (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                abono_id INTEGER NOT NULL,
                producto_id INTEGER,
                coche_id INTEGER,
                cantidad INTEGER NOT NULL,
                precio_unitario REAL NOT NULL,
                subtotal REAL NOT NULL,
                igic REAL NOT NULL,
                total REAL NOT NULL,
                descripcion TEXT,
                tipo_impuesto TEXT DEFAULT 'igic',
                FOREIGN KEY (abono_id) REFERENCES abonos (id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos (id),
                FOREIGN KEY (coche_id) REFERENCES coches (id)
            )
        `, 'detalles_abono');

        // Tabla de auditorÃ­a (para cumplir con Ley Antifraude)
        await createTable(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tabla TEXT NOT NULL,
                registro_id INTEGER NOT NULL,
                operacion TEXT NOT NULL,
                datos_anteriores TEXT,
                datos_nuevos TEXT,
                usuario_id INTEGER,
                fecha_operacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT
            )
        `, 'audit_log');
        
        // Insertar datos de ejemplo despuÃ©s de crear todas las tablas
        insertSampleData(isPostgreSQL);
        
        // Aplicar Ã­ndices adicionales de rendimiento
        await applyPerformanceIndexes(isPostgreSQL);
        
        // Crear Ã­ndices optimizados despuÃ©s de que todas las tablas estÃ©n listas
        // Asegurarse de que paginationManager tenga db antes de crear Ã­ndices
        if (paginationManager && db) {
            paginationManager.setDatabase(db);
            paginationManager.createPaginationIndexes().then(() => {
                logger.systemEvent('Ãndices de paginaciÃ³n creados');
            }).catch((error) => {
                logger.error('Error creando Ã­ndices de paginaciÃ³n', { error: error.message }, 'database');
            });
        }
        
        // Inicializar mÃ³dulos de Ley Antifraude
        initModulosAntifraude();
        
        // Inicializar sistemas de rendimiento
        initPerformanceSystems();
        
    } catch (error) {
        logger.error('Error inicializando base de datos', { error: error.message, stack: error.stack }, 'database');
        throw error;
    }
}

// Aplicar Ã­ndices adicionales de rendimiento
async function applyPerformanceIndexes(isPostgreSQL) {
    if (!db) {
        logger.warn('Base de datos no disponible para crear Ã­ndices de rendimiento', {}, 'database');
        return;
    }
    
    try {
        const migrationPath = path.join(__dirname, 'migrations', '006_indices_rendimiento.sql');
        
        if (!fs.existsSync(migrationPath)) {
            logger.warn('Archivo de migraciÃ³n de Ã­ndices no encontrado', { path: migrationPath }, 'database');
            return;
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            try {
                const adaptedQuery = isPostgreSQL ? SQLAdapter.adapt(statement.trim()) : statement.trim();
                
                if (isPostgreSQL) {
                    await db.query(adaptedQuery);
                } else {
                    await new Promise((resolve, reject) => {
                        db.run(adaptedQuery, (err) => {
                            if (err && !err.message.includes('already exists') && 
                                !err.message.includes('duplicate column name') &&
                                !err.message.includes('no such index')) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            } catch (err) {
                // Ignorar errores de Ã­ndices ya existentes
                if (!err.message.includes('already exists') && 
                    !err.message.includes('duplicate') &&
                    !err.message.includes('no such index')) {
                    logger.debug('Error aplicando Ã­ndice de rendimiento', { error: err.message }, 'database');
                }
            }
        }
        
        logger.systemEvent('Ãndices de rendimiento aplicados correctamente');
    } catch (error) {
        logger.error('Error aplicando Ã­ndices de rendimiento', { error: error.message }, 'database');
    }
}

// Insertar datos de ejemplo de forma silenciosa
function insertSampleData(isPostgreSQL = false) {
    // Verificar que db estÃ© disponible
    if (!db) {
        logger.warn('Base de datos no disponible para insertar datos de ejemplo', {}, 'database');
        return;
    }
    
    // Insertar empresa Telwagen
    const empresaQuery = isPostgreSQL
        ? `INSERT INTO empresas (nombre, cif, direccion, telefono, email) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cif) DO NOTHING`
        : `INSERT OR IGNORE INTO empresas (nombre, cif, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(empresaQuery, [
        'Telwagen Car IbÃ©rica, S.L.',
        'B-93.289.585',
        'C. / TomÃ¡s Miller NÂ° 48 Local\n35007 Las Palmas de Gran Canaria',
        '+34 928 123 456',
        'info@telwagen.es'
    ], (err) => {
        if (err && !err.message.includes('duplicate') && !err.message.includes('UNIQUE')) {
            logger.debug('Error insertando empresa de ejemplo', { error: err.message }, 'database');
        }
    });

    // Insertar cliente de ejemplo
    const clienteQuery = isPostgreSQL
        ? `INSERT INTO clientes (nombre, direccion, identificacion, email, telefono) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (identificacion) DO NOTHING`
        : `INSERT OR IGNORE INTO clientes (nombre, direccion, identificacion, email, telefono) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(clienteQuery, [
        'GRUPO MIGUEL LEON S.L.',
        'C/. ALFREDO MARTIN REYES NÂ° 7\nLAS PALMAS DE G.C.',
        'B76233865',
        'info@grupomiguelleon.es',
        '+34 928 123 456'
    ]);

    // Insertar coches de ejemplo (solo algunos para reducir logs)
    const cochesEjemplo = [
        { matricula: 'GC-1234-AB', chasis: 'WBAVB13506PT12345', color: 'Blanco', kms: 45000, modelo: 'BMW 320i' },
        { matricula: 'GC-5678-CD', chasis: 'WVWZZZ1KZAW123456', color: 'Negro', kms: 32000, modelo: 'Volkswagen Golf' },
        { matricula: 'GC-9012-EF', chasis: 'WAUZZZ8V8KA123456', color: 'Azul', kms: 28000, modelo: 'Audi A4' }
    ];

    const cocheQuery = isPostgreSQL
        ? `INSERT INTO coches (matricula, chasis, color, kms, modelo) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (matricula) DO NOTHING`
        : `INSERT OR IGNORE INTO coches (matricula, chasis, color, kms, modelo) VALUES (?, ?, ?, ?, ?)`;

    cochesEjemplo.forEach(coche => {
        db.run(cocheQuery, [coche.matricula, coche.chasis, coche.color, coche.kms, coche.modelo], (err) => {
            if (err && !err.message.includes('duplicate') && !err.message.includes('UNIQUE')) {
                logger.debug('Error insertando coche de ejemplo', { error: err.message }, 'database');
            }
        });
    });

    // Insertar productos de ejemplo (solo algunos)
    const productosEjemplo = [
        { codigo: 'NISSAN-MICRA-1.0', descripcion: 'Nissan Micra 1.0', precio: 15000 },
        { codigo: 'NISSAN-QASHQAI-1.3', descripcion: 'Nissan Qashqai 1.3', precio: 25000 },
        { codigo: 'NISSAN-LEAF-40KWH', descripcion: 'Nissan Leaf 40kWh', precio: 35000 }
    ];

    const productoQuery = isPostgreSQL
        ? `INSERT INTO productos (codigo, descripcion, precio, stock) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`
        : `INSERT OR IGNORE INTO productos (codigo, descripcion, precio, stock) VALUES (?, ?, ?, ?)`;

    productosEjemplo.forEach(producto => {
        db.run(productoQuery, [producto.codigo, producto.descripcion, producto.precio, 10], (err) => {
            if (err && !err.message.includes('duplicate') && !err.message.includes('UNIQUE')) {
                logger.debug('Error insertando producto de ejemplo', { error: err.message }, 'database');
            }
        });
    });
}

// Todas las rutas han sido migradas a mÃ³dulos en backend/routes/

// FunciÃ³n para configurar endpoints de seguridad despuÃ©s de la inicializaciÃ³n
function configurarEndpointsSeguridad() {
    // Rutas de autenticaciÃ³n, cifrado, seguridad, logs-seguridad, usuarios y roles
    // migradas a: routes/authRoutes.js, cifradoRoutes.js, securityRoutes.js, etc.
    
    // ========================================
    // ENDPOINTS DE FIRMA DIGITAL
    // ========================================

    // InformaciÃ³n del certificado
    app.get('/api/firma-digital/certificado', async (req, res) => {
        try {
            const info = await sistemaFirmaDigital.obtenerInformacionCertificado();
            res.json({ success: true, data: info });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Obtener certificados de Windows
    app.get('/api/firma-digital/certificados-windows', async (req, res) => {
        try {
            const resultado = await sistemaFirmaDigital.obtenerCertificadosWindows();
            res.json(resultado);
        } catch (error) {
            console.error('Error al obtener certificados de Windows:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Asociar certificado con empresa
    app.post('/api/firma-digital/asociar-certificado-empresa', async (req, res) => {
        try {
            const { empresaId, thumbprint } = req.body;
            
            if (!empresaId || !thumbprint) {
                return res.status(400).json({
                    success: false,
                    error: 'empresaId y thumbprint son requeridos'
                });
            }
            
            const resultado = await sistemaFirmaDigital.asociarCertificadoConEmpresa(empresaId, thumbprint);
            res.json(resultado);
        } catch (error) {
            console.error('Error al asociar certificado con empresa:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Obtener certificado asociado a empresa
    app.get('/api/firma-digital/certificado-empresa/:empresaId', async (req, res) => {
        try {
            const { empresaId } = req.params;
            
            const resultado = await sistemaFirmaDigital.obtenerCertificadoEmpresa(empresaId);
            res.json(resultado);
        } catch (error) {
            console.error('Error al obtener certificado de empresa:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Firmar documento con certificado de empresa
    app.post('/api/firma-digital/firmar-documento-empresa', async (req, res) => {
        try {
            const { empresaId, datosDocumento } = req.body;
            
            if (!empresaId || !datosDocumento) {
                return res.status(400).json({
                    success: false,
                    error: 'empresaId y datosDocumento son requeridos'
                });
            }
            
            const resultado = await sistemaFirmaDigital.firmarDocumentoConEmpresa(empresaId, datosDocumento);
            res.json(resultado);
        } catch (error) {
            console.error('Error al firmar documento con empresa:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Obtener todas las firmas digitales disponibles
    app.get('/api/firma-digital/firmas-disponibles', async (req, res) => {
        try {
            const resultado = await sistemaFirmaDigital.detectarTodasLasFirmasDisponibles();
            res.json(resultado);
        } catch (error) {
            console.error('Error al obtener firmas disponibles:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Obtener firmas disponibles para asignar a una empresa especÃ­fica
    app.get('/api/firma-digital/firmas-para-asignar/:empresaId?', async (req, res) => {
        try {
            const empresaId = req.params.empresaId ? parseInt(req.params.empresaId) : null;
            const resultado = await sistemaFirmaDigital.obtenerFirmasParaAsignar(empresaId);
            res.json(resultado);
        } catch (error) {
            console.error('Error al obtener firmas para asignar:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Verificar alertas de certificados prÃ³ximos a caducar
    app.get('/api/firma-digital/alertas-certificados', async (req, res) => {
        try {
            const resultado = await sistemaFirmaDigital.verificarAlertasCertificados();
            res.json(resultado);
        } catch (error) {
            console.error('Error al verificar alertas de certificados:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Cambiar certificado activo
    app.post('/api/firma-digital/cambiar-certificado', async (req, res) => {
        try {
            const { thumbprint } = req.body;
            
            if (!thumbprint) {
                return res.status(400).json({
                    success: false,
                    error: 'Thumbprint es requerido'
                });
            }
            
            const resultado = await sistemaFirmaDigital.cambiarCertificadoActivo(thumbprint);
            res.json(resultado);
        } catch (error) {
            console.error('Error al cambiar certificado:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Error interno del servidor' 
            });
        }
    });

    // Firmar documento
    app.post('/api/firma-digital/firmar', async (req, res) => {
        try {
            const { datosDocumento } = req.body;
            const firma = sistemaFirmaDigital.firmarDocumento(datosDocumento);
            res.json({ success: true, data: firma });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Verificar firma
    app.post('/api/firma-digital/verificar', async (req, res) => {
        try {
            const { firmaCompleta, datosDocumento } = req.body;
            const verificacion = sistemaFirmaDigital.verificarFirma(firmaCompleta, datosDocumento);
            res.json({ success: true, data: verificacion });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Firmar factura especÃ­fica
    app.post('/api/facturas/:id/firmar', async (req, res) => {
        try {
            const facturaId = req.params.id;
            
            // Obtener datos de la factura
            const factura = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                           e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
                    FROM facturas f 
                    LEFT JOIN clientes c ON f.cliente_id = c.id 
                    LEFT JOIN empresas e ON f.empresa_id = e.id
                    WHERE f.id = ?
                `, [facturaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!factura) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Obtener productos de la factura
            const productos = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT df.*, p.descripcion as producto_descripcion
                    FROM detalles_factura df
                    LEFT JOIN productos p ON df.producto_id = p.id
                    WHERE df.factura_id = ?
                `, [facturaId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Preparar datos para firma
            const datosFactura = {
                ...factura,
                productos: productos
            };

            // Firmar factura con certificado de la empresa
            const resultadoFirma = await sistemaFirmaDigital.firmarDocumentoConEmpresa(factura.empresa_id, datosFactura);
            
            if (!resultadoFirma.success) {
                return res.status(400).json({
                    success: false,
                    error: `Error al firmar factura: ${resultadoFirma.error}`
                });
            }
            
            const firmaDigital = {
                firma: resultadoFirma.firma,
                archivo: resultadoFirma.firma.archivo,
                certificado: resultadoFirma.firma.certificado
            };

            // Actualizar factura con informaciÃ³n de firma
            await new Promise((resolve, reject) => {
                db.run('UPDATE facturas SET respuesta_aeat = ? WHERE id = ?', 
                    [JSON.stringify({ firma_digital: firmaDigital.firma, archivo_firma: firmaDigital.archivo }), facturaId], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });

            res.json({ 
                success: true, 
                data: {
                    factura_id: facturaId,
                    numero_factura: factura.numero_factura,
                    firma: firmaDigital.firma,
                    archivo: firmaDigital.archivo,
                    timestamp: firmaDigital.timestamp
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Verificar firma de factura
    app.get('/api/facturas/:id/verificar-firma', async (req, res) => {
        try {
            const facturaId = req.params.id;
            
            // Obtener datos de la factura
            const factura = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                           e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
                    FROM facturas f 
                    LEFT JOIN clientes c ON f.cliente_id = c.id 
                    LEFT JOIN empresas e ON f.empresa_id = e.id
                    WHERE f.id = ?
                `, [facturaId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!factura) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Obtener productos de la factura
            const productos = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT df.*, p.descripcion as producto_descripcion
                    FROM detalles_factura df
                    LEFT JOIN productos p ON df.producto_id = p.id
                    WHERE df.factura_id = ?
                `, [facturaId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Preparar datos para verificaciÃ³n
            const datosFactura = {
                ...factura,
                productos: productos
            };

            // Verificar si tiene firma digital
            let firmaCompleta = null;
            if (factura.respuesta_aeat) {
                try {
                    const respuestaAEAT = JSON.parse(factura.respuesta_aeat);
                    if (respuestaAEAT.firma_digital) {
                        firmaCompleta = respuestaAEAT.firma_digital;
                    }
                } catch (error) {
                    console.warn('âš ï¸ Error al parsear respuesta AEAT:', error.message);
                }
            }

            if (!firmaCompleta) {
                return res.json({
                    success: true,
                    data: {
                        factura_id: facturaId,
                        numero_factura: factura.numero_factura,
                        tiene_firma: false,
                        mensaje: 'La factura no tiene firma digital'
                    }
                });
            }

            // Verificar firma
            const verificacion = sistemaFirmaDigital.verificarFactura(datosFactura, firmaCompleta);

            res.json({ 
                success: true, 
                data: verificacion
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Listar firmas generadas
    app.get('/api/firma-digital/firmas', (req, res) => {
        try {
            const firmas = sistemaFirmaDigital.listarFirmas();
            res.json({ success: true, data: firmas });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Cargar firma especÃ­fica
    app.get('/api/firma-digital/firmas/:archivo', (req, res) => {
        try {
            const archivo = req.params.archivo;
            const firma = sistemaFirmaDigital.cargarFirma(archivo);
            res.json({ success: true, data: firma });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Generar certificado de producciÃ³n
    app.post('/api/firma-digital/certificado-produccion', async (req, res) => {
        try {
            const datosEmpresa = req.body;
            const certificado = sistemaFirmaDigital.generarCertificadoProduccion(datosEmpresa);
            res.json({ success: true, data: certificado });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
}

// Endpoint para obtener estadÃ­sticas de logs (fuera de configurarEndpointsSeguridad)
// ========================================
// RUTAS DE LOGS - MIGRADAS A MÃ“DULOS
// Estas rutas ahora estÃ¡n en: routes/logsRoutes.js
// ========================================
// CÃ³digo comentado eliminado - rutas migradas a mÃ³dulos

// Manejo de errores
app.use((err, req, res, next) => {
    logger.error('Error no manejado en la aplicaciÃ³n', { 
        error: err.message, 
        stack: err.stack,
        url: req.url,
        method: req.method
    }, 'error');
    res.status(500).json({ error: 'Algo saliÃ³ mal!' });
});

// FunciÃ³n para obtener IPs locales
function getLocalIPs() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const ips = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Ignorar IPv6 y direcciones internas
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    
    return ips;
}

// FunciÃ³n para configurar firewall automÃ¡ticamente (Windows)
function configureFirewall(port) {
    // Verificar si la regla ya existe
    exec(`netsh advfirewall firewall show rule name="Node.js Backend - Puerto ${port}"`, (error, stdout) => {
        if (stdout && stdout.includes('Node.js Backend')) {
            logger.info(`âœ… Regla del firewall ya existe para puerto ${port}`, {}, 'general');
            return;
        }
        
        // Intentar crear la regla (requiere permisos de administrador)
        const command = `netsh advfirewall firewall add rule name="Node.js Backend - Puerto ${port}" dir=in action=allow protocol=TCP localport=${port}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Si falla, probablemente no tiene permisos de administrador
                logger.warn(`âš ï¸  No se pudo configurar el firewall automÃ¡ticamente.`, {}, 'general');
                logger.warn(`   Ejecuta como Administrador: .\\configurar-firewall.ps1`, {}, 'general');
                logger.warn(`   O configura manualmente el puerto ${port} en el Firewall de Windows`, {}, 'general');
            } else {
                logger.info(`âœ… Regla del firewall creada para puerto ${port}`, {}, 'general');
                console.log(`âœ… Firewall configurado: puerto ${port} permitido`);
            }
        });
    });
}

// Iniciar servidor HTTP
const server = app.listen(PORT, HOST, () => {
    const localIPs = getLocalIPs();
    
    logger.systemEvent('Servidor backend iniciado', {
        port: PORT,
        host: HOST,
        environment: config.get('server.environment')
    });
    
    // Logs con URLs completas
    logger.info(`ðŸ“¡ API disponible localmente: http://localhost:${PORT}`, {}, 'general');
    logger.info(`ðŸ“‹ DocumentaciÃ³n: http://localhost:${PORT}/`, {}, 'general');
    
    // Mostrar URLs para acceso desde otros ordenadores
    if (localIPs.length > 0) {
        logger.info(`ðŸŒ URLs para acceso desde otros ordenadores:`, {}, 'general');
        localIPs.forEach(ip => {
            logger.info(`   â€¢ http://${ip}:${PORT}`, {}, 'general');
            logger.info(`   â€¢ http://${ip}:${PORT}/api/clientes`, {}, 'general');
        });
    } else {
        logger.warn('âš ï¸  No se detectaron IPs de red local', {}, 'general');
    }
    
    // Programar limpieza de logs antiguos cada 24 horas
    setInterval(() => {
        logger.cleanupOldLogs(30); // Mantener logs de 30 dÃ­as
    }, 24 * 60 * 60 * 1000);
    
    console.log(`ðŸš€ Servidor HTTP ejecutÃ¡ndose en http://${HOST}:${PORT}`);
    console.log(`ðŸ“± AplicaciÃ³n de escritorio puede conectarse desde Electron`);
    
    // Mostrar URLs en consola tambiÃ©n
    if (localIPs.length > 0) {
        console.log(`\nðŸŒ URLs para acceso desde otros ordenadores:`);
        localIPs.forEach(ip => {
            console.log(`   â€¢ http://${ip}:${PORT}`);
        });
    }
    
    // Intentar configurar firewall automÃ¡ticamente (solo Windows)
    if (process.platform === 'win32') {
        configureFirewall(PORT);
    }
    
    // Configurar HTTPS para acceso desde Internet
    const HTTPS_PORT = parseInt(process.env.HTTPS_PORT) || 8443;
    const enableHTTPS = process.env.ENABLE_HTTPS !== 'false';
    
    if (enableHTTPS) {
        try {
            const httpsServer = httpsManager.createHTTPSServer(app, HTTPS_PORT);
            if (httpsServer) {
                logger.info(`ðŸ”’ Servidor HTTPS iniciado en puerto ${HTTPS_PORT}`, {}, 'general');
                
                // Configurar firewall para HTTPS
                if (process.platform === 'win32') {
                    configureFirewall(HTTPS_PORT);
                }
                
                // Mostrar URLs HTTPS
                if (localIPs.length > 0) {
                    logger.info(`ðŸ”’ URLs HTTPS para acceso desde Internet:`, {}, 'general');
                    localIPs.forEach(ip => {
                        logger.info(`   â€¢ https://${ip}:${HTTPS_PORT}`, {}, 'general');
                    });
                    console.log(`\nðŸ”’ URLs HTTPS:`);
                    localIPs.forEach(ip => {
                        console.log(`   â€¢ https://${ip}:${HTTPS_PORT}`);
                    });
                }
                
                // Mostrar IP pÃºblica HTTPS
                try {
                    const { execSync } = require('child_process');
                    const publicIP = execSync('powershell -Command "(Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content"', { encoding: 'utf8' }).trim();
                    console.log(`   â€¢ https://${publicIP}:${HTTPS_PORT}`);
                    logger.info(`   â€¢ https://${publicIP}:${HTTPS_PORT}`, {}, 'general');
                } catch (e) {
                    console.log(`   â€¢ https://92.186.17.227:${HTTPS_PORT}`);
                    logger.info(`   â€¢ https://92.186.17.227:${HTTPS_PORT}`, {}, 'general');
                }
            }
        } catch (error) {
            logger.error('Error iniciando servidor HTTPS', { error: error.message }, 'general');
            console.error('âš ï¸  No se pudo iniciar servidor HTTPS, continuando solo con HTTP');
        }
    }
    
    // Configurar HTTPS para aplicaciÃ³n de escritorio (modo Electron)
    if (config.get('electron.electronMode')) {
        httpsManager.setupHTTPSForDesktop(app, 3443);
    }
    
    // Inicializar sistemas de rendimiento
    initPerformanceSystems();
    
    // Los mÃ³dulos de Ley Antifraude se inicializan desde initDatabase()
    // No es necesario llamarlos aquÃ­ ya que initDatabase() se ejecuta antes
    // de que el servidor estÃ© listo
});

// Configurar manejo de errores del servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`âŒ Puerto ${PORT} ya estÃ¡ en uso`);
        process.exit(1);
    } else {
        console.error('âŒ Error en servidor:', error);
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    const nombreEmpresa = configuracionEmpresa ? configuracionEmpresa.nombre : 'Generador de Facturas';
    res.json({ 
        message: `ðŸš— API del ${nombreEmpresa}`,
        version: '2.0.0',
        empresa: configuracionEmpresa,
        features: {
            pagination: true,
            caching: true,
            performanceOptimization: true,
            leyAntifraude: true
        },
        endpoints: {
            clientes: '/api/clientes',
            productos: '/api/productos',
            facturas: '/api/facturas',
            empresas: '/api/empresas',
            coches: '/api/coches',
            siguienteNumero: '/api/facturas/siguiente-numero',
            performance: '/api/performance/stats',
            cache: '/api/performance/cache/stats'
        },
        pagination: {
            defaultLimit: config.get('pagination.defaultLimit'),
            maxLimit: config.get('pagination.maxLimit')
        },
        cache: {
            enabled: config.get('cache.enabled'),
            ttl: config.get('cache.ttl')
        }
    });
});

// FunciÃ³n para cerrar conexiones de forma segura
function gracefulShutdown() {
    console.log('ðŸ”„ Iniciando cierre graceful del servidor...');
    
    // Cerrar conexiÃ³n de base de datos
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('âŒ Error al cerrar base de datos:', err.message);
            } else {
                console.log('âœ… Base de datos cerrada correctamente');
            }
        });
    }
    
    // Limpiar cachÃ©
    if (cacheManager) {
        cacheManager.flush();
        console.log('âœ… CachÃ© limpiado');
    }
    
    // Cerrar servidor HTTP
    if (server) {
        server.close(() => {
            console.log('âœ… Servidor HTTP cerrado');
            process.exit(0);
        });
    }
}

// Manejar seÃ±ales de cierre
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Para nodemon

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('âŒ Error no capturado:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('âŒ Promise rechazada no manejada:', reason);
    gracefulShutdown();
});

// Exportar la instancia de la base de datos para uso en otros mÃ³dulos
module.exports = { db };
