const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { DatabaseCacheManager } = require('./modules/sistemaCache');
const PaginationManager = require('./modules/sistemaPaginacion');
const { LoggerFactory } = require('./modules/sistemaLogging');
const ImportadorExcel = require('./modules/importadorExcel');
const database = require('./modules/database');
const SQLAdapter = require('./modules/sqlAdapter');

// Exportar la instancia de la base de datos para uso en otros módulos
let db;
let cacheManager;
let paginationManager;
let logger;
let importadorExcel;

// Inicializar logger
logger = LoggerFactory.create(config.getAll());

// Inicializar sistemas de rendimiento
async function initPerformanceSystems() {
    try {
        // Inicializar sistema de caché
        cacheManager = new DatabaseCacheManager(config.getAll());
        logger.systemEvent('Sistema de caché inicializado');
        
        // Inicializar sistema de paginación
        paginationManager = new PaginationManager(config.getAll());
        paginationManager.setDatabase(db);
        
        logger.systemEvent('Sistema de paginación inicializado');
        
        // Inicializar importador Excel
        importadorExcel = new ImportadorExcel(db);
        logger.systemEvent('Importador Excel inicializado');
        
        // Precalentar caché con datos frecuentes de forma asíncrona
        // Solo después de que db esté disponible
        setImmediate(async () => {
            // Esperar a que db esté disponible
            let attempts = 0;
            while (!db && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            if (db) {
                await preheatCache();
            } else {
                logger.warn('No se pudo precalentar caché: base de datos no disponible', {}, 'cache');
            }
        });
        
    } catch (error) {
        logger.error('Error inicializando sistemas de rendimiento', { error: error.message });
    }
}

// Precalentar caché con datos frecuentes
async function preheatCache() {
    // Verificar que db esté disponible antes de precalentar
    if (!db) {
        logger.warn('Base de datos no disponible para precalentar caché, omitiendo...', {}, 'cache');
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
        logger.systemEvent('Caché precalentado con datos frecuentes');
    } catch (error) {
        logger.error('Error precalentando caché', { error: error.message }, 'cache');
    }
}

// Módulos para cumplir con la Ley Antifraude
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

const app = express();
const PORT = config.get('server.port');
let HOST = config.get('server.host');

// Asegurar que el servidor escuche en todas las interfaces
if (HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '::1') {
    logger.warn('🛠️ HOST configurado como localhost. Cambiando automáticamente a 0.0.0.0 para permitir acceso externo.', {}, 'general');
    HOST = '0.0.0.0';
}

// Inicializar servicios de seguridad
const authService = new AuthService();
const httpsManager = new HTTPSManager();
const roleManager = new RoleManager();
const securityMonitor = new SecurityMonitor();

function buildFacturaFilters(queryParams = {}) {
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
        
        const { whereClause, params } = buildFacturaFilters(queryParams);
        const query = `
            SELECT 
                COUNT(DISTINCT f.id) as total_facturas,
                COALESCE(SUM(f.total), 0) as ingresos_totales,
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
        logger.systemEvent('Migración coche_id en detalles_factura completada');
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
            // Actualizar marca desde modelo para registros con marca NULL, vacía o 'N/A'
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
        logger.systemEvent('Migración marca desde modelo completada');
    } catch (error) {
        logger.warn('No se pudo migrar marca desde modelo', { error: error.message });
    }
}

// Middleware de autenticación para endpoints protegidos
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
            maxAge: 31536000, // 1 año
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
        error: 'Demasiadas solicitudes desde esta IP, inténtelo de nuevo más tarde.',
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

// Rate limiting más estricto para login (protección contra fuerza bruta)
const loginLimiter = rateLimit({
    windowMs: config.get('security.rateLimit.loginWindowMs'),
    max: config.get('security.rateLimit.loginMax'),
    message: {
        error: 'Demasiados intentos de login. Inténtelo de nuevo más tarde.',
        retryAfter: Math.ceil(config.get('security.rateLimit.loginWindowMs') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // No contar intentos exitosos
});

// Aplicar rate limiting estricto a endpoints de autenticación
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// Middleware de logging optimizado con monitoreo de seguridad
app.use((req, res, next) => {
    const start = Date.now();
    
    // Log de inicio de petición
    logger.debug(`Incoming request: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? logger.sanitizeData(req.body) : null
    }, 'api');
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Log detallado de la petición
        logger.apiRequest(req.method, req.url, res.statusCode, duration, req);
        
        // Registrar en monitoreo de seguridad
        securityMonitor.logHTTPRequest(req, duration, res.statusCode);
        
        // Detectar códigos de error
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

// Middleware de validación de entrada
app.use((req, res, next) => {
    // Sanitizar parámetros de consulta
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key].replace(/[<>\"'%;()&+]/g, '');
            }
        });
    }
    
    // Validar tamaño del body
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 10MB
        return res.status(413).json({ error: 'Payload demasiado grande' });
    }
    
    next();
});

app.use(cors(config.get('server.cors')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

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
        
        // Validar extensión
        const allowedExtensions = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB límite (reducido por seguridad)
        files: 1 // Solo un archivo por vez
    }
});

// Cargar configuración dinámica de empresa
let configuracionEmpresa = null;
config.loadFromDatabase().then(() => {
    configuracionEmpresa = config.get('empresa');
    logger.systemEvent('Configuración de empresa cargada', { empresa: configuracionEmpresa.nombre });
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
                // Métodos con callback para compatibilidad (usados por el código existente)
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
                
                // Métodos async (para nuevo código)
                query: (text, params) => database.query(text, params),
                
                // Para compatibilidad con código existente
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

// Inicializar conexión
initDatabaseConnection().catch(err => {
    logger.error('Error fatal al inicializar base de datos', { error: err.message });
    process.exit(1);
});

// Función utilitaria para ejecutar operaciones de base de datos con reintentos
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

// Inicializar módulos de la Ley Antifraude
let sistemaIntegridad, sistemaAuditoria, generadorVeriFactu, sistemaBackup;
let sistemaCifrado, sistemaControlAcceso, sistemaLogsSeguridad, sistemaValidacionFiscal;
let sistemaFirmaDigital;
let modulosAntifraudeInicializados = false;

// Función para inicializar módulos después de la base de datos
function initModulosAntifraude() {
    // Evitar inicialización duplicada
    if (modulosAntifraudeInicializados) {
        logger.debug('Módulos de Ley Antifraude ya inicializados, omitiendo...', {}, 'operations');
        return;
    }
    try {
        // Verificar que db esté definido antes de continuar
        if (!db) {
            logger.warn('Base de datos no está lista aún, reintentando inicialización de módulos...', {}, 'operations');
            // Reintentar después de un breve delay
            setTimeout(() => {
                if (db) {
                    initModulosAntifraude();
                } else {
                    logger.error('No se pudo inicializar módulos: base de datos no disponible', {}, 'operations');
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
            retencionDias: 1460 // 4 años
        });
        
        // Nuevos módulos de seguridad
        sistemaCifrado = new SistemaCifrado();
        sistemaControlAcceso = new SistemaControlAcceso(db);
        sistemaLogsSeguridad = new SistemaLogsSeguridad(db);
        sistemaValidacionFiscal = new SistemaValidacionFiscal();
        sistemaFirmaDigital = new SistemaFirmaDigital(db);
        
        // Inicializar sistemas que requieren base de datos de forma asíncrona
        // para no bloquear el arranque del servidor
        setImmediate(async () => {
            try {
                await sistemaControlAcceso.inicializar();
                await sistemaLogsSeguridad.inicializar();
                
                // Iniciar backup automático de forma asíncrona (no bloquea el arranque)
                sistemaBackup.iniciarBackupAutomatico();
                
                logger.systemEvent('Módulos de Ley Antifraude inicializados correctamente');
                logger.systemEvent('Sistema de cifrado activado');
                logger.systemEvent('Sistema de control de acceso activado');
                logger.systemEvent('Sistema de logs de seguridad activado');
                logger.systemEvent('Sistema de validación fiscal activado');
                logger.systemEvent('Sistema de firma digital activado');
                logger.systemEvent('Sistema de backup automático activado');
                
                // Configurar endpoints de seguridad después de la inicialización
                configurarEndpointsSeguridad();
                
                // Marcar como inicializado
                modulosAntifraudeInicializados = true;
            } catch (initError) {
                logger.error('Error al inicializar módulos de seguridad', { 
                    error: initError.message, 
                    stack: initError.stack 
                }, 'operations');
            }
        });
        
    } catch (error) {
        logger.error('Error al crear módulos de Ley Antifraude', { error: error.message, stack: error.stack }, 'operations');
    }
}

// Inicializar tablas
async function initDatabase() {
    logger.systemEvent('Inicializando base de datos');
    
    const dbType = config.get('database.type') || 'postgresql';
    const isPostgreSQL = dbType === 'postgresql';
    
    // Función helper para ejecutar queries
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
        
        // Función helper para ejecutar CREATE TABLE
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
        
        // Añadir columna codigo_postal si no existe (solo para SQLite, PostgreSQL ya la tiene)
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

        // Tabla de usuarios para autenticación
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
        
        // Crear usuario por defecto para aplicación de escritorio
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

        // Tabla de productos/vehículos
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

        // Tabla de auditoría (para cumplir con Ley Antifraude)
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
        
        // Insertar datos de ejemplo después de crear todas las tablas
        insertSampleData(isPostgreSQL);
        
        // Crear índices optimizados después de que todas las tablas estén listas
        // Asegurarse de que paginationManager tenga db antes de crear índices
        if (paginationManager && db) {
            paginationManager.setDatabase(db);
            paginationManager.createPaginationIndexes().then(() => {
                logger.systemEvent('Índices de paginación creados');
            }).catch((error) => {
                logger.error('Error creando índices de paginación', { error: error.message }, 'database');
            });
        }
        
        // Inicializar módulos de Ley Antifraude
        initModulosAntifraude();
        
        // Inicializar sistemas de rendimiento
        initPerformanceSystems();
        
    } catch (error) {
        logger.error('Error inicializando base de datos', { error: error.message, stack: error.stack }, 'database');
        throw error;
    }
}

// Insertar datos de ejemplo de forma silenciosa
function insertSampleData(isPostgreSQL = false) {
    // Verificar que db esté disponible
    if (!db) {
        logger.warn('Base de datos no disponible para insertar datos de ejemplo', {}, 'database');
        return;
    }
    
    // Insertar empresa Telwagen
    const empresaQuery = isPostgreSQL
        ? `INSERT INTO empresas (nombre, cif, direccion, telefono, email) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cif) DO NOTHING`
        : `INSERT OR IGNORE INTO empresas (nombre, cif, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(empresaQuery, [
        'Telwagen Car Ibérica, S.L.',
        'B-93.289.585',
        'C. / Tomás Miller N° 48 Local\n35007 Las Palmas de Gran Canaria',
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
        'C/. ALFREDO MARTIN REYES N° 7\nLAS PALMAS DE G.C.',
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

// Endpoint para obtener configuración de empresa
app.get('/api/configuracion/empresa', (req, res) => {
    if (configuracionEmpresa) {
        res.json({
            success: true,
            data: configuracionEmpresa
        });
    } else {
        res.json({
            success: false,
            error: 'Configuración de empresa no disponible'
        });
    }
});

// ==================== ENDPOINTS DE IMPORTACIÓN EXCEL ====================

// POST - Importar coches desde Excel
app.post('/api/importar/coches', upload.single('archivo'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        console.log('\n📥 ========== INICIO IMPORTACIÓN DE COCHES ==========');
        console.log('📁 Archivo recibido:', {
            originalname: req.file?.originalname,
            filename: req.file?.filename,
            path: req.file?.path,
            size: req.file?.size,
            mimetype: req.file?.mimetype
        });
        
        if (!req.file) {
            console.log('❌ No se proporcionó ningún archivo');
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ningún archivo'
            });
        }

        // Mostrar coches actuales en la BD antes de importar
        try {
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? 'true' : '1';
            const cochesActuales = await new Promise((resolve, reject) => {
                db.all(`SELECT COUNT(*) as total FROM coches WHERE activo = ${activoValue}`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0]?.total || 0);
                });
            });
            console.log(`📊 Coches actuales en la base de datos: ${cochesActuales}`);
            
            // Mostrar algunos coches de ejemplo
            const cochesEjemplo = await new Promise((resolve, reject) => {
                db.all(`SELECT id, matricula, modelo, color, kms FROM coches WHERE activo = ${activoValue} ORDER BY id LIMIT 5`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
            if (cochesEjemplo.length > 0) {
                console.log('📋 Ejemplos de coches en BD:');
                cochesEjemplo.forEach(c => {
                    console.log(`   - ID: ${c.id}, Matrícula: ${c.matricula}, Modelo: ${c.modelo}, Color: ${c.color}, Kms: ${c.kms}`);
                });
            }
        } catch (dbError) {
            console.log('⚠️ Error al consultar coches actuales:', dbError.message);
        }

        console.log('🔄 Iniciando importación desde:', req.file.path);
        const resultado = await importadorExcel.importarCoches(req.file.path);
        const duration = Date.now() - startTime;
        
        console.log('✅ Importación completada:', {
            success: resultado.success,
            total: resultado.total,
            importados: resultado.importados,
            errores: resultado.errores,
            duracion: `${duration}ms`
        });
        
        if (resultado.erroresDetalle && resultado.erroresDetalle.length > 0) {
            console.log('⚠️ Errores detallados:');
            resultado.erroresDetalle.slice(0, 5).forEach((err, idx) => {
                console.log(`   ${idx + 1}. Fila ${err.fila}: ${err.mensaje || err.error}`);
            });
        }
        
        // Limpiar archivo temporal
        try {
            fs.unlinkSync(req.file.path);
            console.log('🗑️ Archivo temporal eliminado');
        } catch (unlinkError) {
            console.log('⚠️ Error al eliminar archivo temporal:', unlinkError.message);
        }
        
        console.log('📥 ========== FIN IMPORTACIÓN DE COCHES ==========\n');
        
        res.json(resultado);
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('❌ Error importando coches desde Excel:', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            filename: req.file?.originalname
        });
        logger.error('Error importando coches desde Excel', { 
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            filename: req.file?.originalname
        });
        
        // Limpiar archivo temporal en caso de error
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.log('⚠️ Error al eliminar archivo temporal después de error:', unlinkError.message);
            }
        }
        
        res.status(500).json({
            success: false,
            error: error.message || 'Error interno del servidor'
        });
    }
});

// POST - Importar productos desde Excel
app.post('/api/importar/productos', upload.single('archivo'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        if (!req.file) {
            logger.warn('Intento de importar productos sin archivo', {}, 'operations');
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ningún archivo'
            });
        }

        logger.info('Iniciando importación de productos desde Excel', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        }, 'operations');

        const resultado = await importadorExcel.importarProductos(req.file.path);
        const duration = Date.now() - startTime;
        
        logger.importOperation('productos', req.file.originalname, resultado.total || 0, resultado.success, resultado.errors || []);
        
        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);
        logger.debug('Archivo temporal eliminado', { filename: req.file.originalname }, 'operations');
        
        res.json(resultado);
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Error importando productos desde Excel', { 
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            filename: req.file?.originalname
        }, 'operations');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST - Importar clientes desde Excel
app.post('/api/importar/clientes', upload.single('archivo'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        if (!req.file) {
            logger.warn('Intento de importar clientes sin archivo', {}, 'operations');
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ningún archivo'
            });
        }

        logger.info('Iniciando importación de clientes desde Excel', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        }, 'operations');

        const resultado = await importadorExcel.importarClientes(req.file.path);
        const duration = Date.now() - startTime;
        
        logger.importOperation('clientes', req.file.originalname, resultado.total || 0, resultado.success, resultado.errors || []);
        
        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);
        logger.debug('Archivo temporal eliminado', { filename: req.file.originalname }, 'operations');
        
        res.json(resultado);
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Error importando clientes desde Excel', { 
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
            filename: req.file?.originalname
        }, 'operations');
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET - Descargar plantilla Excel
app.get('/api/importar/plantilla/:tipo', (req, res) => {
    try {
        const { tipo } = req.params;
        const tiposValidos = ['coches', 'productos', 'clientes'];
        
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de plantilla no válido'
            });
        }

        const fileName = `plantilla_${tipo}.xlsx`;
        const filePath = path.join(__dirname, 'temp', fileName);
        
        // Crear directorio temp si no existe
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        
        // Generar plantilla
        importadorExcel.generarPlantilla(tipo, filePath);
        
        // Enviar archivo
        res.download(filePath, fileName, (err) => {
            if (err) {
                logger.error('Error enviando plantilla', { error: err.message });
            }
            // Limpiar archivo temporal
            fs.unlinkSync(filePath);
        });
        
    } catch (error) {
        logger.error('Error generando plantilla', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error generando plantilla'
        });
    }
});

// ==================== ENDPOINTS DE EXPORTACIÓN EXCEL ====================

// GET - Exportar coches a Excel
app.get('/api/exportar/coches', async (req, res) => {
    try {
        const timestamp = Date.now();
        const fileName = `coches_export_${timestamp}.xlsx`;
        const filePath = path.join(__dirname, 'temp', fileName);
        
        // Crear directorio temp si no existe
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        
        // Obtener filtros de la query string
        const filtros = {
            modelo: req.query.modelo,
            color: req.query.color,
            kmsMin: req.query.kmsMin ? parseInt(req.query.kmsMin) : null,
            kmsMax: req.query.kmsMax ? parseInt(req.query.kmsMax) : null
        };
        
        // Exportar datos
        const resultado = await importadorExcel.exportarCoches(filePath, filtros);
        
        if (resultado.success) {
            // Enviar archivo
            res.download(filePath, fileName, (err) => {
                if (err) {
                    logger.error('Error enviando archivo de exportación', { error: err.message });
                }
                // Limpiar archivo temporal después de enviarlo
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }, 5000);
            });
        } else {
            res.status(500).json({
                success: false,
                error: resultado.error
            });
        }
        
    } catch (error) {
        logger.error('Error exportando coches', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET - Exportar productos a Excel
app.get('/api/exportar/productos', async (req, res) => {
    try {
        const timestamp = Date.now();
        const fileName = `productos_export_${timestamp}.xlsx`;
        const filePath = path.join(__dirname, 'temp', fileName);
        
        // Crear directorio temp si no existe
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        
        const filtros = {
            codigo: req.query.codigo,
            descripcion: req.query.descripcion,
            precioMin: req.query.precioMin ? parseFloat(req.query.precioMin) : null,
            precioMax: req.query.precioMax ? parseFloat(req.query.precioMax) : null
        };
        
        const resultado = await importadorExcel.exportarProductos(filePath, filtros);
        
        if (resultado.success) {
            res.download(filePath, fileName, (err) => {
                if (err) {
                    logger.error('Error enviando archivo de exportación', { error: err.message });
                }
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }, 5000);
            });
        } else {
            res.status(500).json({
                success: false,
                error: resultado.error
            });
        }
        
    } catch (error) {
        logger.error('Error exportando productos', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET - Exportar clientes a Excel
app.get('/api/exportar/clientes', async (req, res) => {
    try {
        const timestamp = Date.now();
        const fileName = `clientes_export_${timestamp}.xlsx`;
        const filePath = path.join(__dirname, 'temp', fileName);
        
        // Crear directorio temp si no existe
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        
        const filtros = {
            nombre: req.query.nombre,
            identificacion: req.query.identificacion,
            email: req.query.email
        };
        
        const resultado = await importadorExcel.exportarClientes(filePath, filtros);
        
        if (resultado.success) {
            res.download(filePath, fileName, (err) => {
                if (err) {
                    logger.error('Error enviando archivo de exportación', { error: err.message });
                }
                setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }, 5000);
            });
        } else {
            res.status(500).json({
                success: false,
                error: resultado.error
            });
        }
        
    } catch (error) {
        logger.error('Error exportando clientes', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Rutas API

// GET - Obtener todas las empresas (con paginación y caché)
app.get('/api/empresas', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        
        // Usar caché si está disponible
        const cacheKey = `empresas:page:${page}:limit:${limit}:search:${search}`;
        const cachedResult = cacheManager.get(cacheKey);
        
        if (cachedResult) {
            return res.json({ success: true, data: cachedResult.data, pagination: cachedResult.pagination, cached: true });
        }
        
        // Construir consulta con búsqueda
        let whereClause = '';
        let whereParams = [];
        
        if (search) {
            whereClause = 'WHERE nombre LIKE ? OR cif LIKE ?';
            whereParams = [`%${search}%`, `%${search}%`];
        }
        
        const result = await paginationManager.getPaginatedData('empresas', {
            page: parseInt(page),
            limit: parseInt(limit),
            where: whereClause,
            whereParams: whereParams,
            orderBy: 'nombre',
            orderDirection: 'ASC'
        });
        
        // Guardar en caché
        cacheManager.set(cacheKey, result, 300); // 5 minutos TTL
        
        res.json({ success: true, data: result.data, pagination: result.pagination, cached: false });
        
    } catch (error) {
        console.error('❌ Error al obtener empresas:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener empresa por ID
app.get('/api/empresas/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Empresa no encontrada' });
            return;
        }
        res.json({ success: true, data: row });
    });
});

// POST - Crear nueva empresa
app.post('/api/empresas', async (req, res) => {
    try {
        const { nombre, cif, direccion, telefono, email, firmaDigitalThumbprint } = req.body;
        
        console.log('🏢 [POST /api/empresas] Datos recibidos:', { nombre, cif, direccion, telefono, email, firmaDigitalThumbprint });
        
        // Validar campos obligatorios
        if (!nombre || !cif) {
            return res.status(400).json({ 
                success: false,
                error: 'Campos obligatorios faltantes: nombre, cif'
            });
        }
        
        // Verificar que el CIF no esté duplicado
        const empresaExistente = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM empresas WHERE cif = ?', [cif], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
        
        if (empresaExistente) {
            return res.status(409).json({ 
                success: false,
                error: 'El CIF ya existe',
                message: `Ya existe una empresa con el CIF: ${cif}`,
                code: 'DUPLICATE_CIF',
                field: 'cif'
            });
        }
        
        // Crear la empresa con el certificado si se proporciona
        const empresaId = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO empresas (nombre, cif, direccion, telefono, email, certificado_thumbprint)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [nombre, cif, direccion, telefono, email, firmaDigitalThumbprint || null], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
        
        // Si se especifica una firma digital, asociarla con la empresa
        if (firmaDigitalThumbprint) {
            try {
                const resultadoAsociacion = await sistemaFirmaDigital.asociarCertificadoConEmpresa(empresaId, firmaDigitalThumbprint);
                
                if (resultadoAsociacion.success) {
                    console.log(`✅ Firma digital asociada con nueva empresa ${nombre}: ${resultadoAsociacion.certificado.empresa}`);
                } else {
                    console.log(`⚠️ No se pudo asociar firma digital: ${resultadoAsociacion.error}`);
                }
            } catch (error) {
                console.log(`⚠️ Error al asociar firma digital: ${error.message}`);
            }
        }
        
        // Obtener la empresa creada para devolverla
        const empresaCreada = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM empresas WHERE id = ?', [empresaId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        // Invalidar caché de empresas después de crear una nueva
        cacheManager.delPattern('empresas:.*');
        console.log('🗑️ Caché de empresas invalidado después de crear nueva empresa');
        
        res.json({ 
            success: true, 
            data: empresaCreada,
            firmaDigitalAsociada: firmaDigitalThumbprint ? true : false
        });
        
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// PUT - Actualizar empresa
app.put('/api/empresas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const empresaId = parseInt(id, 10);
        const { nombre, cif, direccion, telefono, email, firmaDigitalThumbprint } = req.body;
        
        // Validar ID
        if (isNaN(empresaId) || empresaId <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de empresa inválido',
                received: id
            });
        }
        
        // Si se está actualizando el CIF, verificar que no esté duplicado
        if (cif) {
            const cifDuplicado = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM empresas WHERE cif = ? AND id != ?', [cif, empresaId], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(!!row);
                });
            });
            
            if (cifDuplicado) {
                return res.status(409).json({ 
                    success: false,
                    error: 'El CIF ya existe',
                    message: `Ya existe otra empresa con el CIF: ${cif}`,
                    code: 'DUPLICATE_CIF',
                    field: 'cif'
                });
            }
        }
        
        // Actualizar datos básicos de la empresa
        const changes = await new Promise((resolve, reject) => {
            db.run(`
                UPDATE empresas 
                SET nombre = ?, cif = ?, direccion = ?, telefono = ?, email = ?, certificado_thumbprint = ?
                WHERE id = ?
            `, [nombre, cif, direccion, telefono, email, firmaDigitalThumbprint || null, empresaId], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    resolve(null);
                } else {
                    resolve(this.changes);
                }
            });
        });
        
        // Si no se encontró la empresa, retornar error 404
        if (changes === null) {
            return res.status(404).json({ 
                success: false,
                error: 'Empresa no encontrada'
            });
        }
        
        // Si se especifica una firma digital, asociarla con la empresa
        if (firmaDigitalThumbprint) {
            try {
                const resultadoAsociacion = await sistemaFirmaDigital.asociarCertificadoConEmpresa(empresaId, firmaDigitalThumbprint);
                
                if (resultadoAsociacion.success) {
                    console.log(`✅ Firma digital asociada con empresa ${nombre}: ${resultadoAsociacion.certificado.empresa}`);
                } else {
                    console.log(`⚠️ No se pudo asociar firma digital: ${resultadoAsociacion.error}`);
                }
            } catch (error) {
                console.log(`⚠️ Error al asociar firma digital: ${error.message}`);
            }
        }
        
        // Obtener la empresa actualizada para devolverla
        const empresaActualizada = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM empresas WHERE id = ?', [empresaId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
        
        // Invalidar caché de empresas después de actualizar
        cacheManager.delPattern('empresas:.*');
        console.log('🗑️ Caché de empresas invalidado después de actualizar empresa');
        
        res.json({ 
            success: true, 
            message: 'Empresa actualizada correctamente',
            data: empresaActualizada,
            firmaDigitalAsociada: firmaDigitalThumbprint ? true : false
        });
        
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// DELETE - Eliminar empresa (eliminación física)
app.delete('/api/empresas/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM empresas WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Empresa no encontrada' });
            return;
        }
        
        // Invalidar caché de empresas después de eliminar
        cacheManager.delPattern('empresas:.*');
        console.log('🗑️ Caché de empresas invalidado después de eliminar empresa');
        
        res.json({ success: true, message: 'Empresa eliminada correctamente' });
    });
});

// POST - Limpiar y recrear datos de ejemplo
app.post('/api/reset-data', (req, res) => {
    console.log('🔄 Limpiando y recreando datos de ejemplo...');
    
    db.serialize(() => {
        // Limpiar tablas
        db.run('DELETE FROM empresas', (err) => {
            if (err) {
                console.error('❌ Error al limpiar empresas:', err.message);
            } else {
                console.log('✅ Tabla empresas limpiada');
            }
        });
        
        db.run('DELETE FROM productos', (err) => {
            if (err) {
                console.error('❌ Error al limpiar productos:', err.message);
            } else {
                console.log('✅ Tabla productos limpiada');
            }
        });
        
        db.run('DELETE FROM clientes', (err) => {
            if (err) {
                console.error('❌ Error al limpiar clientes:', err.message);
            } else {
                console.log('✅ Tabla clientes limpiada');
            }
        });
        
        db.run('DELETE FROM coches', (err) => {
            if (err) {
                console.error('❌ Error al limpiar coches:', err.message);
            } else {
                console.log('✅ Tabla coches limpiada');
            }
        });
        
        db.run('DELETE FROM facturas', (err) => {
            if (err) {
                console.error('❌ Error al limpiar facturas:', err.message);
            } else {
                console.log('✅ Tabla facturas limpiada');
            }
        });
        
        db.run('DELETE FROM detalles_factura', (err) => {
            if (err) {
                console.error('❌ Error al limpiar detalles_factura:', err.message);
            } else {
                console.log('✅ Tabla detalles_factura limpiada');
            }
        });
        
        // Recrear datos de ejemplo
        setTimeout(() => {
            insertSampleData();
            res.json({ success: true, message: 'Datos de ejemplo recreados correctamente' });
        }, 1000);
    });
});

// GET - Obtener todos los clientes
app.get('/api/clientes', (req, res) => {
    const startTime = Date.now();
    logger.operationRead('clientes', null, req.query);
    
    // Verificar que la base de datos esté conectada
    if (!db) {
        logger.error('Base de datos no inicializada', { endpoint: '/api/clientes' });
        return res.status(503).json({ 
            error: 'Servicio no disponible', 
            message: 'La base de datos no está conectada. Por favor, reinicia el servidor.' 
        });
    }
    
    db.all('SELECT * FROM clientes ORDER BY fecha_creacion DESC', (err, rows) => {
        const duration = Date.now() - startTime;
        
        if (err) {
            logger.error('Error obteniendo clientes', { 
                error: err.message, 
                duration: `${duration}ms`,
                query: req.query 
            }, 'database');
            logger.databaseQuery('SELECT * FROM clientes', duration, 0);
            res.status(500).json({ error: err.message });
            return;
        }
        
        logger.databaseQuery('SELECT * FROM clientes ORDER BY fecha_creacion DESC', duration, rows.length);
        logger.info(`Clientes obtenidos: ${rows.length} registros`, { 
            count: rows.length, 
            duration: `${duration}ms` 
        }, 'operations');
        
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nuevo cliente
app.post('/api/clientes', (req, res) => {
    (async () => {
        const startTime = Date.now();
        try {
            const { nombre, direccion, codigo_postal, identificacion, email, telefono } = req.body;
            
            logger.debug('Creando nuevo cliente', { 
                nombre, 
                identificacion,
                email: email ? '***' : null,
                telefono: telefono ? '***' : null
            }, 'operations');
            
            // Validar campos obligatorios
            if (!nombre || !direccion || !identificacion) {
                logger.warn('Intento de crear cliente sin campos obligatorios', { 
                    nombre: !!nombre, 
                    direccion: !!direccion, 
                    identificacion: !!identificacion 
                }, 'operations');
                return res.status(400).json({ 
                    error: 'Campos obligatorios faltantes: nombre, direccion, identificacion' 
                });
            }
            
            // Verificar que la identificación no esté duplicada
            const clienteExistente = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM clientes WHERE identificacion = ?', [identificacion], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });
            
            if (clienteExistente) {
                logger.warn('Intento de crear cliente con identificación duplicada', { identificacion }, 'operations');
                return res.status(409).json({ 
                    error: 'La identificación ya existe',
                    message: `Ya existe un cliente con la identificación: ${identificacion}`,
                    code: 'DUPLICATE_IDENTIFICACION',
                    field: 'identificacion'
                });
            }
            
            // Insertar cliente
            const result = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO clientes (nombre, direccion, codigo_postal, identificacion, email, telefono)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [nombre, direccion, codigo_postal, identificacion, email, telefono], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // this.lastID ahora funciona tanto para SQLite como PostgreSQL gracias al wrapper
                    resolve({ id: this.lastID });
                });
            });
            
            // Si el ID no se obtuvo (fallback para PostgreSQL si el wrapper falla)
            if (!result.id) {
                const dbType = config.get('database.type') || 'postgresql';
                if (dbType === 'postgresql') {
                    try {
                        const lastCliente = await new Promise((resolve, reject) => {
                            db.get('SELECT id FROM clientes WHERE identificacion = ? ORDER BY id DESC LIMIT 1', [identificacion], (err, row) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve(row);
                            });
                        });
                        if (lastCliente && lastCliente.id) {
                            result.id = lastCliente.id;
                        }
                    } catch (err) {
                        console.error('Error obteniendo ID del cliente insertado:', err);
                    }
                }
            }
            
            const duration = Date.now() - startTime;
            logger.databaseQuery('INSERT INTO clientes', duration, 1, [nombre, direccion, identificacion]);
            logger.operationCreate('cliente', result.id, { nombre, identificacion });
            
            res.json({ 
                success: true, 
                data: { 
                    id: result.id, 
                    nombre, 
                    direccion, 
                    codigo_postal,
                    identificacion, 
                    email, 
                    telefono 
                } 
            });
            
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Error creando cliente', { 
                error: error.message, 
                identificacion: req.body.identificacion,
                duration: `${duration}ms`
            }, 'database');
            
            if (!res.headersSent) {
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        }
    })();
});

// GET - Obtener cliente por ID
app.get('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ success: true, data: row });
    });
});

// PUT - Actualizar cliente
app.put('/api/clientes/:id', (req, res) => {
    (async () => {
        try {
            const { id } = req.params;
            const clienteId = parseInt(id, 10);
            const { nombre, direccion, codigo_postal, identificacion, email, telefono } = req.body;
            
            // Validar ID
            if (isNaN(clienteId) || clienteId <= 0) {
                return res.status(400).json({ 
                    error: 'ID de cliente inválido',
                    received: id
                });
            }
            
            // Si se está actualizando la identificación, verificar que no esté duplicada
            if (identificacion) {
                const identificacionDuplicada = await new Promise((resolve, reject) => {
                    db.get('SELECT id FROM clientes WHERE identificacion = ? AND id != ?', [identificacion, clienteId], (err, row) => {
                        if (err) {
                            console.error('❌ [PUT /api/clientes/:id] Error verificando identificación:', err.message);
                            reject(err);
                            return;
                        }
                        resolve(!!row);
                    });
                });
                
                if (identificacionDuplicada) {
                    console.log('❌ [PUT /api/clientes/:id] Identificación duplicada:', identificacion);
                    return res.status(409).json({ 
                        error: 'La identificación ya existe',
                        message: `Ya existe otro cliente con la identificación: ${identificacion}`,
                        code: 'DUPLICATE_IDENTIFICACION',
                        field: 'identificacion'
                    });
                }
            }
            
            // Construir UPDATE dinámicamente solo con los campos que se están enviando
            const updates = [];
            const values = [];
            
            if (nombre !== undefined) {
                updates.push('nombre = ?');
                values.push(nombre);
            }
            if (direccion !== undefined) {
                updates.push('direccion = ?');
                values.push(direccion);
            }
            if (codigo_postal !== undefined) {
                updates.push('codigo_postal = ?');
                values.push(codigo_postal);
            }
            if (identificacion !== undefined) {
                updates.push('identificacion = ?');
                values.push(identificacion);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                values.push(email);
            }
            if (telefono !== undefined) {
                updates.push('telefono = ?');
                values.push(telefono);
            }
            
            // Si no hay campos para actualizar, retornar error
            if (updates.length === 0) {
                return res.status(400).json({ 
                    error: 'No se proporcionaron campos para actualizar' 
                });
            }
            
            // Agregar el ID al final para el WHERE
            values.push(clienteId);
            
            // Ejecutar UPDATE
            const changes = await new Promise((resolve, reject) => {
                const query = `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`;
                console.log('🔍 [PUT /api/clientes/:id] Query:', query);
                console.log('🔍 [PUT /api/clientes/:id] Values:', values);
                
                db.run(query, values, function(err) {
                    if (err) {
                        console.error('❌ [PUT /api/clientes/:id] Error en UPDATE:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('🔍 [PUT /api/clientes/:id] Changes:', this.changes);
                    if (this.changes === 0) {
                        resolve(null);
                        return;
                    }
                    resolve(this.changes);
                });
            });
            
            // Si no se encontró el cliente, retornar error 404
            if (changes === null) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            // Obtener el cliente actualizado para devolverlo
            const clienteActualizado = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM clientes WHERE id = ?', [clienteId], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });
            
            res.json({ 
                success: true, 
                message: 'Cliente actualizado correctamente',
                data: clienteActualizado
            });
            
        } catch (error) {
            console.error('❌ [PUT /api/clientes/:id] Error inesperado:', error);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Error interno del servidor',
                    details: error.message
                });
            }
        }
    })();
});

// DELETE - Desactivar cliente (soft delete)
app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    // Como la tabla clientes no tiene campo activo, eliminamos físicamente
    db.run('DELETE FROM clientes WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ success: true, message: 'Cliente eliminado correctamente' });
    });
});

// GET - Obtener todos los coches (mantener para compatibilidad)
app.get('/api/coches', async (req, res) => {
    try {
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';
        const vendidoValue = dbType === 'postgresql' ? 'false' : '0';
        
        // Verificar consistencia del caché antes de devolver datos
        if (global.cacheManager) {
            const cachedData = await global.cacheManager.verifyAndCorrect('coches:all', async () => {
                return new Promise((resolve, reject) => {
        db.all(`
            SELECT c.*,
                   CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                   f.numero_factura,
                   f.fecha_emision as fecha_venta,
                   f.total as precio_venta,
                   cl.nombre as cliente_nombre,
                   p.numero_proforma,
                   CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as tiene_proforma
            FROM coches c
            LEFT JOIN detalles_factura df ON df.coche_id = c.id
            LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
            LEFT JOIN clientes cl ON f.cliente_id = cl.id
            LEFT JOIN proformas p ON p.coche_id = c.id AND (p.activo = ${activoValue} OR p.activo IS NULL)
            WHERE (c.activo = ${activoValue} OR c.activo = ${vendidoValue} OR c.activo IS NULL)
            ORDER BY c.fecha_creacion DESC
        `, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
            });
            
            if (cachedData !== null) {
                res.json({ success: true, data: cachedData });
                return;
            }
        }
        
        // Si no hay caché o hay error, consultar directamente la BD
        db.all(`
            SELECT c.*,
                   CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                   f.numero_factura,
                   f.fecha_emision as fecha_venta,
                   f.total as precio_venta,
                   cl.nombre as cliente_nombre,
                   p.numero_proforma,
                   CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as tiene_proforma
            FROM coches c
            LEFT JOIN detalles_factura df ON df.coche_id = c.id
            LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
            LEFT JOIN clientes cl ON f.cliente_id = cl.id
            LEFT JOIN proformas p ON p.coche_id = c.id AND (p.activo = ${activoValue} OR p.activo IS NULL)
            WHERE (c.activo = ${activoValue} OR c.activo = ${vendidoValue} OR c.activo IS NULL)
            ORDER BY c.fecha_creacion DESC
        `, (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Actualizar caché con datos frescos
            if (global.cacheManager) {
                global.cacheManager.set('coches:all', rows);
            }
            
            res.json({ success: true, data: rows });
        });
    } catch (error) {
        console.error('Error en GET /api/coches:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener solo coches disponibles (no vendidos)
app.get('/api/coches/disponibles', (req, res) => {
    const dbType = config.get('database.type') || 'postgresql';
    const activoValue = dbType === 'postgresql' ? 'true' : '1';
    
    db.all(`
        SELECT c.*,
               0 as vendido,
               NULL as numero_factura,
               NULL as fecha_venta,
               NULL as precio_venta,
               NULL as cliente_nombre,
               (SELECT p2.numero_proforma FROM proformas p2 
                WHERE (p2.coche_id = c.id OR p2.id IN (SELECT dp2.proforma_id FROM detalles_proforma dp2 WHERE dp2.coche_id = c.id))
                AND (p2.activo = ${activoValue} OR p2.activo IS NULL) LIMIT 1) as numero_proforma,
               CASE WHEN EXISTS (
                   SELECT 1 FROM proformas p3 
                   WHERE (p3.coche_id = c.id OR p3.id IN (SELECT dp3.proforma_id FROM detalles_proforma dp3 WHERE dp3.coche_id = c.id))
                   AND (p3.activo = ${activoValue} OR p3.activo IS NULL)
               ) THEN 1 ELSE 0 END as tiene_proforma
        FROM coches c
        WHERE c.activo = ${activoValue}
        ORDER BY c.fecha_creacion DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener solo coches vendidos
app.get('/api/coches/vendidos', (req, res) => {
    const dbType = config.get('database.type') || 'postgresql';
    const vendidoValue = dbType === 'postgresql' ? 'false' : '0';
    
    db.all(`
        SELECT c.*,
               1 as vendido,
               f.numero_factura,
               f.fecha_emision as fecha_venta,
               f.total as precio_venta,
               cl.nombre as cliente_nombre
        FROM coches c
        LEFT JOIN detalles_factura df ON df.coche_id = c.id
        LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
        LEFT JOIN clientes cl ON f.cliente_id = cl.id
        WHERE c.activo = ${vendidoValue} OR c.activo IS NULL
        ORDER BY c.fecha_creacion DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener coches disponibles para productos (con información de productos asociados)
app.get('/api/coches/productos', (req, res) => {
    const dbType = config.get('database.type') || 'postgresql';
    const activoValue = dbType === 'postgresql' ? 'true' : '1';
    
    db.all(`
        SELECT c.*, 
               CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as tiene_producto,
               p.precio as precio_producto,
               p.codigo as codigo_producto
        FROM coches c
        LEFT JOIN productos p ON c.matricula = p.codigo
        WHERE c.activo = ${activoValue} 
        ORDER BY c.fecha_creacion DESC
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener coche por ID
app.get('/api/coches/:id', (req, res) => {
    const { id } = req.params;
    const dbType = config.get('database.type') || 'postgresql';
    const activoValue = dbType === 'postgresql' ? 'true' : '1';
    
    db.get(`SELECT * FROM coches WHERE id = ? AND activo = ${activoValue}`, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        res.json({ success: true, data: row });
    });
});

// POST - Crear nuevo coche
app.post('/api/coches', (req, res) => {
    (async () => {
        try {
            console.log('🔍 [POST /api/coches] Datos recibidos:', req.body);
            
            const { matricula, chasis, color, kms, modelo, marca } = req.body;
            
            // Si no se proporciona marca, extraerla del modelo
            let marcaFinal = marca;
            let modeloFinal = modelo;
            if (!marcaFinal && modeloFinal) {
                const partes = modeloFinal.split(' ');
                marcaFinal = partes.length > 0 ? partes[0] : '';
                if (partes.length > 1) {
                    modeloFinal = partes.slice(1).join(' ');
                }
            }
            
            // Validar datos requeridos
            if (!matricula || !chasis || !color || kms === undefined || kms === null || !modeloFinal) {
                console.log('❌ [POST /api/coches] Datos faltantes:', { matricula, chasis, color, kms, modelo: modeloFinal, marca: marcaFinal });
                return res.status(400).json({ 
                    error: 'Faltan datos requeridos',
                    required: ['matricula', 'chasis', 'color', 'kms', 'modelo'],
                    received: { matricula, chasis, color, kms, modelo: modeloFinal, marca: marcaFinal }
                });
            }
            
            // Verificar que la matrícula no esté duplicada
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? 'true' : '1';
            const matriculaDuplicada = await new Promise((resolve, reject) => {
                db.get(`SELECT id FROM coches WHERE matricula = ? AND activo = ${activoValue}`, [matricula], (err, row) => {
                    if (err) {
                        console.error('❌ [POST /api/coches] Error verificando matrícula:', err.message);
                        reject(err);
                        return;
                    }
                    resolve(!!row);
                });
            });
            
            if (matriculaDuplicada) {
                console.log('❌ [POST /api/coches] Matrícula duplicada:', matricula);
                return res.status(409).json({ 
                    error: 'La matrícula ya existe',
                    message: `Ya existe un coche activo con la matrícula: ${matricula}`,
                    code: 'DUPLICATE_MATRICULA',
                    field: 'matricula'
                });
            }
            
            console.log('🔍 [POST /api/coches] Ejecutando INSERT con datos:', [matricula, chasis, color, kms, modeloFinal, marcaFinal]);
            
            // Insertar coche
            const result = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO coches (matricula, chasis, color, kms, modelo, marca)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [matricula, chasis, color, kms, modeloFinal, marcaFinal || null], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ id: this.lastID });
                });
            });
            
            console.log('✅ [POST /api/coches] Coche creado exitosamente con ID:', result.id);
            
            // Invalidar caché de coches
            if (global.cacheManager) {
                global.cacheManager.invalidatePattern('coches:*');
                console.log('🗑️ [POST /api/coches] Caché de coches invalidado');
            }
            
            res.json({ 
                success: true, 
                data: { 
                    id: result.id, 
                    matricula, 
                    chasis, 
                    color, 
                    kms, 
                    modelo: modeloFinal,
                    marca: marcaFinal
                } 
            });
            
        } catch (error) {
            console.error('❌ [POST /api/coches] Error inesperado:', error);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Error interno del servidor',
                    details: error.message
                });
            }
        }
    })();
});

// PUT - Actualizar coche
app.put('/api/coches/:id', (req, res) => {
    // Convertir a async para manejar mejor la asincronía
    (async () => {
        try {
            const { id } = req.params;
            const cocheId = parseInt(id, 10); // Convertir ID a número
            const { matricula, chasis, color, kms, modelo, marca } = req.body;
            
            console.log('🔍 [PUT /api/coches/:id] Actualizando coche ID:', cocheId);
            console.log('🔍 [PUT /api/coches/:id] Datos recibidos:', req.body);
            
            // Validar ID
            if (isNaN(cocheId) || cocheId <= 0) {
                return res.status(400).json({ 
                    error: 'ID de coche inválido',
                    received: id
                });
            }
            
            // Si se proporciona modelo pero no marca, extraer marca del modelo
            let marcaFinal = marca;
            let modeloFinal = modelo;
            if (modeloFinal && !marcaFinal) {
                const partes = modeloFinal.split(' ');
                marcaFinal = partes.length > 0 ? partes[0] : '';
                if (partes.length > 1) {
                    modeloFinal = partes.slice(1).join(' ');
                }
            }
            
            // Validar que al menos un campo esté presente
            if (!matricula && !chasis && !color && kms === undefined && !modeloFinal && !marcaFinal) {
                return res.status(400).json({ 
                    error: 'Al menos un campo debe ser proporcionado para actualizar',
                    received: { matricula, chasis, color, kms, modelo: modeloFinal, marca: marcaFinal }
                });
            }
            
            // Verificar si el coche está vendido (tiene facturas asociadas)
            // Un coche vendido NO puede ser modificado según la Ley Antifraude
            const cocheVendido = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT c.id, c.matricula,
                           CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                           f.numero_factura,
                           f.id as factura_id
                    FROM coches c
                    LEFT JOIN detalles_factura df ON df.coche_id = c.id
                    LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                    WHERE c.id = ? AND f.id IS NOT NULL
                    LIMIT 1
                `, [cocheId], (err, row) => {
                    if (err) {
                        console.error('❌ [PUT /api/coches/:id] Error verificando si coche está vendido:', err.message);
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });
            
            if (cocheVendido && cocheVendido.vendido === 1) {
                console.log('❌ [PUT /api/coches/:id] Intento de modificar coche vendido:', {
                    cocheId,
                    matricula: cocheVendido.matricula,
                    facturaId: cocheVendido.factura_id,
                    numeroFactura: cocheVendido.numero_factura
                });
                return res.status(403).json({ 
                    error: 'No se puede modificar un vehículo vendido',
                    message: 'Los vehículos vendidos no pueden ser modificados para cumplir con la Ley Antifraude. Los datos deben mantenerse intactos para garantizar la integridad de los documentos fiscales.',
                    code: 'COCHE_VENDIDO',
                    factura: cocheVendido.numero_factura || null
                });
            }
            
            // Si se está actualizando la matrícula, verificar que no esté duplicada
            if (matricula) {
                const dbType = config.get('database.type') || 'postgresql';
                const activoValue = dbType === 'postgresql' ? 'true' : '1';
                const matriculaDuplicada = await new Promise((resolve, reject) => {
                    db.get(`SELECT id FROM coches WHERE matricula = ? AND id != ? AND activo = ${activoValue}`, [matricula, cocheId], (err, row) => {
                        if (err) {
                            console.error('❌ [PUT /api/coches/:id] Error verificando matrícula:', err.message);
                            reject(err);
                            return;
                        }
                        
                        resolve(!!row); // Retornar true si existe, false si no
                    });
                });
                
                if (matriculaDuplicada) {
                    console.log('❌ [PUT /api/coches/:id] Matrícula duplicada:', matricula);
                    return res.status(409).json({ 
                        error: 'La matrícula ya existe',
                        message: `Ya existe otro coche con la matrícula: ${matricula}`,
                        code: 'DUPLICATE_MATRICULA',
                        field: 'matricula'
                    });
                }
            }
            
            // Construir la consulta dinámicamente basada en los campos proporcionados
            const updates = [];
            const values = [];
            
            if (matricula !== undefined) {
                updates.push('matricula = ?');
                values.push(matricula);
            }
            if (chasis !== undefined) {
                updates.push('chasis = ?');
                values.push(chasis);
            }
            if (color !== undefined) {
                updates.push('color = ?');
                values.push(color);
            }
            if (kms !== undefined) {
                updates.push('kms = ?');
                values.push(kms);
            }
            if (modeloFinal !== undefined) {
                updates.push('modelo = ?');
                values.push(modeloFinal);
            }
            if (marcaFinal !== undefined) {
                updates.push('marca = ?');
                values.push(marcaFinal || null);
            }
            
            // Validar que haya campos para actualizar
            if (updates.length === 0) {
                return res.status(400).json({ 
                    error: 'No hay campos válidos para actualizar'
                });
            }
            
            values.push(cocheId); // ID al final para el WHERE
            
            // Usar el valor correcto de activo según el tipo de BD
            const dbType = config.get('database.type') || 'postgresql';
            const activoValue = dbType === 'postgresql' ? 'true' : '1';
            const query = `UPDATE coches SET ${updates.join(', ')} WHERE id = ? AND activo = ${activoValue}`;
            
            console.log('🔍 [PUT /api/coches/:id] Query:', query);
            console.log('🔍 [PUT /api/coches/:id] Values:', values);
            
            // Ejecutar UPDATE
            const changes = await new Promise((resolve, reject) => {
                db.run(query, values, function(err) {
                    if (err) {
                        console.error('❌ [PUT /api/coches/:id] Error en UPDATE:', err.message);
                        console.error('❌ [PUT /api/coches/:id] Error completo:', err);
                        reject(err);
                        return;
                    }
                    
                    if (this.changes === 0) {
                        console.log('❌ [PUT /api/coches/:id] Coche no encontrado o inactivo:', cocheId);
                        resolve(null); // Retornar null para indicar que no se encontró
                        return;
                    }
                    
                    console.log('✅ [PUT /api/coches/:id] Coche actualizado exitosamente:', cocheId);
                    resolve(this.changes);
                });
            });
            
            // Si no se encontró el coche, retornar error 404
            if (changes === null) {
                return res.status(404).json({ error: 'Coche no encontrado o inactivo' });
            }
            
            // Invalidar caché de coches
            if (global.cacheManager) {
                global.cacheManager.invalidatePattern('coches:*');
                console.log('🗑️ [PUT /api/coches/:id] Caché de coches invalidado');
            }
            
            // Obtener el coche actualizado para devolverlo
            await new Promise((resolve, reject) => {
                db.get('SELECT * FROM coches WHERE id = ?', [cocheId], (err, row) => {
                    if (err) {
                        console.error('❌ [PUT /api/coches/:id] Error obteniendo coche actualizado:', err.message);
                        // Aún así devolver éxito si la actualización fue exitosa
                        res.json({ success: true, message: 'Coche actualizado correctamente' });
                        resolve();
                        return;
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Coche actualizado correctamente',
                        data: row
                    });
                    resolve();
                });
            });
            
        } catch (error) {
            console.error('❌ [PUT /api/coches/:id] Error inesperado:', error);
            // Solo enviar respuesta si aún no se ha enviado
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Error interno del servidor',
                    details: error.message
                });
            }
        }
    })();
});

// DELETE - Desactivar coche (soft delete)
app.delete('/api/coches/:id', (req, res) => {
    (async () => {
        const { id } = req.params;
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'false' : '0';

        try {
            // Verificar si el coche existe y si está vendido
            const cocheInfo = await new Promise((resolve, reject) => {
                db.get(`
                    SELECT c.id, c.matricula,
                           CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                           f.numero_factura,
                           f.id as factura_id
                    FROM coches c
                    LEFT JOIN detalles_factura df ON df.coche_id = c.id
                    LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                    WHERE c.id = ?
                    LIMIT 1
                `, [id], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });

            if (!cocheInfo) {
                return res.status(404).json({ error: 'Coche no encontrado' });
            }

            if (cocheInfo.vendido === 1) {
                console.log('❌ [DELETE /api/coches/:id] Intento de eliminar coche vendido:', {
                    id,
                    matricula: cocheInfo.matricula,
                    facturaId: cocheInfo.factura_id,
                    numeroFactura: cocheInfo.numero_factura
                });
                return res.status(403).json({
                    error: 'No se puede eliminar un vehículo vendido',
                    message: 'Los vehículos vendidos deben mantenerse para garantizar la trazabilidad de las facturas según la Ley Antifraude.',
                    code: 'COCHE_VENDIDO',
                    factura: cocheInfo.numero_factura || null
                });
            }

            const updateResult = await new Promise((resolve, reject) => {
                db.run(`UPDATE coches SET activo = ${activoValue} WHERE id = ?`, [id], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (this.changes === 0) {
                        resolve({ notFound: true });
                        return;
                    }
                    resolve({ success: true });
                });
            });

            if (updateResult?.notFound) {
                return res.status(404).json({ error: 'Coche no encontrado' });
            }

            if (global.cacheManager) {
                global.cacheManager.invalidatePattern('coches:*');
                console.log('🗑️ [DELETE /api/coches/:id] Caché de coches invalidado');
            }

            console.log('✅ [DELETE /api/coches/:id] Coche desactivado correctamente:', id);
            res.json({ success: true, message: 'Coche desactivado correctamente' });

        } catch (error) {
            console.error('❌ [DELETE /api/coches/:id] Error:', error.message || error);
            res.status(500).json({ error: error.message || 'Error interno del servidor' });
        }
    })();
});

// GET - Obtener todos los productos
app.get('/api/productos', (req, res) => {
    db.all('SELECT * FROM productos WHERE activo = 1 ORDER BY descripcion', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nuevo producto
app.post('/api/productos', (req, res) => {
    (async () => {
        try {
            const { codigo, descripcion, precio, stock, categoria } = req.body;
            
            // Validar campos obligatorios
            if (!codigo || !descripcion || precio === undefined) {
                return res.status(400).json({ 
                    error: 'Campos obligatorios faltantes: codigo, descripcion, precio'
                });
            }
            
            // Verificar que el código no esté duplicado
            const productoExistente = await new Promise((resolve, reject) => {
                const dbType = config.get('database.type') || 'postgresql';
                const activoValue = dbType === 'postgresql' ? 'true' : '1';
                db.get(`SELECT id FROM productos WHERE codigo = ? AND activo = ${activoValue}`, [codigo], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });
            
            if (productoExistente) {
                return res.status(409).json({ 
                    error: 'El código ya existe',
                    message: `Ya existe un producto activo con el código: ${codigo}`,
                    code: 'DUPLICATE_CODIGO',
                    field: 'codigo'
                });
            }
            
            // Insertar producto
            const result = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
                    VALUES (?, ?, ?, ?, ?)
                `, [codigo, descripcion, precio, stock, categoria], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ id: this.lastID });
                });
            });
            
            res.json({ 
                success: true, 
                data: { 
                    id: result.id, 
                    codigo, 
                    descripcion, 
                    precio, 
                    stock, 
                    categoria 
                } 
            });
            
        } catch (error) {
            console.error('❌ [POST /api/productos] Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        }
    })();
});

// POST - Crear producto desde coche
app.post('/api/productos/desde-coche', (req, res) => {
    (async () => {
        try {
            const { coche_id, precio, cantidad = 1 } = req.body;
            
            // Validar campos obligatorios
            if (!coche_id || precio === undefined) {
                return res.status(400).json({ 
                    error: 'Campos obligatorios faltantes: coche_id, precio'
                });
            }
            
            // Obtener los datos del coche
            const coche = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM coches WHERE id = ? AND activo = 1', [coche_id], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });
            
            if (!coche) {
                return res.status(404).json({ error: 'Coche no encontrado o inactivo' });
            }
            
            // Generar código único basado en la matrícula
            const codigo = coche.matricula; // Usar directamente la matrícula como código
            
            // Verificar que el código no esté duplicado
            const productoExistente = await new Promise((resolve, reject) => {
                const dbType = config.get('database.type') || 'postgresql';
                const activoValue = dbType === 'postgresql' ? 'true' : '1';
                db.get(`SELECT id FROM productos WHERE codigo = ? AND activo = ${activoValue}`, [codigo], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });
            
            if (productoExistente) {
                return res.status(409).json({ 
                    error: 'Ya existe un producto para este coche',
                    message: `Ya existe un producto activo con el código: ${codigo}`,
                    code: 'DUPLICATE_PRODUCTO_COCHE',
                    field: 'codigo'
                });
            }
            
            // Generar descripción automática
            const descripcion = `${coche.modelo} - ${coche.matricula} - ${coche.color} - ${coche.kms.toLocaleString()} km`;
            
            // Crear el producto
            const result = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
                    VALUES (?, ?, ?, ?, ?)
                `, [codigo, descripcion, precio, cantidad, 'vehiculo'], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ id: this.lastID });
                });
            });
            
            res.json({ 
                success: true, 
                data: { 
                    id: result.id, 
                    codigo, 
                    descripcion, 
                    precio, 
                    stock: cantidad, 
                    categoria: 'vehiculo',
                    coche: coche
                } 
            });
            
        } catch (error) {
            console.error('❌ [POST /api/productos/desde-coche] Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message || 'Error interno del servidor' });
            }
        }
    })();
});

// GET - Obtener todas las facturas (con paginación y caché)
app.get('/api/facturas', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', empresa_id = '', cliente_id = '', fecha_desde = '', fecha_hasta = '', include_detalles = 'false', include_resumen = 'false' } = req.query;
        const includeDetalles = include_detalles === 'true';
        const includeResumen = include_resumen === 'true';
        
        // Usar caché si está disponible
        const cacheKey = `facturas:page:${page}:limit:${limit}:search:${search}:empresa:${empresa_id}:cliente:${cliente_id}:fecha_desde:${fecha_desde}:fecha_hasta:${fecha_hasta}:det:${includeDetalles}:res:${includeResumen}`;
        const cachedResult = cacheManager.get(cacheKey);
        
        if (cachedResult) {
            return res.json({ success: true, ...cachedResult, cached: true });
        }
        
        // Construir consulta con filtros y límites de memoria
        const joins = [
            { type: 'LEFT', table: 'clientes c', condition: 'f.cliente_id = c.id' },
            { type: 'LEFT', table: 'empresas e', condition: 'f.empresa_id = e.id' }
        ];
        
        let whereConditions = [];
        let whereParams = [];
        
        // Límite máximo de resultados para evitar memory leaks
        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        
        // Filtrar solo facturas activas (activo = 1 o true según el tipo de BD)
        // También incluir facturas con activo IS NULL (facturas antiguas sin este campo)
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';
        // Incluir facturas activas O facturas sin campo activo (NULL) para compatibilidad con facturas antiguas
        whereConditions.push(`(f.activo = ${activoValue} OR f.activo IS NULL)`);
        
        if (search) {
            whereConditions.push('(f.numero_factura LIKE ? OR c.nombre LIKE ? OR e.nombre LIKE ?)');
            whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (empresa_id) {
            whereConditions.push('f.empresa_id = ?');
            whereParams.push(empresa_id);
        }
        
        if (cliente_id) {
            whereConditions.push('f.cliente_id = ?');
            whereParams.push(cliente_id);
        }
        
        if (fecha_desde) {
            whereConditions.push('f.fecha_emision >= ?');
            whereParams.push(fecha_desde);
        }
        
        if (fecha_hasta) {
            whereConditions.push('f.fecha_emision <= ?');
            whereParams.push(fecha_hasta);
        }
        
        const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : null;
        
        const result = await paginationManager.getPaginatedDataWithJoins('facturas f', joins, {
            page: parseInt(page),
            limit: maxLimit,
            where: whereClause,
            whereParams: whereParams,
            orderBy: 'f.fecha_creacion',
            orderDirection: 'DESC',
            select: `f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion, e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                     (SELECT COUNT(*) FROM detalles_factura df WHERE df.factura_id = f.id AND df.coche_id IS NOT NULL) as coches_count`
        });
        
        let facturas = result.data || [];
        
        if (includeDetalles && facturas.length > 0) {
            const facturaIds = facturas.map(f => f.id).filter(Boolean);
            if (facturaIds.length > 0) {
                const placeholders = facturaIds.map(() => '?').join(', ');
                const detallesQuery = `
                    SELECT df.*, COALESCE(df.descripcion, p.descripcion) as descripcion,
                           COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto,
                           df.factura_id,
                           c.matricula as coche_matricula,
                           c.chasis as coche_chasis,
                           c.color as coche_color,
                           c.kms as coche_kms,
                           c.modelo as coche_modelo
                    FROM detalles_factura df
                    LEFT JOIN productos p ON df.producto_id = p.id
                    LEFT JOIN coches c ON (COALESCE(df.descripcion, p.descripcion) LIKE '%' || c.matricula || '%')
                    WHERE df.factura_id IN (${placeholders})
                    ORDER BY df.factura_id, df.id
                `;
                
                const detalles = await new Promise((resolve, reject) => {
                    db.all(detallesQuery, facturaIds, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
                
                const detalleMap = {};
                (detalles || []).forEach(detalle => {
                    if (!detalleMap[detalle.factura_id]) {
                        detalleMap[detalle.factura_id] = [];
                    }
                    detalleMap[detalle.factura_id].push(detalle);
                });
                
                facturas = facturas.map(factura => ({
                    ...factura,
                    detalles: detalleMap[factura.id] || []
                }));
            }
        }
        
        let resumen = undefined;
        if (includeResumen) {
            try {
                resumen = await fetchFacturaResumen(req.query);
            } catch (resumenError) {
                logger.warn('No se pudo calcular el resumen de facturas', { error: resumenError.message });
            }
        }
        
        const responsePayload = {
            data: facturas,
            pagination: result.pagination,
            resumen
        };
        
        cacheManager.set(cacheKey, responsePayload, 180); // 3 minutos TTL
        
        res.json({ success: true, ...responsePayload, cached: false });
        
    } catch (error) {
        console.error('❌ Error al obtener facturas:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Resumen de facturas (estadísticas)
app.get('/api/facturas/resumen', async (req, res) => {
    try {
        const resumen = await fetchFacturaResumen(req.query);
        res.json({ success: true, data: resumen });
    } catch (error) {
        console.error('❌ Error obteniendo resumen de facturas:', error.message);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
});

// GET - Años disponibles en facturas
app.get('/api/facturas/anios', (req, res) => {
    const dbType = config.get('database.type') || 'postgresql';
    const query = dbType === 'postgresql'
        ? 'SELECT DISTINCT EXTRACT(YEAR FROM fecha_emision)::INT AS year FROM facturas ORDER BY year DESC'
        : 'SELECT DISTINCT CAST(strftime(\'%Y\', fecha_emision) AS INTEGER) as year FROM facturas ORDER BY year DESC';
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('❌ Error obteniendo años de facturas:', err.message);
            res.status(500).json({ error: 'Error al obtener años' });
            return;
        }
        
        const years = rows.map(r => (r.year || r.YEAR || r.anio).toString());
        if (years.length === 0) {
            years.push(new Date().getFullYear().toString());
        }
        
        res.json({ success: true, data: years });
    });
});

app.get('/api/metrics/resumen', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';
        
        const [
            clientesRow,
            cochesRow,
            empresasRow,
            facturasRow,
            ingresosRow
        ] = await Promise.all([
            runGet('SELECT COUNT(*) as count FROM clientes'),
            runGet('SELECT COUNT(*) as count FROM coches'),
            runGet('SELECT COUNT(*) as count FROM empresas'),
            runGet(`SELECT COUNT(*) as count FROM facturas WHERE (activo = ${activoValue} OR activo IS NULL)`),
            runGet(
                `SELECT COALESCE(SUM(total), 0) as total
                 FROM facturas
                 WHERE estado = 'pagada'
                   AND (activo = ${activoValue} OR activo IS NULL)
                   AND fecha_emision >= ? AND fecha_emision <= ?`,
                [startOfMonth, endOfMonth]
            )
        ]);
        
        res.json({
            success: true,
            data: {
                totalClientes: Number(clientesRow.count || 0),
                totalCoches: Number(cochesRow.count || 0),
                totalFacturas: Number(facturasRow.count || 0),
                totalEmpresas: Number(empresasRow.count || 0),
                ingresosMes: Number(ingresosRow.total || 0)
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo métricas:', error.message);
        res.status(500).json({ error: 'Error al obtener métricas' });
    }
});

// POST - Crear nueva factura (Cumpliendo Ley Antifraude)
app.post('/api/facturas', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { 
            numero_factura, 
            empresa_id,
            cliente_id, 
            fecha_emision, 
            fecha_vencimiento, 
            subtotal, 
            igic, 
            total, 
            notas,
            productos,
            // Campos adicionales de Ley Antifraude
            fecha_operacion,
            tipo_documento = 'factura',
            metodo_pago = 'transferencia',
            referencia_operacion
        } = req.body;
        
        logger.info('Iniciando creación de factura', {
            numero_factura,
            empresa_id,
            cliente_id,
            total,
            productos_count: productos?.length || 0
        }, 'operations');
        
        // ==================== VALIDACIONES ESTRICTAS ====================
        
        // 1. Validar empresa_id ANTES de cualquier procesamiento
        if (!empresa_id || empresa_id === null || empresa_id === undefined) {
            logger.warn('Intento de crear factura sin empresa_id', {
                body: logger.sanitizeData(req.body)
            }, 'operations');
            return res.status(400).json({ 
                success: false, 
                error: 'empresa_id es obligatorio para crear una factura' 
            });
        }
        
        // 2. Verificar que la empresa existe
        const empresaStartTime = Date.now();
        const empresaExiste = await new Promise((resolve, reject) => {
            db.get("SELECT id, nombre FROM empresas WHERE id = ?", [empresa_id], (err, row) => {
                const duration = Date.now() - empresaStartTime;
                logger.databaseQuery('SELECT empresas WHERE id', duration, row ? 1 : 0, [empresa_id]);
                if (err) {
                    logger.error('Error verificando empresa', { error: err.message, empresa_id }, 'database');
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
                
        if (!empresaExiste) {
            logger.warn('Intento de crear factura con empresa inexistente', { empresa_id }, 'operations');
            return res.status(400).json({ 
                success: false, 
                error: `La empresa con ID ${empresa_id} no existe en la base de datos` 
            });
        }
        
        logger.debug('Empresa validada', { empresa_id, nombre: empresaExiste.nombre }, 'operations');
        
        // 3. Validar número de factura único para la empresa
        if (numero_factura) {
            const numeroExiste = await new Promise((resolve, reject) => {
                db.get("SELECT id, numero_factura FROM facturas WHERE numero_factura = ? AND empresa_id = ?", 
                    [numero_factura, empresa_id], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    });
                    
            if (numeroExiste) {
                return res.status(400).json({ 
                    success: false, 
                    error: `El número de factura "${numero_factura}" ya existe para la empresa "${empresaExiste.nombre}"` 
                });
            }
        }
        
        // 4. Validar cliente_id si se proporciona
        if (cliente_id) {
            const clienteExiste = await new Promise((resolve, reject) => {
                db.get("SELECT id, nombre FROM clientes WHERE id = ?", [cliente_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
            if (!clienteExiste) {
            return res.status(400).json({ 
                success: false, 
                    error: `El cliente con ID ${cliente_id} no existe en la base de datos` 
                });
            }
        }
        
        logger.info('Validaciones pasadas - Creando factura', {
            empresa: empresaExiste.nombre,
            empresa_id,
            numero_factura,
            cliente_id
        }, 'operations');
        
        // ==================== FIN VALIDACIONES ESTRICTAS ====================
        
        // Validar y obtener empresa_id válido
        // Validar y obtener empresa_id válido
        let empresaIdValido = empresa_id;
        
        // Las validaciones estrictas ya verificaron que empresa_id es válido
        console.log(`✅ Usando empresa validada: ${empresaExiste.nombre} (ID: ${empresaIdValido})`);
        
        // Verificar que la empresa existe (ya validado arriba, pero mantener para compatibilidad)
        const empresaExisteVerificada = empresaExiste;
        
        // Generar número de serie único
        const numero_serie = sistemaIntegridad.generarNumeroSerie(empresaIdValido, numero_factura);
        
        // Preparar datos para hash de integridad
        const datosFactura = {
            numero_factura,
            empresa_id: empresaIdValido,
            cliente_id,
            fecha_emision,
            fecha_operacion: fecha_operacion || fecha_emision,
            subtotal,
            igic,
            total,
            productos: productos || []
        };
        
        // Generar hash de integridad
        const hash_documento = sistemaIntegridad.generarHashIntegridad(datosFactura);
        
        // Generar sellado temporal
        const selladoTemporal = sistemaIntegridad.generarSelladoTemporal(datosFactura);
        
        // Insertar factura con todos los campos de Ley Antifraude
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? true : 1;
        
        const query = `
            INSERT INTO facturas (
                numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
                subtotal, igic, total, notas, numero_serie, fecha_operacion,
                tipo_documento, metodo_pago, referencia_operacion, hash_documento,
                sellado_temporal, estado_fiscal, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            numero_factura, empresaIdValido, cliente_id, fecha_emision, fecha_vencimiento,
            subtotal, igic, total, notas, numero_serie, fecha_operacion || fecha_emision,
            tipo_documento, metodo_pago, referencia_operacion || '', hash_documento,
            selladoTemporal.timestamp, 'pendiente', activoValue
        ];
        
        db.run(query, params, async function(err) {
            if (err) {
                console.error('❌ Error al crear factura:', err.message);
                console.error('❌ Query:', query);
                console.error('❌ Params:', params);
                res.status(500).json({ 
                    success: false,
                    error: 'Error al insertar factura en la base de datos',
                    details: err.message 
                });
                return;
            }
            
            const facturaId = this.lastID;
            
            try {
                // Insertar detalles de la factura
                if (productos && productos.length > 0) {
                    for (const producto of productos) {
                        const productoId = producto.id && producto.id > 0 ? producto.id : null;
                        const cocheId = producto.coche_id || producto.cocheId || producto.cocheID || null;
                        
                        await new Promise((resolve, reject) => {
                            // Aceptar tanto camelCase como snake_case para compatibilidad
                            const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                            const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                            const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                            const cantidad = producto.cantidad || 1;
                            
                            db.run(`
                                INSERT INTO detalles_factura (factura_id, producto_id, coche_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [facturaId, productoId, cocheId, cantidad, precioUnitario, producto.subtotal || (precioUnitario * cantidad), igic, producto.total || (precioUnitario * cantidad + igic), producto.descripcion || null, tipoImpuesto], function(err) {
                                if (err) {
                                    console.error('❌ Error al insertar detalle de factura:', err.message);
                                    console.error('❌ Datos del producto:', JSON.stringify(producto, null, 2));
                                    reject(err);
                                } else {
                                    console.log('✅ Detalle de factura insertado:', this.lastID);
                                    resolve();
                                }
                            });
                        });
                        
                        // Marcar coche como vendido si es un coche
                        if (cocheId) {
                            const dbType = config.get('database.type') || 'postgresql';
                            const inactivoValue = dbType === 'postgresql' ? 'false' : '0';
                            
                            await new Promise((resolve, reject) => {
                                db.run(`UPDATE coches SET activo = ${inactivoValue} WHERE id = ?`, [cocheId], function(err) {
                                    if (err) {
                                        console.error(`❌ Error marcando coche ${cocheId} como vendido:`, err.message);
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                            
                            // Actualizar producto asociado si existe (usando matrícula)
                            const cocheInfo = await runGet('SELECT matricula FROM coches WHERE id = ?', [cocheId]);
                            if (cocheInfo?.matricula) {
                                await new Promise((resolve, reject) => {
                                    db.run(`
                                        UPDATE productos 
                                        SET activo = ${inactivoValue} 
                                        WHERE codigo = ?
                                    `, [cocheInfo.matricula], function(err) {
                                        if (err) {
                                            console.error(`❌ Error marcando producto ${cocheInfo.matricula} como vendido:`, err.message);
                                            reject(err);
                                        } else {
                                            resolve();
                                        }
                                    });
                                });
                            }
                        } else if (producto.descripcion && producto.descripcion.includes(' - ')) {
                            // Extraer matrícula de la descripción (formato: "Modelo - MATRÍCULA - Color")
                            const partes = producto.descripcion.split(' - ');
                            if (partes.length >= 2) {
                                const matricula = partes[1].trim();
                                
                                // Verificar si es una matrícula válida (contiene números y letras)
                                if (/[A-Z0-9]/.test(matricula)) {
                                    console.log(`🔍 Marcando coche como vendido: ${matricula}`);
                                    
                                    // Marcar coche como vendido
                                    const dbType = config.get('database.type') || 'postgresql';
                                    const activoValue = dbType === 'postgresql' ? 'false' : '0';
                                    await new Promise((resolve, reject) => {
                                        db.run(`
                                            UPDATE coches 
                                            SET activo = ${activoValue} 
                                            WHERE matricula = ?
                                        `, [matricula], function(err) {
                                            if (err) {
                                                console.error(`❌ Error marcando coche ${matricula} como vendido:`, err.message);
                                                reject(err);
                                            } else {
                                                if (this.changes > 0) {
                                                    console.log(`✅ Coche ${matricula} marcado como vendido`);
                                                } else {
                                                    console.log(`⚠️ Coche ${matricula} no encontrado en la base de datos`);
                                                }
                                                resolve();
                                            }
                                        });
                                    });
                                    
                                    // Marcar producto asociado como vendido
                                    const dbTypeProducto = config.get('database.type') || 'postgresql';
                                    const activoValueProducto = dbTypeProducto === 'postgresql' ? 'false' : '0';
                                    await new Promise((resolve, reject) => {
                                        db.run(`
                                            UPDATE productos 
                                            SET activo = ${activoValueProducto} 
                                            WHERE codigo = ?
                                        `, [matricula], function(err) {
                                            if (err) {
                                                console.error(`❌ Error marcando producto ${matricula} como vendido:`, err.message);
                                                reject(err);
                                            } else {
                                                if (this.changes > 0) {
                                                    console.log(`✅ Producto ${matricula} marcado como vendido`);
                                                } else {
                                                    console.log(`⚠️ Producto ${matricula} no encontrado en la base de datos`);
                                                }
                                                resolve();
                                            }
                                        });
                                    });
                                }
                            }
                        }
                    }
                }
                
                // Registrar en auditoría
                const datosCompletosFactura = {
                    id: facturaId,
                    numero_factura,
                    numero_serie,
                    empresa_id,
                    cliente_id,
                    fecha_emision,
                    fecha_operacion: fecha_operacion || fecha_emision,
                    subtotal,
                    igic,
                    total,
                    hash_documento,
                    sellado_temporal: selladoTemporal.timestamp
                };
                
                await sistemaAuditoria.registrarCreacionFactura(datosCompletosFactura);
                logger.debug('Factura registrada en auditoría', { facturaId, numero_factura }, 'operations');
                
                // Generar código VeriFactu
                const codigoVeriFactu = sistemaIntegridad.generarCodigoVeriFactu(datosCompletosFactura);
                logger.debug('Código VeriFactu generado', { facturaId, codigoVeriFactu }, 'operations');
                
                // Actualizar factura con código VeriFactu
                const updateStartTime = Date.now();
                db.run('UPDATE facturas SET codigo_verifactu = ? WHERE id = ?', [codigoVeriFactu, facturaId], function(err) {
                    const duration = Date.now() - updateStartTime;
                    if (err) {
                        logger.error('Error actualizando código VeriFactu', { error: err.message, facturaId }, 'database');
                    } else {
                        logger.databaseQuery('UPDATE facturas SET codigo_verifactu', duration, this.changes, [facturaId]);
                    }
                });
                
                // Generar firma digital de la factura con certificado de empresa
                const datosFacturaParaFirma = {
                    ...datosCompletosFactura,
                    codigo_verifactu: codigoVeriFactu,
                    productos: productos || []
                };
                
                const resultadoFirma = await sistemaFirmaDigital.firmarDocumentoConEmpresa(empresa_id, datosFacturaParaFirma);
                
                if (resultadoFirma.success) {
                    const firmaDigital = {
                        firma: resultadoFirma.firma,
                        archivo: resultadoFirma.firma.archivo,
                        certificado: resultadoFirma.firma.certificado
                    };
                    
                    // Actualizar factura con información de firma digital
                    const firmaStartTime = Date.now();
                    db.run('UPDATE facturas SET respuesta_aeat = ? WHERE id = ?', 
                        [JSON.stringify({ firma_digital: firmaDigital.firma, archivo_firma: firmaDigital.archivo }), facturaId], function(err) {
                            const duration = Date.now() - firmaStartTime;
                            if (err) {
                                logger.error('Error actualizando firma digital', { error: err.message, facturaId }, 'database');
                            } else {
                                logger.databaseQuery('UPDATE facturas SET respuesta_aeat', duration, this.changes, [facturaId]);
                            }
                        });
                    
                    logger.info('Factura firmada digitalmente', { 
                        facturaId, 
                        archivo: firmaDigital.archivo 
                    }, 'operations');
                } else {
                    logger.warn('No se pudo firmar la factura', { 
                        facturaId, 
                        error: resultadoFirma.error 
                    }, 'operations');
                }
                
                const totalDuration = Date.now() - startTime;
                logger.invoiceCreated(facturaId, numero_factura, total, cliente_id);
                logger.info('Factura creada exitosamente con cumplimiento de Ley Antifraude', {
                    facturaId,
                    numero_factura,
                    numero_serie,
                    empresa_id,
                    cliente_id,
                    total,
                    duration: `${totalDuration}ms`,
                    productos_count: productos?.length || 0
                }, 'operations');
                
                // Limpiar caché de facturas para que se actualice el historial
                if (global.cacheManager) {
                    try {
                        const deletedCount = global.cacheManager.delPattern('facturas:*');
                        logger.debug('Caché de facturas limpiado después de crear factura', { deletedCount, facturaId });
                        console.log(`🗑️ Caché de facturas limpiado: ${deletedCount} entradas eliminadas`);
                    } catch (cacheError) {
                        logger.warn('Error al limpiar caché de facturas', { error: cacheError.message });
                        console.error('❌ Error al limpiar caché de facturas:', cacheError.message);
                    }
                }
                
                res.json({ 
                    success: true, 
                    data: { 
                        id: facturaId, 
                        numero_factura,
                        numero_serie,
                        hash_documento,
                        sellado_temporal: selladoTemporal.timestamp,
                        codigo_verifactu: codigoVeriFactu,
                        total 
                    } 
                });
                
            } catch (error) {
                const totalDuration = Date.now() - startTime;
                logger.error('Error en proceso de creación de factura', {
                    error: error.message,
                    stack: error.stack,
                    empresa_id,
                    cliente_id,
                    numero_factura,
                    duration: `${totalDuration}ms`
                }, 'operations');
                res.status(500).json({ 
                    success: false,
                    error: 'Error en el proceso de creación de factura',
                    details: error.message 
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Error general en creación de factura:', error);
        console.error('❌ Stack trace:', error.stack);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// GET - Generar siguiente número de factura por empresa
app.get('/api/facturas/siguiente-numero/:empresaId', (req, res) => {
    const empresaId = req.params.empresaId;
    const año = new Date().getFullYear();
    
    // ==================== VALIDACIONES ESTRICTAS ====================
    
    // 1. Validar que empresaId es un número válido
    if (!empresaId || isNaN(empresaId) || parseInt(empresaId) <= 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'ID de empresa inválido. Debe ser un número positivo.' 
        });
    }
    
    const empresaIdNumero = parseInt(empresaId);
    
    // 2. Verificar que la empresa existe
    db.get("SELECT id, nombre FROM empresas WHERE id = ?", [empresaIdNumero], (err, empresa) => {
        if (err) {
            console.error('❌ Error consultando empresa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error interno al consultar la empresa' 
            });
        }
        
        if (!empresa) {
            return res.status(404).json({ 
                success: false, 
                error: `La empresa con ID ${empresaIdNumero} no existe en la base de datos` 
            });
        }
        
        console.log(`✅ Generando número para empresa válida: ${empresa.nombre} (ID: ${empresaIdNumero})`);
        
        // ==================== FIN VALIDACIONES ESTRICTAS ====================
        
        // Generar prefijo basado en nombre y ubicación
        const prefijo = generarPrefijoEmpresa(empresa.nombre, empresa.direccion);
        
        // Buscar el último número de factura para esta empresa
        db.get(`
            SELECT MAX(CAST(SUBSTR(numero_factura, ${prefijo.length + 1}, 3) AS INTEGER)) as ultimo_numero
            FROM facturas 
            WHERE empresa_id = ? AND numero_factura LIKE '${prefijo}%/${año}'
        `, [empresaIdNumero], (err, row) => {
            if (err) {
                console.error('❌ Error consultando último número:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error interno al consultar números de factura existentes' 
                });
            }
            
            const siguienteNumero = (row.ultimo_numero || 0) + 1;
            const numeroFormateado = `${prefijo}${siguienteNumero.toString().padStart(3, '0')}/${año}`;
            
            // Verificar que el número generado no existe (doble verificación)
            db.get("SELECT id FROM facturas WHERE numero_factura = ? AND empresa_id = ?", 
                [numeroFormateado, empresaIdNumero], (err, existe) => {
                if (err) {
                    console.error('❌ Error verificando número único:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error interno al verificar número único' 
                    });
                }
                
                if (existe) {
                    console.error(`❌ Número duplicado detectado: ${numeroFormateado}`);
                    return res.status(500).json({ 
                        success: false, 
                        error: `Error: El número ${numeroFormateado} ya existe. Contacte al administrador.` 
                    });
                }
                
                console.log(`✅ Número único generado: ${numeroFormateado}`);
            
            res.json({ 
                success: true, 
                data: { 
                    numero_factura: numeroFormateado,
                        empresa_id: empresaIdNumero,
                    prefijo: prefijo,
                    empresa_nombre: empresa.nombre,
                        empresa_ubicacion: empresa.direccion,
                        siguiente_numero: siguienteNumero
                } 
                });
            });
        });
    });
});

// Función para generar prefijo único por empresa y ubicación
function generarPrefijoEmpresa(nombre, direccion) {
    // Extraer palabras clave del nombre
    const palabrasNombre = nombre.toLowerCase()
        .replace(/[^a-z\s]/g, '') // Solo letras y espacios
        .split(' ')
        .filter(palabra => palabra.length > 2); // Palabras de más de 2 caracteres
    
    // Extraer código postal o ciudad de la dirección
    const codigoPostal = direccion ? direccion.match(/\d{5}/)?.[0] || '' : '';
    const ciudad = direccion ? extraerCiudad(direccion) : '';
    
    // Generar prefijo basado en nombre y ubicación
    let prefijo = '';
    
    if (palabrasNombre.length >= 2) {
        // Usar primeras letras de las dos primeras palabras
        prefijo = palabrasNombre[0].substring(0, 2) + palabrasNombre[1].substring(0, 1);
    } else if (palabrasNombre.length === 1) {
        // Usar primeras 3 letras de la palabra
        prefijo = palabrasNombre[0].substring(0, 3);
    } else {
        // Fallback: usar primeras 3 letras del nombre completo
        prefijo = nombre.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    }
    
    // Agregar identificador de ubicación si es necesario
    if (ciudad) {
        const ciudadCode = ciudad.substring(0, 2).toUpperCase();
        prefijo += ciudadCode;
    } else if (codigoPostal) {
        // Usar últimos 2 dígitos del código postal
        prefijo += codigoPostal.substring(3, 5);
    }
    
    return prefijo.toUpperCase();
}

// Función para extraer ciudad de la dirección
function extraerCiudad(direccion) {
    const ciudadesComunes = [
        'madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 'málaga', 'murcia',
        'palma', 'las palmas', 'bilbao', 'alicante', 'córdoba', 'valladolid', 'vigo',
        'gijón', 'hospitalet', 'coruña', 'granada', 'elche', 'santa cruz', 'oviedo',
        'badalona', 'cartagena', 'terrassa', 'jerez', 'sabadell', 'móstoles', 'alcalá',
        'pamplona', 'fuenlabrada', 'almería', 'leganés', 'santander', 'castellón',
        'burgos', 'albacete', 'getafe', 'salamanca', 'huelva', 'marbella', 'logroño',
        'badajoz', 'san sebastián', 'león', 'cádiz', 'tarragona', 'lérida', 'mataró',
        'santa coloma', 'algeciras', 'jaén', 'ourense', 'reus', 'torrelavega', 'el ejido',
        'lugo', 'santiago', 'ceuta', 'melilla', 'canarias', 'baleares', 'andalucía',
        'cataluña', 'galicia', 'castilla', 'aragón', 'extremadura', 'navarra', 'rioja'
    ];
    
    const direccionLower = direccion.toLowerCase();
    
    for (const ciudad of ciudadesComunes) {
        if (direccionLower.includes(ciudad)) {
            return ciudad;
        }
    }
    
    return null;
}

// ==================== ENDPOINTS DE PROFORMAS ====================

// GET - Obtener todas las proformas (con paginación)
app.get('/api/proformas', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', empresa_id = '', cliente_id = '', coche_id = '' } = req.query;
        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';
        
        let whereConditions = [`(p.activo = ${activoValue} OR p.activo IS NULL)`];
        let whereParams = [];
        
        if (search) {
            whereConditions.push('(p.numero_proforma LIKE ? OR c.nombre LIKE ? OR e.nombre LIKE ?)');
            whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (empresa_id) {
            whereConditions.push('p.empresa_id = ?');
            whereParams.push(empresa_id);
        }
        
        if (cliente_id) {
            whereConditions.push('p.cliente_id = ?');
            whereParams.push(cliente_id);
        }
        
        if (coche_id) {
            whereConditions.push('p.coche_id = ?');
            whereParams.push(coche_id);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        const joins = [
            { type: 'LEFT', table: 'clientes c', condition: 'p.cliente_id = c.id' },
            { type: 'LEFT', table: 'empresas e', condition: 'p.empresa_id = e.id' },
            { type: 'LEFT', table: 'coches co', condition: 'p.coche_id = co.id' }
        ];
        
        const result = await paginationManager.getPaginatedDataWithJoins('proformas p', joins, {
            page: parseInt(page),
            limit: maxLimit,
            where: whereClause,
            whereParams: whereParams,
            orderBy: 'p.fecha_creacion',
            orderDirection: 'DESC',
            select: `p.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion, e.nombre as empresa_nombre, e.cif as empresa_cif, co.matricula as coche_matricula, co.modelo as coche_modelo, co.marca as coche_marca,
                     (SELECT COUNT(*) FROM detalles_proforma dp WHERE dp.proforma_id = p.id AND dp.coche_id IS NOT NULL) as coches_count`
        });
        
        res.json({ success: true, data: result.data || [], pagination: result.pagination });
    } catch (error) {
        console.error('❌ Error al obtener proformas:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener proforma por ID con detalles
app.get('/api/proformas/:id', (req, res) => {
    const proformaId = req.params.id;
    
    db.get(`
        SELECT p.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion, c.identificacion as cliente_identificacion,
               e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
               co.matricula as coche_matricula, co.modelo as coche_modelo, co.marca as coche_marca, co.color as coche_color, co.kms as coche_kms, co.chasis as coche_chasis
        FROM proformas p 
        LEFT JOIN clientes c ON p.cliente_id = c.id 
        LEFT JOIN empresas e ON p.empresa_id = e.id
        LEFT JOIN coches co ON p.coche_id = co.id
        WHERE p.id = ?
    `, [proformaId], (err, proforma) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!proforma) {
            res.status(404).json({ error: 'Proforma no encontrada' });
            return;
        }
        
        // Obtener detalles de la proforma
        db.all(`
            SELECT dp.*, COALESCE(dp.descripcion, pr.descripcion) as descripcion, COALESCE(dp.tipo_impuesto, 'igic') as tipo_impuesto,
                   co.matricula as coche_matricula, co.chasis as coche_chasis, co.color as coche_color, 
                   co.kms as coche_kms, co.modelo as coche_modelo, co.marca as coche_marca
            FROM detalles_proforma dp
            LEFT JOIN productos pr ON dp.producto_id = pr.id
            LEFT JOIN coches co ON dp.coche_id = co.id
            WHERE dp.proforma_id = ?
        `, [proformaId], (err, detalles) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            proforma.detalles = detalles;
            res.json({ success: true, data: proforma });
        });
    });
});

// POST - Crear nueva proforma
app.post('/api/proformas', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { 
            numero_proforma, 
            empresa_id,
            cliente_id, 
            coche_id,
            fecha_emision, 
            fecha_validez, 
            subtotal, 
            igic, 
            total, 
            notas,
            productos
        } = req.body;
        
        logger.info('Iniciando creación de proforma', {
            numero_proforma,
            empresa_id,
            cliente_id,
            coche_id,
            total,
            productos_count: productos?.length || 0
        }, 'operations');
        
        // Validar empresa_id
        if (!empresa_id || empresa_id === null || empresa_id === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'empresa_id es obligatorio para crear una proforma' 
            });
        }
        
        // Verificar que la empresa existe
        const empresaExiste = await new Promise((resolve, reject) => {
            db.get("SELECT id, nombre FROM empresas WHERE id = ?", [empresa_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!empresaExiste) {
            return res.status(400).json({ 
                success: false, 
                error: `La empresa con ID ${empresa_id} no existe en la base de datos` 
            });
        }
        
        // Validar número de proforma único para la empresa
        if (numero_proforma) {
            const numeroExiste = await new Promise((resolve, reject) => {
                db.get("SELECT id, numero_proforma FROM proformas WHERE numero_proforma = ? AND empresa_id = ?", 
                    [numero_proforma, empresa_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
            });
            
            if (numeroExiste) {
                return res.status(400).json({ 
                    success: false, 
                    error: `El número de proforma "${numero_proforma}" ya existe para la empresa "${empresaExiste.nombre}"` 
                });
            }
        }
        
        // Validar cliente_id si se proporciona
        if (cliente_id) {
            const clienteExiste = await new Promise((resolve, reject) => {
                db.get("SELECT id, nombre FROM clientes WHERE id = ?", [cliente_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!clienteExiste) {
                return res.status(400).json({ 
                    success: false, 
                    error: `El cliente con ID ${cliente_id} no existe en la base de datos` 
                });
            }
        }
        
        // Validar coche_id si se proporciona
        if (coche_id) {
            const cocheExiste = await new Promise((resolve, reject) => {
                db.get("SELECT id, matricula FROM coches WHERE id = ?", [coche_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!cocheExiste) {
                return res.status(400).json({ 
                    success: false, 
                    error: `El coche con ID ${coche_id} no existe en la base de datos` 
                });
            }
        }
        
        // Insertar proforma
        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? true : 1;
        
        const query = `
            INSERT INTO proformas (
                numero_proforma, empresa_id, cliente_id, coche_id, fecha_emision, fecha_validez,
                subtotal, igic, total, notas, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            numero_proforma, empresa_id, cliente_id || null, coche_id || null, fecha_emision, fecha_validez || null,
            subtotal, igic, total, notas || null, activoValue
        ];
        
        db.run(query, params, async function(err) {
            if (err) {
                console.error('❌ Error al crear proforma:', err.message);
                res.status(500).json({ 
                    success: false,
                    error: 'Error al insertar proforma en la base de datos',
                    details: err.message 
                });
                return;
            }
            
            const proformaId = this.lastID;
            
            try {
                // Insertar detalles de la proforma
                if (productos && productos.length > 0) {
                    for (const producto of productos) {
                        const productoId = producto.id && producto.id > 0 ? producto.id : null;
                        const cocheIdDetalle = producto.coche_id || producto.cocheId || producto.cocheID || coche_id || null;
                        
                        await new Promise((resolve, reject) => {
                            const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                            const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                            const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                            const cantidad = producto.cantidad || 1;
                            
                            db.run(`
                                INSERT INTO detalles_proforma (proforma_id, producto_id, coche_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [proformaId, productoId, cocheIdDetalle, cantidad, precioUnitario, producto.subtotal || (precioUnitario * cantidad), igic, producto.total || (precioUnitario * cantidad + igic), producto.descripcion || null, tipoImpuesto], function(err) {
                                if (err) {
                                    console.error('❌ Error al insertar detalle de proforma:', err.message);
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                }
                
                const totalDuration = Date.now() - startTime;
                logger.info('Proforma creada exitosamente', {
                    proformaId,
                    numero_proforma,
                    empresa_id,
                    cliente_id,
                    coche_id,
                    total,
                    duration: `${totalDuration}ms`,
                    productos_count: productos?.length || 0
                }, 'operations');
                
                res.json({ 
                    success: true, 
                    data: { 
                        id: proformaId, 
                        numero_proforma,
                        total 
                    } 
                });
                
            } catch (error) {
                const totalDuration = Date.now() - startTime;
                logger.error('Error en proceso de creación de proforma', {
                    error: error.message,
                    stack: error.stack,
                    empresa_id,
                    cliente_id,
                    coche_id,
                    numero_proforma,
                    duration: `${totalDuration}ms`
                }, 'operations');
                res.status(500).json({ 
                    success: false,
                    error: 'Error en el proceso de creación de proforma',
                    details: error.message 
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Error general en creación de proforma:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// PUT - Actualizar proforma
app.put('/api/proformas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const proformaId = parseInt(id, 10);
        const { 
            numero_proforma, 
            empresa_id,
            cliente_id, 
            coche_id,
            fecha_emision, 
            fecha_validez, 
            subtotal, 
            igic, 
            total, 
            notas,
            estado,
            productos
        } = req.body;
        
        // Validar ID
        if (isNaN(proformaId) || proformaId <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de proforma inválido',
                received: id
            });
        }
        
        // Verificar que la proforma existe
        const proformaExiste = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM proformas WHERE id = ?', [proformaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!proformaExiste) {
            return res.status(404).json({ 
                success: false,
                error: 'Proforma no encontrada' 
            });
        }
        
        // Construir actualización
        const updates = [];
        const values = [];
        
        if (numero_proforma !== undefined) {
            updates.push('numero_proforma = ?');
            values.push(numero_proforma);
        }
        if (empresa_id !== undefined) {
            updates.push('empresa_id = ?');
            values.push(empresa_id);
        }
        if (cliente_id !== undefined) {
            updates.push('cliente_id = ?');
            values.push(cliente_id);
        }
        if (coche_id !== undefined) {
            updates.push('coche_id = ?');
            values.push(coche_id);
        }
        if (fecha_emision !== undefined) {
            updates.push('fecha_emision = ?');
            values.push(fecha_emision);
        }
        if (fecha_validez !== undefined) {
            updates.push('fecha_validez = ?');
            values.push(fecha_validez);
        }
        if (subtotal !== undefined) {
            updates.push('subtotal = ?');
            values.push(subtotal);
        }
        if (igic !== undefined) {
            updates.push('igic = ?');
            values.push(igic);
        }
        if (total !== undefined) {
            updates.push('total = ?');
            values.push(total);
        }
        if (notas !== undefined) {
            updates.push('notas = ?');
            values.push(notas);
        }
        if (estado !== undefined) {
            updates.push('estado = ?');
            values.push(estado);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No hay campos para actualizar'
            });
        }
        
        values.push(proformaId);
        
        // Actualizar proforma
        const changes = await new Promise((resolve, reject) => {
            db.run(`UPDATE proformas SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        // Si se proporcionan productos, actualizar detalles
        if (productos && Array.isArray(productos)) {
            // Eliminar detalles existentes
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM detalles_proforma WHERE proforma_id = ?', [proformaId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            // Insertar nuevos detalles
            for (const producto of productos) {
                const productoId = producto.id && producto.id > 0 ? producto.id : null;
                const cocheIdDetalle = producto.coche_id || producto.cocheId || producto.cocheID || coche_id || null;
                
                await new Promise((resolve, reject) => {
                    const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                    const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                    const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                    const cantidad = producto.cantidad || 1;
                    
                    db.run(`
                        INSERT INTO detalles_proforma (proforma_id, producto_id, coche_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [proformaId, productoId, cocheIdDetalle, cantidad, precioUnitario, producto.subtotal || (precioUnitario * cantidad), igic, producto.total || (precioUnitario * cantidad + igic), producto.descripcion || null, tipoImpuesto], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }
        
        // Obtener proforma actualizada
        const proformaActualizada = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM proformas WHERE id = ?', [proformaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({ 
            success: true, 
            message: 'Proforma actualizada correctamente',
            data: proformaActualizada
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar proforma:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// DELETE - Eliminar proforma
app.delete('/api/proformas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const proformaId = parseInt(id, 10);
        
        // Validar ID
        if (isNaN(proformaId) || proformaId <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de proforma inválido',
                received: id
            });
        }
        
        // Eliminar detalles primero
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM detalles_proforma WHERE proforma_id = ?', [proformaId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // Eliminar proforma
        const changes = await new Promise((resolve, reject) => {
            db.run('DELETE FROM proformas WHERE id = ?', [proformaId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
        
        if (changes === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Proforma no encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Proforma eliminada correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar proforma:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// DELETE - Eliminar todas las proformas (para limpieza)
app.delete('/api/proformas/todas', async (req, res) => {
    try {
        // Eliminar todos los detalles de proforma primero
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM detalles_proforma', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Eliminar todas las proformas
        const changes = await new Promise((resolve, reject) => {
            db.run('DELETE FROM proformas', function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        logger.info('Todas las proformas eliminadas', {
            proformasEliminadas: changes
        });

        res.json({ 
            success: true, 
            message: `Se eliminaron ${changes} proformas`,
            eliminadas: changes
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar todas las proformas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// POST - Dividir proforma en proformas individuales (una por cada coche)
app.post('/api/proformas/:id/dividir', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { id } = req.params;
        const proformaId = parseInt(id, 10);
        
        if (isNaN(proformaId)) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de proforma inválido' 
            });
        }

        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';

        // Obtener la proforma original con sus detalles
        const proformaOriginal = await new Promise((resolve, reject) => {
            db.get(`
                SELECT p.*, e.nombre as empresa_nombre, e.direccion as empresa_direccion
                FROM proformas p
                LEFT JOIN empresas e ON p.empresa_id = e.id
                WHERE p.id = ?
            `, [proformaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!proformaOriginal) {
            return res.status(404).json({ 
                success: false,
                error: 'Proforma no encontrada' 
            });
        }

        // Obtener detalles de la proforma que tengan coche_id
        const detalles = await new Promise((resolve, reject) => {
            db.all(`
                SELECT dp.*, c.marca, c.modelo, c.matricula, c.color
                FROM detalles_proforma dp
                LEFT JOIN coches c ON dp.coche_id = c.id
                WHERE dp.proforma_id = ? AND dp.coche_id IS NOT NULL
            `, [proformaId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'La proforma no tiene coches asociados para dividir' 
            });
        }

        if (detalles.length === 1) {
            return res.status(400).json({ 
                success: false,
                error: 'La proforma ya tiene un solo coche. No es necesario dividirla' 
            });
        }

        const proformasCreadas = [];
        const tipoImpuesto = detalles[0].tipo_impuesto || 'igic';
        const porcentajeImpuesto = tipoImpuesto === 'igic' ? 9.5 : 21;

        // Extraer el prefijo de la proforma original
        // Formato esperado: PRO-PREFIJO001/2025
        const numeroOriginal = proformaOriginal.numero_proforma || '';
        const año = new Date().getFullYear();
        
        // Extraer el prefijo hasta el número (ej: "PRO-TEC" de "PRO-TEC001/2025")
        // Buscar el patrón: PRO- seguido de letras/números, luego 3 dígitos, luego /año
        let prefijoProforma = '';
        const partes = numeroOriginal.split('/');
        if (partes.length === 2) {
            const parteNumero = partes[0]; // Ej: "PRO-TEC001"
            // Buscar los últimos 3 dígitos y extraer todo lo anterior
            const matchNumero = parteNumero.match(/(\d{3})$/);
            if (matchNumero) {
                // Extraer todo excepto los últimos 3 dígitos
                prefijoProforma = parteNumero.substring(0, parteNumero.length - 3);
            } else {
                // Si no hay 3 dígitos al final, usar todo como prefijo
                prefijoProforma = parteNumero;
            }
        } else {
            // Si no tiene el formato esperado, intentar extraer PRO- seguido de letras
            const matchPrefijo = numeroOriginal.match(/^(PRO-[A-Z0-9]+)/);
            if (matchPrefijo) {
                prefijoProforma = matchPrefijo[1];
            } else {
                // Fallback: usar el número original completo
                prefijoProforma = numeroOriginal;
            }
        }

        // Obtener el último número UNA SOLA VEZ antes del loop usando el mismo prefijo
        const ultimoNumeroResult = await new Promise((resolve, reject) => {
            db.get(`
                SELECT MAX(CAST(SUBSTR(numero_proforma, ${prefijoProforma.length + 1}, 3) AS INTEGER)) as ultimo_numero
                FROM proformas 
                WHERE empresa_id = ? AND numero_proforma LIKE ? || '%' AND numero_proforma LIKE '%/' || ?
            `, [proformaOriginal.empresa_id, prefijoProforma, año], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Empezar desde el siguiente número disponible
        let numeroActual = (ultimoNumeroResult?.ultimo_numero || 0) + 1;

        // Marcar la proforma original como "anulado" antes de crear las nuevas
        await new Promise((resolve, reject) => {
            db.run('UPDATE proformas SET estado = ? WHERE id = ?', ['anulado', proformaId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Crear una proforma individual por cada coche
        for (const detalle of detalles) {
            const precioUnitario = detalle.precio_unitario || 0;
            const cantidad = detalle.cantidad || 1;
            const subtotal = precioUnitario * cantidad;
            const impuesto = subtotal * (porcentajeImpuesto / 100);
            const total = subtotal + impuesto;

            // Generar número secuencial
            const nuevoNumero = `${prefijoProforma}${String(numeroActual).padStart(3, '0')}/${año}`;
            
            // Incrementar para la siguiente proforma
            numeroActual++;

            // Crear nueva proforma
            const nuevaProformaId = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO proformas (
                        numero_proforma, empresa_id, cliente_id, coche_id,
                        fecha_emision, fecha_validez, subtotal, igic, total,
                        estado, notas, activo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    nuevoNumero,
                    proformaOriginal.empresa_id,
                    proformaOriginal.cliente_id,
                    detalle.coche_id,
                    proformaOriginal.fecha_emision,
                    proformaOriginal.fecha_validez,
                    subtotal,
                    impuesto,
                    total,
                    proformaOriginal.estado || 'pendiente',
                    `Dividida de ${proformaOriginal.numero_proforma}. ${proformaOriginal.notas || ''}`.trim(),
                    activoValue
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });

            // Crear detalle de la nueva proforma
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO detalles_proforma (
                        proforma_id, producto_id, coche_id, cantidad,
                        precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    nuevaProformaId,
                    detalle.producto_id,
                    detalle.coche_id,
                    cantidad,
                    precioUnitario,
                    subtotal,
                    impuesto,
                    total,
                    detalle.descripcion || `${detalle.marca || ''} ${detalle.modelo || ''} - Matrícula: ${detalle.matricula || ''} - ${detalle.color || ''}`.trim(),
                    tipoImpuesto
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            proformasCreadas.push({
                id: nuevaProformaId,
                numero_proforma: nuevoNumero,
                coche_matricula: detalle.matricula
            });
        }

        const totalDuration = Date.now() - startTime;
        logger.info('Proforma dividida exitosamente', {
            proformaOriginalId: proformaId,
            numeroOriginal: proformaOriginal.numero_proforma,
            proformasCreadas: proformasCreadas.length,
            duration: totalDuration
        });

        res.json({ 
            success: true, 
            message: `Proforma dividida en ${proformasCreadas.length} proformas individuales`,
            data: {
                proforma_original_id: proformaId,
                proformas_creadas: proformasCreadas
            }
        });
        
    } catch (error) {
        console.error('❌ Error al dividir proforma:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// POST - Dividir factura en facturas individuales (una por cada coche)
app.post('/api/facturas/:id/dividir', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { id } = req.params;
        const facturaId = parseInt(id, 10);
        
        if (isNaN(facturaId) || facturaId <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de factura inválido' 
            });
        }

        const dbType = config.get('database.type') || 'postgresql';
        const activoValue = dbType === 'postgresql' ? 'true' : '1';

        // Obtener la factura original con sus detalles
        const facturaOriginal = await new Promise((resolve, reject) => {
            db.get(`
                SELECT f.*, e.nombre as empresa_nombre, e.direccion as empresa_direccion
                FROM facturas f
                LEFT JOIN empresas e ON f.empresa_id = e.id
                WHERE f.id = ?
            `, [facturaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!facturaOriginal) {
            return res.status(404).json({ 
                success: false,
                error: 'Factura no encontrada' 
            });
        }

        // Obtener detalles de la factura que tengan coche_id
        const detalles = await new Promise((resolve, reject) => {
            db.all(`
                SELECT df.*, c.marca, c.modelo, c.matricula, c.color
                FROM detalles_factura df
                LEFT JOIN coches c ON df.coche_id = c.id
                WHERE df.factura_id = ? AND df.coche_id IS NOT NULL
            `, [facturaId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'La factura no tiene coches asociados para dividir' 
            });
        }

        if (detalles.length === 1) {
            return res.status(400).json({ 
                success: false,
                error: 'La factura ya tiene un solo coche. No es necesario dividirla' 
            });
        }

        const facturasCreadas = [];
        const tipoImpuesto = detalles[0].tipo_impuesto || 'igic';
        const porcentajeImpuesto = tipoImpuesto === 'igic' ? 9.5 : 21;

        // Extraer el prefijo de la factura original
        const numeroOriginal = facturaOriginal.numero_factura || '';
        const año = new Date().getFullYear();
        
        // Extraer el prefijo hasta el número (ej: "TEC" de "TEC001/2025")
        let prefijoFactura = '';
        const partes = numeroOriginal.split('/');
        if (partes.length === 2) {
            const parteNumero = partes[0]; // Ej: "TEC001"
            // Buscar los últimos 3 dígitos y extraer todo lo anterior
            const matchNumero = parteNumero.match(/(\d{3})$/);
            if (matchNumero) {
                prefijoFactura = parteNumero.substring(0, parteNumero.length - 3);
            } else {
                prefijoFactura = parteNumero;
            }
        } else {
            const matchPrefijo = numeroOriginal.match(/^([A-Z0-9]+)/);
            if (matchPrefijo) {
                prefijoFactura = matchPrefijo[1];
            } else {
                prefijoFactura = numeroOriginal;
            }
        }

        // Obtener el último número UNA SOLA VEZ antes del loop usando el mismo prefijo
        const ultimoNumeroResult = await new Promise((resolve, reject) => {
            db.get(`
                SELECT MAX(CAST(SUBSTR(numero_factura, ${prefijoFactura.length + 1}, 3) AS INTEGER)) as ultimo_numero
                FROM facturas 
                WHERE empresa_id = ? AND numero_factura LIKE ? || '%' AND numero_factura LIKE '%/' || ?
            `, [facturaOriginal.empresa_id, prefijoFactura, año], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Empezar desde el siguiente número disponible
        let numeroActual = (ultimoNumeroResult?.ultimo_numero || 0) + 1;

        // Marcar la factura original como "anulado" antes de crear las nuevas
        await new Promise((resolve, reject) => {
            db.run('UPDATE facturas SET estado = ? WHERE id = ?', ['anulado', facturaId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Crear una factura individual por cada coche
        for (const detalle of detalles) {
            const precioUnitario = detalle.precio_unitario || 0;
            const cantidad = detalle.cantidad || 1;
            const subtotal = precioUnitario * cantidad;
            const impuesto = subtotal * (porcentajeImpuesto / 100);
            const total = subtotal + impuesto;

            // Generar número secuencial
            const nuevoNumero = `${prefijoFactura}${String(numeroActual).padStart(3, '0')}/${año}`;
            
            // Incrementar para la siguiente factura
            numeroActual++;

            // Crear nueva factura
            const nuevaFacturaId = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO facturas (
                        numero_factura, empresa_id, cliente_id,
                        fecha_emision, fecha_vencimiento, subtotal, igic, total,
                        estado, notas, activo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    nuevoNumero,
                    facturaOriginal.empresa_id,
                    facturaOriginal.cliente_id,
                    facturaOriginal.fecha_emision,
                    facturaOriginal.fecha_vencimiento,
                    subtotal,
                    impuesto,
                    total,
                    facturaOriginal.estado || 'pendiente',
                    `Dividida de ${facturaOriginal.numero_factura}. ${facturaOriginal.notas || ''}`.trim(),
                    activoValue
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });

            // Crear detalle de la nueva factura
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO detalles_factura (
                        factura_id, producto_id, coche_id, cantidad,
                        precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    nuevaFacturaId,
                    detalle.producto_id,
                    detalle.coche_id,
                    cantidad,
                    precioUnitario,
                    subtotal,
                    impuesto,
                    total,
                    detalle.descripcion || `${detalle.marca || ''} ${detalle.modelo || ''} - Matrícula: ${detalle.matricula || ''} - ${detalle.color || ''}`.trim(),
                    tipoImpuesto
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            facturasCreadas.push({
                id: nuevaFacturaId,
                numero_factura: nuevoNumero,
                coche_matricula: detalle.matricula
            });
        }

        const totalDuration = Date.now() - startTime;
        logger.info('Factura dividida exitosamente', {
            facturaOriginalId: facturaId,
            numeroOriginal: facturaOriginal.numero_factura,
            facturasCreadas: facturasCreadas.length,
            duration: totalDuration
        });

        res.json({ 
            success: true, 
            message: `Factura dividida en ${facturasCreadas.length} facturas individuales`,
            data: {
                factura_original_id: facturaId,
                facturas_creadas: facturasCreadas
            }
        });
        
    } catch (error) {
        console.error('❌ Error al dividir factura:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// GET - Generar siguiente número de proforma por empresa
app.get('/api/proformas/siguiente-numero/:empresaId', (req, res) => {
    const empresaId = req.params.empresaId;
    const año = new Date().getFullYear();
    
    // Validar que empresaId es un número válido
    if (!empresaId || isNaN(empresaId) || parseInt(empresaId) <= 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'ID de empresa inválido. Debe ser un número positivo.' 
        });
    }
    
    const empresaIdNumero = parseInt(empresaId);
    
    // Verificar que la empresa existe
    db.get("SELECT id, nombre FROM empresas WHERE id = ?", [empresaIdNumero], (err, empresa) => {
        if (err) {
            console.error('❌ Error consultando empresa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error interno al consultar la empresa' 
            });
        }
        
        if (!empresa) {
            return res.status(404).json({ 
                success: false, 
                error: `La empresa con ID ${empresaIdNumero} no existe en la base de datos` 
            });
        }
        
        // Generar prefijo basado en nombre y ubicación
        const prefijo = generarPrefijoEmpresa(empresa.nombre, empresa.direccion);
        const prefijoProforma = `PRO-${prefijo}`;
        
        // Buscar el último número de proforma para esta empresa
        db.get(`
            SELECT MAX(CAST(SUBSTR(numero_proforma, ${prefijoProforma.length + 1}, 3) AS INTEGER)) as ultimo_numero
            FROM proformas 
            WHERE empresa_id = ? AND numero_proforma LIKE '${prefijoProforma}%/${año}'
        `, [empresaIdNumero], (err, row) => {
            if (err) {
                console.error('❌ Error consultando último número:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error interno al consultar números de proforma existentes' 
                });
            }
            
            const siguienteNumero = (row.ultimo_numero || 0) + 1;
            const numeroFormateado = `${prefijoProforma}${siguienteNumero.toString().padStart(3, '0')}/${año}`;
            
            // Verificar que el número generado no existe
            db.get("SELECT id FROM proformas WHERE numero_proforma = ? AND empresa_id = ?", 
                [numeroFormateado, empresaIdNumero], (err, existe) => {
                if (err) {
                    console.error('❌ Error verificando número único:', err);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error interno al verificar número único' 
                    });
                }
                
                if (existe) {
                    console.error(`❌ Número duplicado detectado: ${numeroFormateado}`);
                    return res.status(500).json({ 
                        success: false, 
                        error: `Error: El número ${numeroFormateado} ya existe. Contacte al administrador.` 
                    });
                }
                
                res.json({ 
                    success: true, 
                    data: { 
                        numero_proforma: numeroFormateado,
                        empresa_id: empresaIdNumero,
                        prefijo: prefijoProforma,
                        empresa_nombre: empresa.nombre,
                        siguiente_numero: siguienteNumero
                    } 
                });
            });
        });
    });
});

// GET - Debug: Verificar relación entre productos y coches
app.get('/api/debug/productos-coches', (req, res) => {
    db.all(`
        SELECT 
            p.id as producto_id,
            p.descripcion as producto_descripcion,
            c.id as coche_id,
            c.matricula as coche_matricula,
            c.modelo as coche_modelo,
            c.color as coche_color,
            c.kms as coche_kms,
            c.chasis as coche_chasis,
            CASE WHEN c.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_coche
        FROM productos p
        LEFT JOIN coches c ON (p.descripcion LIKE '%' || c.matricula || '%')
        ORDER BY p.id
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Debug: Verificar relación entre facturas y coches
app.get('/api/debug/facturas-coches', (req, res) => {
    db.all(`
        SELECT 
            f.id as factura_id,
            f.numero_factura,
            f.fecha_emision,
            df.id as detalle_id,
            df.descripcion as detalle_descripcion,
            p.id as producto_id,
            p.descripcion as producto_descripcion,
            c.id as coche_id,
            c.matricula as coche_matricula,
            c.modelo as coche_modelo,
            CASE WHEN c.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_coche_relacionado
        FROM facturas f
        LEFT JOIN detalles_factura df ON f.id = df.factura_id
        LEFT JOIN productos p ON df.producto_id = p.id
        LEFT JOIN coches c ON (COALESCE(df.descripcion, p.descripcion) LIKE '%' || c.matricula || '%')
        ORDER BY f.id, df.id
    `, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, data: rows });
    });
});

// GET - Obtener factura por ID con detalles
app.get('/api/facturas/:id', (req, res) => {
    const facturaId = req.params.id;
    
    db.get(`
        SELECT f.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion, c.identificacion as cliente_identificacion,
               e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
        LEFT JOIN empresas e ON f.empresa_id = e.id
        WHERE f.id = ?
    `, [facturaId], (err, factura) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!factura) {
            res.status(404).json({ error: 'Factura no encontrada' });
            return;
        }
        
        // Obtener detalles de la factura con datos del coche
        db.all(`
            SELECT df.*, COALESCE(df.descripcion, p.descripcion) as descripcion, COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto,
                   c.matricula as coche_matricula, c.chasis as coche_chasis, c.color as coche_color, 
                   c.kms as coche_kms, c.modelo as coche_modelo
            FROM detalles_factura df
            LEFT JOIN productos p ON df.producto_id = p.id
            LEFT JOIN coches c ON df.coche_id = c.id
            WHERE df.factura_id = ?
        `, [facturaId], (err, detalles) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            factura.detalles = detalles;
            res.json({ success: true, data: factura });
        });
    });
});

// GET - Generar XML VeriFactu para una factura
app.get('/api/facturas/:id/verifactu', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        // Obtener datos completos de la factura
        const factura = await new Promise((resolve, reject) => {
            db.get(`
                SELECT f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
                       c.direccion as cliente_direccion, c.codigo_postal as cliente_codigo_postal,
                       c.provincia as cliente_provincia, c.pais as cliente_pais,
                       c.codigo_pais as cliente_codigo_pais, c.regimen_fiscal as cliente_regimen_fiscal,
                       e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion,
                       e.codigo_postal as empresa_codigo_postal, e.provincia as empresa_provincia,
                       e.pais as empresa_pais, e.codigo_pais as empresa_codigo_pais,
                       e.regimen_fiscal as empresa_regimen_fiscal
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
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        // Obtener detalles de la factura
        const detalles = await new Promise((resolve, reject) => {
            db.all(`
                SELECT df.*, p.codigo, COALESCE(df.descripcion, p.descripcion) as descripcion, COALESCE(df.tipo_impuesto, 'igic') as tipo_impuesto
                FROM detalles_factura df
                LEFT JOIN productos p ON df.producto_id = p.id
                WHERE df.factura_id = ?
            `, [facturaId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        factura.detalles = detalles;
        
        // Generar XML VeriFactu
        const xmlVeriFactu = generadorVeriFactu.generarXMLVeriFactu(factura);
        
        // Validar XML
        const validacion = generadorVeriFactu.validarXMLVeriFactu(xmlVeriFactu);
        
        if (!validacion.valido) {
            return res.status(400).json({ 
                error: 'XML VeriFactu inválido', 
                detalles: validacion.errores 
            });
        }
        
        res.json({
            success: true,
            data: {
                xml: xmlVeriFactu,
                validacion: validacion,
                factura_id: facturaId,
                numero_serie: factura.numero_serie
            }
        });
        
    } catch (error) {
        console.error('❌ Error al generar XML VeriFactu:', error);
        res.status(500).json({ error: 'Error al generar XML VeriFactu' });
    }
});

// POST - Enviar factura a VeriFactu (simulado)
app.post('/api/facturas/:id/enviar-verifactu', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        // Obtener datos de la factura
        const factura = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        // Generar XML VeriFactu
        const xmlVeriFactu = generadorVeriFactu.generarXMLVeriFactu(factura);
        
        // Simular envío a AEAT
        const respuestaAEAT = generadorVeriFactu.generarRespuestaAEAT(xmlVeriFactu);
        
        // Actualizar factura con respuesta de AEAT
        db.run('UPDATE facturas SET respuesta_aeat = ?, estado_fiscal = ? WHERE id = ?', 
            [JSON.stringify(respuestaAEAT), respuestaAEAT.valido ? 'enviada' : 'error'], facturaId);
        
        // Registrar en auditoría
        await sistemaAuditoria.registrarOperacion(
            'facturas',
            facturaId,
            'UPDATE',
            { estado_fiscal: factura.estado_fiscal },
            { estado_fiscal: respuestaAEAT.valido ? 'enviada' : 'error', respuesta_aeat: respuestaAEAT },
            'sistema'
        );
        
        res.json({
            success: true,
            data: {
                factura_id: facturaId,
                respuesta_aeat: respuestaAEAT,
                xml_enviado: xmlVeriFactu
            }
        });
        
    } catch (error) {
        console.error('❌ Error al enviar a VeriFactu:', error);
        res.status(500).json({ error: 'Error al enviar a VeriFactu' });
    }
});

// GET - Obtener historial de auditoría de una factura
app.get('/api/facturas/:id/auditoria', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        const historial = await sistemaAuditoria.obtenerHistorialAuditoria('facturas', facturaId);
        
        res.json({
            success: true,
            data: historial
        });
        
    } catch (error) {
        console.error('❌ Error al obtener historial de auditoría:', error);
        res.status(500).json({ error: 'Error al obtener historial de auditoría' });
    }
});

// PUT - Marcar factura como pagada
app.put('/api/facturas/:id/marcar-pagada', async (req, res) => {
    try {
        const { id } = req.params;
        const facturaId = parseInt(id, 10);
        const { metodo_pago, referencia_operacion, fecha_pago } = req.body;
        
        // Validar ID
        if (isNaN(facturaId) || facturaId <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de factura inválido',
                received: id
            });
        }
        
        // Obtener factura actual
        const factura = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ 
                success: false,
                error: 'Factura no encontrada' 
            });
        }
        
        // Actualizar factura como pagada
        const fechaPago = fecha_pago || new Date().toISOString().split('T')[0];
        const metodoPago = metodo_pago || 'transferencia';
        const referenciaOperacion = referencia_operacion || '';
        
        const changes = await new Promise((resolve, reject) => {
            db.run(`
                UPDATE facturas 
                SET estado = 'pagada', 
                    estado_fiscal = 'pagada',
                    metodo_pago = ?,
                    referencia_operacion = ?,
                    fecha_operacion = ?
                WHERE id = ?
            `, [metodoPago, referenciaOperacion, fechaPago, facturaId], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    resolve(null);
                    return;
                }
                resolve(this.changes);
            });
        });
        
        if (changes === null) {
            return res.status(404).json({ 
                success: false,
                error: 'Factura no encontrada o no se pudo actualizar' 
            });
        }
        
        // Registrar en auditoría (no bloqueante)
        try {
            await sistemaAuditoria.registrarOperacion(
                'facturas',
                facturaId,
                'UPDATE',
                { estado: factura.estado, estado_fiscal: factura.estado_fiscal },
                { estado: 'pagada', estado_fiscal: 'pagada', metodo_pago: metodoPago, referencia_operacion: referenciaOperacion, fecha_operacion: fechaPago },
                'sistema'
            );
        } catch (auditError) {
            console.warn('⚠️ Error al registrar en auditoría (no crítico):', auditError.message);
        }
        
        console.log('✅ Factura marcada como pagada:', facturaId);
        res.json({ 
            success: true, 
            message: 'Factura marcada como pagada exitosamente',
            data: {
                id: facturaId,
                estado: 'pagada',
                fecha_pago: fechaPago,
                metodo_pago: metodoPago
            }
        });
        
    } catch (error) {
        console.error('❌ Error al marcar factura como pagada:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                details: error.message
            });
        }
    }
});

// PUT - Marcar factura como pendiente (revertir pago)
app.put('/api/facturas/:id/marcar-pendiente', async (req, res) => {
    try {
        const { id } = req.params;
        const facturaId = parseInt(id, 10);
        
        // Validar ID
        if (isNaN(facturaId) || facturaId <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'ID de factura inválido',
                received: id
            });
        }
        
        // Obtener factura actual
        const factura = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ 
                success: false,
                error: 'Factura no encontrada' 
            });
        }
        
        // Actualizar factura como pendiente
        const changes = await new Promise((resolve, reject) => {
            db.run(`
                UPDATE facturas 
                SET estado = 'pendiente', 
                    estado_fiscal = 'pendiente'
                WHERE id = ?
            `, [facturaId], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                if (this.changes === 0) {
                    resolve(null);
                    return;
                }
                resolve(this.changes);
            });
        });
        
        if (changes === null) {
            return res.status(404).json({ 
                success: false,
                error: 'Factura no encontrada o no se pudo actualizar' 
            });
        }
        
        // Registrar en auditoría (no bloqueante)
        try {
            await sistemaAuditoria.registrarOperacion(
                'facturas',
                facturaId,
                'UPDATE',
                { estado: factura.estado, estado_fiscal: factura.estado_fiscal },
                { estado: 'pendiente', estado_fiscal: 'pendiente' },
                'sistema'
            );
        } catch (auditError) {
            console.warn('⚠️ Error al registrar en auditoría (no crítico):', auditError.message);
        }
        
        console.log('✅ Factura marcada como pendiente:', facturaId);
        res.json({ 
            success: true, 
            message: 'Factura marcada como pendiente exitosamente',
            data: {
                id: facturaId,
                estado: 'pendiente'
            }
        });
        
    } catch (error) {
        console.error('❌ Error al marcar factura como pendiente:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                details: error.message
            });
        }
    }
});

// GET - Verificar integridad de auditoría
app.get('/api/auditoria/verificar-integridad', async (req, res) => {
    try {
        const resultado = await sistemaAuditoria.verificarIntegridadAuditoria();
        
        res.json({
            success: true,
            data: resultado
        });
        
    } catch (error) {
        console.error('❌ Error al verificar integridad:', error);
        res.status(500).json({ error: 'Error al verificar integridad' });
    }
});

// GET - Listar backups disponibles
app.get('/api/backup/listar', (req, res) => {
    try {
        const backups = sistemaBackup.listarBackups();
        
        res.json({
            success: true,
            data: backups
        });
        
    } catch (error) {
        console.error('❌ Error al listar backups:', error);
        res.status(500).json({ error: 'Error al listar backups' });
    }
});

// POST - Realizar backup manual
app.post('/api/backup/realizar', async (req, res) => {
    try {
        const resultado = await sistemaBackup.realizarBackup();
        
        res.json({
            success: true,
            data: resultado
        });
        
    } catch (error) {
        console.error('❌ Error al realizar backup:', error);
        res.status(500).json({ error: 'Error al realizar backup' });
    }
});

// POST - Restaurar desde backup
app.post('/api/backup/restaurar', async (req, res) => {
    try {
        const { archivo } = req.body;
        
        if (!archivo) {
            return res.status(400).json({ error: 'Archivo de backup requerido' });
        }
        
        const resultado = await sistemaBackup.restaurarBackup(archivo);
        
        res.json({
            success: true,
            data: { restaurado: resultado, archivo }
        });
        
    } catch (error) {
        console.error('❌ Error al restaurar backup:', error);
        res.status(500).json({ error: 'Error al restaurar backup' });
    }
});

// GET - Verificar integridad de backup
app.get('/api/backup/verificar/:archivo', async (req, res) => {
    try {
        const { archivo } = req.params;
        const integridadValida = await sistemaBackup.verificarIntegridadBackup(
            path.join('./backups', archivo)
        );
        
        res.json({
            success: true,
            data: { 
                archivo, 
                integridad_valida: integridadValida 
            }
        });
        
    } catch (error) {
        console.error('❌ Error al verificar integridad del backup:', error);
        res.status(500).json({ error: 'Error al verificar integridad del backup' });
    }
});

// GET - Buscar cliente por identificación
app.get('/api/clientes/buscar/:identificacion', (req, res) => {
    const identificacion = req.params.identificacion;
    
    db.get('SELECT * FROM clientes WHERE identificacion = ?', [identificacion], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        
        res.json({ success: true, data: row });
    });
});

// GET - Buscar producto por código
app.get('/api/productos/buscar/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    
    db.get('SELECT * FROM productos WHERE codigo = ? AND activo = 1', [codigo], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        
        res.json({ success: true, data: row });
    });
});

// Endpoints de rendimiento y estadísticas
app.get('/api/performance/stats', (req, res) => {
    try {
        const cacheStats = cacheManager.getStats();
        const memoryUsage = process.memoryUsage();
        
        res.json({
            success: true,
            data: {
                cache: cacheStats,
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                    external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
                },
                uptime: Math.round(process.uptime()) + ' seconds',
                nodeVersion: process.version,
                platform: process.platform
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/performance/cache/clear', (req, res) => {
    try {
        const { pattern } = req.body;
        
        if (pattern) {
            const deletedCount = cacheManager.delPattern(pattern);
            res.json({ success: true, message: `Cache cleared for pattern: ${pattern}`, deletedCount });
        } else {
            cacheManager.flush();
            res.json({ success: true, message: 'All cache cleared' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Limpiar caché específico de coches
app.post('/api/coches/cache/clear', (req, res) => {
    try {
        if (global.cacheManager) {
            const deletedCount = global.cacheManager.delPattern('coches:*');
            console.log('🗑️ Caché de coches limpiado manualmente');
            res.json({ 
                success: true, 
                message: 'Caché de coches limpiado correctamente',
                deletedCount: deletedCount
            });
        } else {
            res.status(500).json({ error: 'Cache manager no disponible' });
        }
    } catch (error) {
        console.error('Error limpiando caché de coches:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/performance/cache/stats', (req, res) => {
    try {
        const stats = cacheManager.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/performance/cache/preheat', async (req, res) => {
    try {
        await preheatCache();
        res.json({ success: true, message: 'Cache preheated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para analizar rendimiento de consultas (SOLO DESARROLLO)
if (config.get('server.environment') === 'development') {
    app.post('/api/performance/analyze-query', async (req, res) => {
        try {
            const { query, params = [] } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }
            
            // Validar que la query no contenga comandos peligrosos
            const dangerousCommands = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'EXEC', 'EXECUTE'];
            const queryUpper = query.toUpperCase();
            
            if (dangerousCommands.some(cmd => queryUpper.includes(cmd))) {
                return res.status(400).json({ error: 'Query contains dangerous commands' });
            }
            
            const analysis = await paginationManager.analyzeQueryPerformance(query, params);
            res.json({ success: true, data: analysis });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// Función para configurar endpoints de seguridad después de la inicialización
function configurarEndpointsSeguridad() {
    // ========================================
    // ENDPOINTS DE SEGURIDAD Y VALIDACIÓN FISCAL
    // ========================================

    // Endpoints de autenticación
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            // Validar entrada
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username y password son requeridos'
                });
            }

            // Autenticar usuario con JWT real
            const resultado = await authService.authenticateUser(username, password, db);
            
            // Actualizar último acceso
            db.run('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?', 
                [new Date().toISOString(), resultado.user.id]);

            // Registrar evento de login exitoso
            if (sistemaLogsSeguridad) {
                await sistemaLogsSeguridad.registrarLogin(
                    resultado.user.id,
                    resultado.user.username,
                    ipAddress,
                    userAgent,
                    true
                );
            }

            res.json({
                success: true,
                data: resultado
            });
        } catch (error) {
            // Registrar intento fallido en monitoreo de seguridad
            securityMonitor.logFailedLogin(username, ipAddress, userAgent);
            
            // Registrar intento fallido
            if (sistemaLogsSeguridad) {
                await sistemaLogsSeguridad.registrarLogin(
                    null,
                    username,
                    ipAddress,
                    userAgent,
                    false
                );
            }

            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    });

    // Endpoint para refrescar token
    app.post('/api/auth/refresh', requireAuth, (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader.substring(7);
            
            const newToken = authService.refreshToken(token);
            
            res.json({
                success: true,
                data: {
                    token: newToken,
                    expiresIn: authService.parseExpiration(config.get('security.jwt.expiresIn'))
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    });

    // Endpoint para obtener información del usuario actual
    app.get('/api/auth/me', requireAuth, (req, res) => {
        res.json({
            success: true,
            data: {
                user: req.user,
                permissions: roleManager.getRolePermissions(req.user.role),
                roleInfo: roleManager.getRoleInfo(req.user.role)
            }
        });
    });

    // Endpoint para obtener roles disponibles
    app.get('/api/auth/roles', requireAuth, requireRole(['admin']), (req, res) => {
        res.json({
            success: true,
            data: roleManager.getAllRoles()
        });
    });

    // Endpoint para verificar permisos
    app.post('/api/auth/check-permission', requireAuth, (req, res) => {
        const { resource, action } = req.body;
        
        if (!resource || !action) {
            return res.status(400).json({
                success: false,
                error: 'Resource y action son requeridos'
            });
        }

        const hasPermission = roleManager.canAccess(req.user.role, resource, action);
        
        res.json({
            success: true,
            data: {
                hasPermission,
                resource,
                action,
                userRole: req.user.role
            }
        });
    });

    // Endpoint para obtener estadísticas de seguridad
    app.get('/api/security/stats', requireAuth, requireRole(['admin']), (req, res) => {
        res.json({
            success: true,
            data: securityMonitor.getStats()
        });
    });

    // Endpoint para obtener reporte de seguridad
    app.get('/api/security/report', requireAuth, requireRole(['admin']), (req, res) => {
        res.json({
            success: true,
            data: securityMonitor.generateSecurityReport()
        });
    });

    // Endpoint para obtener alertas recientes
    app.get('/api/security/alerts', requireAuth, requireRole(['admin']), (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        res.json({
            success: true,
            data: securityMonitor.getRecentAlerts(limit)
        });
    });

app.post('/api/auth/logout', sistemaControlAcceso.middlewareAutenticacion(), async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        await sistemaControlAcceso.cerrarSesion(token);
        
        // Registrar evento de logout
        await sistemaLogsSeguridad.registrarLogout(
            req.usuario.id,
            req.usuario.username,
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de cifrado
app.post('/api/cifrado/cifrar', sistemaControlAcceso.middlewareAutenticacion(), 
         sistemaControlAcceso.middlewarePermisos('facturas:crear'), async (req, res) => {
    try {
        const { datos } = req.body;
        const resultado = sistemaCifrado.cifrar(datos);
        
        // Registrar evento de cifrado
        await sistemaLogsSeguridad.registrarCifrado(
            req.usuario.id,
            req.usuario.username,
            'cifrar',
            'datos_sensibles',
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/cifrado/descifrar', sistemaControlAcceso.middlewareAutenticacion(), 
         sistemaControlAcceso.middlewarePermisos('facturas:leer'), async (req, res) => {
    try {
        const { datosCifrados } = req.body;
        const resultado = sistemaCifrado.descifrar(datosCifrados);
        
        // Registrar evento de descifrado
        await sistemaLogsSeguridad.registrarCifrado(
            req.usuario.id,
            req.usuario.username,
            'descifrar',
            'datos_sensibles',
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de validación fiscal
app.post('/api/validacion/nif', async (req, res) => {
    try {
        const { nif } = req.body;
        const resultado = sistemaValidacionFiscal.validarNIF(nif);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/cif', async (req, res) => {
    try {
        const { cif } = req.body;
        const resultado = sistemaValidacionFiscal.validarCIF(cif);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/nie', async (req, res) => {
    try {
        const { nie } = req.body;
        const resultado = sistemaValidacionFiscal.validarNIE(nie);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/identificacion', async (req, res) => {
    try {
        const { identificacion } = req.body;
        const resultado = sistemaValidacionFiscal.validarIdentificacionFiscal(identificacion);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/pais', async (req, res) => {
    try {
        const { codigo } = req.body;
        const resultado = sistemaValidacionFiscal.validarCodigoPais(codigo);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/provincia', async (req, res) => {
    try {
        const { provincia } = req.body;
        const resultado = sistemaValidacionFiscal.validarProvincia(provincia);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/cliente', async (req, res) => {
    try {
        const datos = req.body;
        const resultado = sistemaValidacionFiscal.validarDatosFiscalesCliente(datos);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/validacion/empresa', async (req, res) => {
    try {
        const datos = req.body;
        const resultado = sistemaValidacionFiscal.validarDatosFiscalesEmpresa(datos);
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de información de validación
app.get('/api/validacion/paises', (req, res) => {
    res.json({
        success: true,
        data: sistemaValidacionFiscal.obtenerPaises()
    });
});

app.get('/api/validacion/provincias', (req, res) => {
    res.json({
        success: true,
        data: sistemaValidacionFiscal.obtenerProvinciasEspana()
    });
});

app.get('/api/validacion/regimenes', (req, res) => {
    res.json({
        success: true,
        data: sistemaValidacionFiscal.obtenerRegimenesFiscales()
    });
});

// Endpoints de logs de seguridad
app.get('/api/logs-seguridad', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:leer'), async (req, res) => {
    try {
        const filtros = req.query;
        const logs = await sistemaLogsSeguridad.obtenerLogs(filtros);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/logs-seguridad/estadisticas', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:leer'), async (req, res) => {
    try {
        const { fechaDesde, fechaHasta } = req.query;
        const estadisticas = await sistemaLogsSeguridad.obtenerEstadisticas(fechaDesde, fechaHasta);
        res.json({ success: true, data: estadisticas });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/logs-seguridad/verificar-integridad', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('auditoria:verificar'), async (req, res) => {
    try {
        const resultado = await sistemaLogsSeguridad.verificarIntegridadLogs();
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoints de gestión de usuarios
app.get('/api/usuarios', sistemaControlAcceso.middlewareAutenticacion(), 
        sistemaControlAcceso.middlewarePermisos('usuarios:leer'), async (req, res) => {
    try {
        const query = 'SELECT id, username, rol, nombre, email, activo, ultimo_acceso FROM usuarios WHERE activo = 1';
        db.all(query, [], (err, rows) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }
            res.json({ success: true, data: rows });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/usuarios', sistemaControlAcceso.middlewareAutenticacion(), 
         sistemaControlAcceso.middlewarePermisos('usuarios:crear'), async (req, res) => {
    try {
        const datosUsuario = req.body;
        const resultado = await sistemaControlAcceso.crearUsuario(datosUsuario);
        
        // Registrar evento de creación de usuario
        await sistemaLogsSeguridad.registrarGestionUsuario(
            req.usuario.id,
            req.usuario.username,
            'crear',
            datosUsuario.username,
            req.ip || req.connection.remoteAddress
        );

        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

    app.get('/api/roles', (req, res) => {
        res.json({
            success: true,
            data: sistemaControlAcceso.obtenerRoles()
        });
    });

    // ========================================
    // ENDPOINTS DE FIRMA DIGITAL
    // ========================================

    // Información del certificado
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

    // Obtener firmas disponibles para asignar a una empresa específica
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

    // Verificar alertas de certificados próximos a caducar
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

    // Firmar factura específica
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

            // Actualizar factura con información de firma
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

            // Preparar datos para verificación
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
                    console.warn('⚠️ Error al parsear respuesta AEAT:', error.message);
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

    // Cargar firma específica
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

    // Generar certificado de producción
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

// Endpoint para obtener estadísticas de logs
app.get('/api/logs/stats', requireAuth, requireRole(['admin']), (req, res) => {
    try {
        const stats = logger.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de logs', { error: error.message }, 'operations');
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas de logs'
        });
    }
});

// Manejo de errores
app.use((err, req, res, next) => {
    logger.error('Error no manejado en la aplicación', { 
        error: err.message, 
        stack: err.stack,
        url: req.url,
        method: req.method
    }, 'error');
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Función para obtener IPs locales
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

// Función para configurar firewall automáticamente (Windows)
function configureFirewall(port) {
    // Verificar si la regla ya existe
    exec(`netsh advfirewall firewall show rule name="Node.js Backend - Puerto ${port}"`, (error, stdout) => {
        if (stdout && stdout.includes('Node.js Backend')) {
            logger.info(`✅ Regla del firewall ya existe para puerto ${port}`, {}, 'general');
            return;
        }
        
        // Intentar crear la regla (requiere permisos de administrador)
        const command = `netsh advfirewall firewall add rule name="Node.js Backend - Puerto ${port}" dir=in action=allow protocol=TCP localport=${port}`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Si falla, probablemente no tiene permisos de administrador
                logger.warn(`⚠️  No se pudo configurar el firewall automáticamente.`, {}, 'general');
                logger.warn(`   Ejecuta como Administrador: .\\configurar-firewall.ps1`, {}, 'general');
                logger.warn(`   O configura manualmente el puerto ${port} en el Firewall de Windows`, {}, 'general');
            } else {
                logger.info(`✅ Regla del firewall creada para puerto ${port}`, {}, 'general');
                console.log(`✅ Firewall configurado: puerto ${port} permitido`);
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
    logger.info(`📡 API disponible localmente: http://localhost:${PORT}`, {}, 'general');
    logger.info(`📋 Documentación: http://localhost:${PORT}/`, {}, 'general');
    
    // Mostrar URLs para acceso desde otros ordenadores
    if (localIPs.length > 0) {
        logger.info(`🌐 URLs para acceso desde otros ordenadores:`, {}, 'general');
        localIPs.forEach(ip => {
            logger.info(`   • http://${ip}:${PORT}`, {}, 'general');
            logger.info(`   • http://${ip}:${PORT}/api/clientes`, {}, 'general');
        });
    } else {
        logger.warn('⚠️  No se detectaron IPs de red local', {}, 'general');
    }
    
    // Programar limpieza de logs antiguos cada 24 horas
    setInterval(() => {
        logger.cleanupOldLogs(30); // Mantener logs de 30 días
    }, 24 * 60 * 60 * 1000);
    
    console.log(`🚀 Servidor HTTP ejecutándose en http://${HOST}:${PORT}`);
    console.log(`📱 Aplicación de escritorio puede conectarse desde Electron`);
    
    // Mostrar URLs en consola también
    if (localIPs.length > 0) {
        console.log(`\n🌐 URLs para acceso desde otros ordenadores:`);
        localIPs.forEach(ip => {
            console.log(`   • http://${ip}:${PORT}`);
        });
    }
    
    // Intentar configurar firewall automáticamente (solo Windows)
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
                logger.info(`🔒 Servidor HTTPS iniciado en puerto ${HTTPS_PORT}`, {}, 'general');
                
                // Configurar firewall para HTTPS
                if (process.platform === 'win32') {
                    configureFirewall(HTTPS_PORT);
                }
                
                // Mostrar URLs HTTPS
                if (localIPs.length > 0) {
                    logger.info(`🔒 URLs HTTPS para acceso desde Internet:`, {}, 'general');
                    localIPs.forEach(ip => {
                        logger.info(`   • https://${ip}:${HTTPS_PORT}`, {}, 'general');
                    });
                    console.log(`\n🔒 URLs HTTPS:`);
                    localIPs.forEach(ip => {
                        console.log(`   • https://${ip}:${HTTPS_PORT}`);
                    });
                }
                
                // Mostrar IP pública HTTPS
                try {
                    const { execSync } = require('child_process');
                    const publicIP = execSync('powershell -Command "(Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content"', { encoding: 'utf8' }).trim();
                    console.log(`   • https://${publicIP}:${HTTPS_PORT}`);
                    logger.info(`   • https://${publicIP}:${HTTPS_PORT}`, {}, 'general');
                } catch (e) {
                    console.log(`   • https://92.186.17.227:${HTTPS_PORT}`);
                    logger.info(`   • https://92.186.17.227:${HTTPS_PORT}`, {}, 'general');
                }
            }
        } catch (error) {
            logger.error('Error iniciando servidor HTTPS', { error: error.message }, 'general');
            console.error('⚠️  No se pudo iniciar servidor HTTPS, continuando solo con HTTP');
        }
    }
    
    // Configurar HTTPS para aplicación de escritorio (modo Electron)
    if (config.get('electron.electronMode')) {
        httpsManager.setupHTTPSForDesktop(app, 3443);
    }
    
    // Inicializar sistemas de rendimiento
    initPerformanceSystems();
    
    // Los módulos de Ley Antifraude se inicializan desde initDatabase()
    // No es necesario llamarlos aquí ya que initDatabase() se ejecuta antes
    // de que el servidor esté listo
});

// Configurar manejo de errores del servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
        process.exit(1);
    } else {
        console.error('❌ Error en servidor:', error);
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    const nombreEmpresa = configuracionEmpresa ? configuracionEmpresa.nombre : 'Generador de Facturas';
    res.json({ 
        message: `🚗 API del ${nombreEmpresa}`,
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

// Función para cerrar conexiones de forma segura
function gracefulShutdown() {
    console.log('🔄 Iniciando cierre graceful del servidor...');
    
    // Cerrar conexión de base de datos
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('❌ Error al cerrar base de datos:', err.message);
            } else {
                console.log('✅ Base de datos cerrada correctamente');
            }
        });
    }
    
    // Limpiar caché
    if (cacheManager) {
        cacheManager.flush();
        console.log('✅ Caché limpiado');
    }
    
    // Cerrar servidor HTTP
    if (server) {
        server.close(() => {
            console.log('✅ Servidor HTTP cerrado');
            process.exit(0);
        });
    }
}

// Manejar señales de cierre
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Para nodemon

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada no manejada:', reason);
    gracefulShutdown();
});

// Exportar la instancia de la base de datos para uso en otros módulos
module.exports = { db };
