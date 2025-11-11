const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const { DatabaseCacheManager } = require('./modules/sistemaCache');
const PaginationManager = require('./modules/sistemaPaginacion');
const { LoggerFactory } = require('./modules/sistemaLogging');
const ImportadorExcel = require('./modules/importadorExcel');

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
        setImmediate(async () => {
            await preheatCache();
        });
        
    } catch (error) {
        logger.error('Error inicializando sistemas de rendimiento', { error: error.message });
    }
}

// Precalentar caché con datos frecuentes
async function preheatCache() {
    const fetchFunctions = {
        'empresas:all': () => new Promise((resolve, reject) => {
            db.all('SELECT * FROM empresas ORDER BY nombre', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        'productos:all': () => new Promise((resolve, reject) => {
            db.all('SELECT * FROM productos WHERE activo = 1 ORDER BY descripcion', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        'clientes:count': () => new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM clientes', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        }),
        'facturas:count': () => new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM facturas', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        })
    };
    
    await cacheManager.preheat(fetchFunctions);
    logger.systemEvent('Caché precalentado con datos frecuentes');
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
const HOST = config.get('server.host');

// Inicializar servicios de seguridad
const authService = new AuthService();
const httpsManager = new HTTPSManager();
const roleManager = new RoleManager();
const securityMonitor = new SecurityMonitor();

// Middleware de autenticación para endpoints protegidos
const requireAuth = (req, res, next) => {
    authService.authMiddleware(req, res, next);
};

const requireRole = (roles) => {
    return authService.requireRole(roles);
};

// Middleware de seguridad
if (config.get('security.helmet')) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false
    }));
}

// Rate limiting
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

// Middleware de logging optimizado con monitoreo de seguridad
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.apiRequest(req.method, req.url, res.statusCode, duration);
        
        // Registrar en monitoreo de seguridad
        securityMonitor.logHTTPRequest(req, duration, res.statusCode);
        
        // Detectar códigos de error
        if (res.statusCode >= 400) {
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
const dbPath = config.get('database.path');
db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        logger.error('Error al conectar con la base de datos', { error: err.message });
    } else {
        logger.systemEvent('Base de datos conectada exitosamente');
        
        // Configurar la base de datos para mejor manejo de concurrencia y memoria
        db.run(`PRAGMA busy_timeout = ${config.get('database.timeout')}`);
        db.run(`PRAGMA journal_mode = ${config.get('database.journalMode')}`);
        db.run(`PRAGMA synchronous = ${config.get('database.synchronous')}`);
        db.run(`PRAGMA cache_size = ${config.get('database.cacheSize')}`);
        db.run(`PRAGMA temp_store = memory`); // Usar memoria para tablas temporales
        db.run(`PRAGMA mmap_size = 268435456`); // 256MB de memoria mapeada
        db.run(`PRAGMA optimize`); // Optimizar automáticamente
        
        initDatabase();
    }
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
                        console.log(`⚠️ Base de datos ocupada, reintentando... (${intentos}/${maxReintentos})`);
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

// Función para inicializar módulos después de la base de datos
function initModulosAntifraude() {
    try {
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
        sistemaFirmaDigital = new SistemaFirmaDigital();
        
        // Inicializar sistemas que requieren base de datos
        sistemaControlAcceso.inicializar();
        sistemaLogsSeguridad.inicializar();
        
        // Iniciar backup automático de forma asíncrona (no bloquea el arranque)
        setImmediate(() => {
        sistemaBackup.iniciarBackupAutomatico();
        });
        
        console.log('✅ Módulos de Ley Antifraude inicializados correctamente');
        console.log('🔒 Sistema de cifrado activado');
        console.log('🛡️ Sistema de control de acceso activado');
        console.log('📋 Sistema de logs de seguridad activado');
        console.log('✅ Sistema de validación fiscal activado');
        console.log('🔐 Sistema de firma digital activado');
        console.log('💾 Sistema de backup automático activado');
        
        // Configurar endpoints de seguridad después de la inicialización
        configurarEndpointsSeguridad();
    } catch (error) {
        console.error('❌ Error al inicializar módulos de Ley Antifraude:', error);
    }
}

// Inicializar tablas
function initDatabase() {
    logger.systemEvent('Inicializando base de datos');
    
    // Crear tablas secuencialmente
    db.serialize(() => {
        // Tabla de clientes
        db.run(`
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
        `, (err) => {
            if (err) {
                logger.error('Error al crear tabla clientes', { error: err.message });
            } else {
                logger.debug('Tabla clientes creada/verificada');
                // Añadir columna codigo_postal si no existe
                db.run('ALTER TABLE clientes ADD COLUMN codigo_postal TEXT', (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        logger.error('Error al añadir columna codigo_postal', { error: err.message });
                    }
                });
            }
        });

        // Tabla de empresas
        db.run(`
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
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla empresas:', err.message);
            } else {
                console.log('✅ Tabla empresas creada/verificada');
            }
        });

        // Tabla de usuarios para autenticación
        db.run(`
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
        `, (err) => {
            if (err) {
                logger.error('Error al crear tabla usuarios', { error: err.message });
            } else {
                logger.debug('Tabla usuarios creada/verificada');
                
                // Crear usuario por defecto para aplicación de escritorio
                setImmediate(async () => {
                    try {
                        await authService.createDefaultUser(db);
                    } catch (error) {
                        logger.error('Error creando usuario por defecto', { error: error.message });
                    }
                });
            }
        });

        // Tabla de coches
        db.run(`
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
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla coches:', err.message);
            } else {
                console.log('✅ Tabla coches creada/verificada');
            }
        });

        // Tabla de productos/vehículos
        db.run(`
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
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla productos:', err.message);
            } else {
                console.log('✅ Tabla productos creada/verificada');
                
                // Agregar columna codigo si no existe
                db.run('ALTER TABLE productos ADD COLUMN codigo TEXT', (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('❌ Error al agregar columna codigo:', err.message);
                    } else if (!err) {
                        console.log('✅ Columna codigo agregada a productos');
                    }
                });
            }
        });

        // Tabla de facturas
        db.run(`
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
                FOREIGN KEY (empresa_id) REFERENCES empresas (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                UNIQUE(numero_factura, empresa_id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla facturas:', err.message);
            } else {
                console.log('✅ Tabla facturas creada/verificada');
            }
        });

        // Tabla de detalles de factura
        db.run(`
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
        `, (err) => {
            if (err) {
                console.error('❌ Error al crear tabla detalles_factura:', err.message);
            } else {
                console.log('✅ Tabla detalles_factura creada/verificada');
                
                // Agregar columna descripcion si no existe (migración)
                db.run(`ALTER TABLE detalles_factura ADD COLUMN descripcion TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('❌ Error al agregar columna descripcion:', err.message);
                    } else if (!err) {
                        console.log('✅ Columna descripcion agregada a detalles_factura');
                    }
                });
                
                // Agregar columna tipo_impuesto si no existe (migración)
                db.run(`ALTER TABLE detalles_factura ADD COLUMN tipo_impuesto TEXT DEFAULT 'igic'`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('❌ Error al agregar columna tipo_impuesto:', err.message);
                    } else if (!err) {
                        console.log('✅ Columna tipo_impuesto agregada a detalles_factura');
                    }
        });

        // Tabla de auditoría (para cumplir con Ley Antifraude)
        db.run(`
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
        `, (err) => {
            if (err) {
                logger.error('Error al crear tabla audit_log', { error: err.message });
            } else {
                logger.debug('Tabla audit_log creada/verificada');
            }
        });

        // Insertar datos de ejemplo después de crear todas las tablas
        insertSampleData();
        
        // Crear índices optimizados después de que todas las tablas estén listas
        if (paginationManager) {
            paginationManager.createPaginationIndexes().then(() => {
                console.log('✅ Índices de paginación creados');
            }).catch((error) => {
                console.error('❌ Error creando índices de paginación:', error);
            });
        }
                
                // Inicializar módulos de Ley Antifraude
                initModulosAntifraude();
                
                // Inicializar sistemas de rendimiento
                initPerformanceSystems();
            }
        });
    });
}

// Insertar datos de ejemplo de forma silenciosa
function insertSampleData() {
    // Insertar empresa Telwagen
    db.run(`
        INSERT OR IGNORE INTO empresas (nombre, cif, direccion, telefono, email)
        VALUES (?, ?, ?, ?, ?)
    `, [
        'Telwagen Car Ibérica, S.L.',
        'B-93.289.585',
        'C. / Tomás Miller N° 48 Local\n35007 Las Palmas de Gran Canaria',
        '+34 928 123 456',
        'info@telwagen.es'
    ]);

    // Insertar cliente de ejemplo
    db.run(`
        INSERT OR IGNORE INTO clientes (nombre, direccion, identificacion, email, telefono)
        VALUES (?, ?, ?, ?, ?)
    `, [
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

    cochesEjemplo.forEach(coche => {
        db.run(`
            INSERT OR IGNORE INTO coches (matricula, chasis, color, kms, modelo)
            VALUES (?, ?, ?, ?, ?)
        `, [coche.matricula, coche.chasis, coche.color, coche.kms, coche.modelo]);
    });

    // Insertar productos de ejemplo (solo algunos)
    const productosEjemplo = [
        { codigo: 'NISSAN-MICRA-1.0', descripcion: 'Nissan Micra 1.0', precio: 15000 },
        { codigo: 'NISSAN-QASHQAI-1.3', descripcion: 'Nissan Qashqai 1.3', precio: 25000 },
        { codigo: 'NISSAN-LEAF-40KWH', descripcion: 'Nissan Leaf 40kWh', precio: 35000 }
    ];

    productosEjemplo.forEach(producto => {
        db.run(`
            INSERT OR IGNORE INTO productos (codigo, descripcion, precio, stock)
            VALUES (?, ?, ?, ?)
        `, [producto.codigo, producto.descripcion, producto.precio, 10]);
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
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ningún archivo'
            });
        }

        const resultado = await importadorExcel.importarCoches(req.file.path);
        
        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);
        
        res.json(resultado);
    } catch (error) {
        logger.error('Error importando coches desde Excel', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST - Importar productos desde Excel
app.post('/api/importar/productos', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ningún archivo'
            });
        }

        const resultado = await importadorExcel.importarProductos(req.file.path);
        
        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);
        
        res.json(resultado);
    } catch (error) {
        logger.error('Error importando productos desde Excel', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST - Importar clientes desde Excel
app.post('/api/importar/clientes', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ningún archivo'
            });
        }

        const resultado = await importadorExcel.importarClientes(req.file.path);
        
        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);
        
        res.json(resultado);
    } catch (error) {
        logger.error('Error importando clientes desde Excel', { error: error.message });
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
        const { nombre, cif, direccion, telefono, email, firmaDigitalThumbprint } = req.body;
        
        // Actualizar datos básicos de la empresa
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE empresas 
                SET nombre = ?, cif = ?, direccion = ?, telefono = ?, email = ?, certificado_thumbprint = ?
                WHERE id = ?
            `, [nombre, cif, direccion, telefono, email, firmaDigitalThumbprint || null, id], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Empresa no encontrada'));
                } else {
                    resolve();
                }
            });
        });
        
        // Si se especifica una firma digital, asociarla con la empresa
        if (firmaDigitalThumbprint) {
            try {
                const resultadoAsociacion = await sistemaFirmaDigital.asociarCertificadoConEmpresa(id, firmaDigitalThumbprint);
                
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
            db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, row) => {
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
    console.log('🔍 [GET /api/clientes] Iniciando consulta...');
    
    db.all('SELECT * FROM clientes ORDER BY fecha_creacion DESC', (err, rows) => {
        if (err) {
            console.error('❌ [GET /api/clientes] Error en consulta:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        
        console.log(`✅ [GET /api/clientes] Consulta exitosa. Filas encontradas: ${rows.length}`);
        rows.forEach((cliente, index) => {
            console.log(`   ${index + 1}. ID: ${cliente.id}, Nombre: ${cliente.nombre}`);
        });
        
        res.json({ success: true, data: rows });
    });
});

// POST - Crear nuevo cliente
app.post('/api/clientes', (req, res) => {
    console.log('POST /api/clientes - Body recibido:', req.body);
    const { nombre, direccion, codigo_postal, identificacion, email, telefono } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !direccion || !identificacion) {
        console.log('Error: Campos obligatorios faltantes:', { nombre, direccion, identificacion });
        return res.status(400).json({ 
            error: 'Campos obligatorios faltantes: nombre, direccion, identificacion' 
        });
    }
    
    console.log('Insertando cliente con datos:', { nombre, direccion, codigo_postal, identificacion, email, telefono });
    
    db.run(`
        INSERT INTO clientes (nombre, direccion, codigo_postal, identificacion, email, telefono)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, direccion, codigo_postal, identificacion, email, telefono], function(err) {
        if (err) {
            console.log('Error en la base de datos:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Cliente creado exitosamente con ID:', this.lastID);
        res.json({ 
            success: true, 
            data: { 
                id: this.lastID, 
                nombre, 
                direccion, 
                codigo_postal,
                identificacion, 
                email, 
                telefono 
            } 
        });
    });
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
    const { id } = req.params;
    const { nombre, direccion, codigo_postal, identificacion, email, telefono } = req.body;
    
    db.run(`
        UPDATE clientes 
        SET nombre = ?, direccion = ?, codigo_postal = ?, identificacion = ?, email = ?, telefono = ?
        WHERE id = ?
    `, [nombre, direccion, codigo_postal, identificacion, email, telefono, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        
        // Obtener el cliente actualizado para devolverlo
        db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Error obteniendo cliente actualizado:', err.message);
                return res.json({ success: true, message: 'Cliente actualizado correctamente' });
            }
            
            res.json({ 
                success: true, 
                message: 'Cliente actualizado correctamente',
                data: row
            });
        });
    });
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
                               cl.nombre as cliente_nombre
                        FROM coches c
                        LEFT JOIN detalles_factura df ON (df.descripcion LIKE '%' || c.matricula || '%')
                        LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                        LEFT JOIN clientes cl ON f.cliente_id = cl.id
                        WHERE c.activo = 1 
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
                   cl.nombre as cliente_nombre
            FROM coches c
            LEFT JOIN detalles_factura df ON (df.descripcion LIKE '%' || c.matricula || '%')
            LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
            LEFT JOIN clientes cl ON f.cliente_id = cl.id
            WHERE c.activo = 1 
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
    db.all(`
        SELECT c.*,
               0 as vendido,
               NULL as numero_factura,
               NULL as fecha_venta,
               NULL as precio_venta,
               NULL as cliente_nombre
        FROM coches c
        LEFT JOIN detalles_factura df ON (df.descripcion LIKE '%' || c.matricula || '%')
        LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
        WHERE c.activo = 1 AND f.id IS NULL
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
    db.all(`
        SELECT c.*,
               1 as vendido,
               f.numero_factura,
               f.fecha_emision as fecha_venta,
               f.total as precio_venta,
               cl.nombre as cliente_nombre
        FROM coches c
        LEFT JOIN detalles_factura df ON (df.descripcion LIKE '%' || c.matricula || '%')
        LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
        LEFT JOIN clientes cl ON f.cliente_id = cl.id
        WHERE c.activo = 1 AND f.id IS NOT NULL
        ORDER BY f.fecha_creacion DESC
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
    db.all(`
        SELECT c.*, 
               CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as tiene_producto,
               p.precio as precio_producto,
               p.codigo as codigo_producto
        FROM coches c
        LEFT JOIN productos p ON c.matricula = p.codigo
        WHERE c.activo = 1 
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
    
    db.get('SELECT * FROM coches WHERE id = ? AND activo = 1', [id], (err, row) => {
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
    try {
        console.log('🔍 [POST /api/coches] Datos recibidos:', req.body);
        
        const { matricula, chasis, color, kms, modelo } = req.body;
        
        // Validar datos requeridos
        if (!matricula || !chasis || !color || kms === undefined || kms === null || !modelo) {
            console.log('❌ [POST /api/coches] Datos faltantes:', { matricula, chasis, color, kms, modelo });
            return res.status(400).json({ 
                error: 'Faltan datos requeridos',
                required: ['matricula', 'chasis', 'color', 'kms', 'modelo'],
                received: { matricula, chasis, color, kms, modelo }
            });
        }
        
        console.log('🔍 [POST /api/coches] Ejecutando INSERT con datos:', [matricula, chasis, color, kms, modelo]);
        
        // Insertar directamente sin verificar duplicados
        db.run(`
            INSERT INTO coches (matricula, chasis, color, kms, modelo)
            VALUES (?, ?, ?, ?, ?)
        `, [matricula, chasis, color, kms, modelo], function(err) {
            if (err) {
                console.error('❌ [POST /api/coches] Error en INSERT:', err.message);
                console.error('❌ [POST /api/coches] Error completo:', err);
                
                return res.status(500).json({ 
                    error: 'Error interno del servidor',
                    details: err.message,
                    code: err.code
                });
            }
            
            console.log('✅ [POST /api/coches] Coche creado exitosamente con ID:', this.lastID);
            
            // Invalidar caché de coches
            if (global.cacheManager) {
                global.cacheManager.invalidatePattern('coches:*');
                console.log('🗑️ [POST /api/coches] Caché de coches invalidado');
            }
            
            res.json({ 
                success: true, 
                data: { 
                    id: this.lastID, 
                    matricula, 
                    chasis, 
                    color, 
                    kms, 
                    modelo 
                } 
            });
        });
    } catch (error) {
        console.error('❌ [POST /api/coches] Error inesperado:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// PUT - Actualizar coche
app.put('/api/coches/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { matricula, chasis, color, kms, modelo } = req.body;
        
        console.log('🔍 [PUT /api/coches/:id] Actualizando coche ID:', id);
        console.log('🔍 [PUT /api/coches/:id] Datos recibidos:', req.body);
        
        // Validar que al menos un campo esté presente
        if (!matricula && !chasis && !color && kms === undefined && !modelo) {
            return res.status(400).json({ 
                error: 'Al menos un campo debe ser proporcionado para actualizar',
                received: { matricula, chasis, color, kms, modelo }
            });
        }
        
        // Si se está actualizando la matrícula, verificar que no esté duplicada
        if (matricula) {
            db.get('SELECT id FROM coches WHERE matricula = ? AND id != ? AND activo = 1', [matricula, id], (err, row) => {
                if (err) {
                    console.error('❌ [PUT /api/coches/:id] Error verificando matrícula:', err.message);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }
                
                if (row) {
                    console.log('❌ [PUT /api/coches/:id] Matrícula duplicada:', matricula);
                    return res.status(409).json({ 
                        error: 'La matrícula ya existe',
                        message: `Ya existe otro coche con la matrícula: ${matricula}`,
                        code: 'DUPLICATE_MATRICULA',
                        field: 'matricula'
                    });
                }
                
                // Continuar con la actualización
                performUpdate();
            });
        } else {
            // Si no se actualiza la matrícula, proceder directamente
            performUpdate();
        }
        
        function performUpdate() {
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
            if (modelo !== undefined) {
                updates.push('modelo = ?');
                values.push(modelo);
            }
            
            values.push(id); // ID al final para el WHERE
            
            const query = `UPDATE coches SET ${updates.join(', ')} WHERE id = ? AND activo = 1`;
            
            console.log('🔍 [PUT /api/coches/:id] Query:', query);
            console.log('🔍 [PUT /api/coches/:id] Values:', values);
            
            db.run(query, values, function(err) {
                if (err) {
                    console.error('❌ [PUT /api/coches/:id] Error en UPDATE:', err.message);
                    console.error('❌ [PUT /api/coches/:id] Error completo:', err);
                    return res.status(500).json({ 
                        error: 'Error interno del servidor',
                        details: err.message,
                        code: err.code
                    });
                }
                
                if (this.changes === 0) {
                    console.log('❌ [PUT /api/coches/:id] Coche no encontrado o inactivo:', id);
                    return res.status(404).json({ error: 'Coche no encontrado o inactivo' });
                }
                
                console.log('✅ [PUT /api/coches/:id] Coche actualizado exitosamente:', id);
                
                // Invalidar caché de coches
                if (global.cacheManager) {
                    global.cacheManager.invalidatePattern('coches:*');
                    console.log('🗑️ [PUT /api/coches/:id] Caché de coches invalidado');
                }
                
                // Obtener el coche actualizado para devolverlo
                db.get('SELECT * FROM coches WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        console.error('❌ [PUT /api/coches/:id] Error obteniendo coche actualizado:', err.message);
                        return res.json({ success: true, message: 'Coche actualizado correctamente' });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Coche actualizado correctamente',
                        data: row
                    });
                });
            });
        }
        
    } catch (error) {
        console.error('❌ [PUT /api/coches/:id] Error inesperado:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// DELETE - Desactivar coche (soft delete)
app.delete('/api/coches/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('UPDATE coches SET activo = 0 WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        
        // Invalidar caché de coches
        if (global.cacheManager) {
            global.cacheManager.invalidatePattern('coches:*');
            console.log('🗑️ [DELETE /api/coches/:id] Caché de coches invalidado');
        }
        
        res.json({ success: true, message: 'Coche desactivado correctamente' });
    });
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
    const { codigo, descripcion, precio, stock, categoria } = req.body;
    
    db.run(`
        INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
        VALUES (?, ?, ?, ?, ?)
    `, [codigo, descripcion, precio, stock, categoria], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            success: true, 
            data: { 
                id: this.lastID, 
                codigo, 
                descripcion, 
                precio, 
                stock, 
                categoria 
            } 
        });
    });
});

// POST - Crear producto desde coche
app.post('/api/productos/desde-coche', (req, res) => {
    const { coche_id, precio, cantidad = 1 } = req.body;
    
    // Primero obtener los datos del coche
    db.get('SELECT * FROM coches WHERE id = ? AND activo = 1', [coche_id], (err, coche) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!coche) {
            res.status(404).json({ error: 'Coche no encontrado' });
            return;
        }
        
        // Generar código único basado en la matrícula
        const codigo = `COCHE-${coche.matricula.replace(/[^A-Z0-9]/g, '')}`;
        
        // Generar descripción automática
        const descripcion = `${coche.modelo} - ${coche.color} - ${coche.kms.toLocaleString()} km - Chasis: ${coche.chasis}`;
        
        // Crear el producto
        db.run(`
            INSERT INTO productos (codigo, descripcion, precio, stock, categoria)
            VALUES (?, ?, ?, ?, ?)
        `, [codigo, descripcion, precio, cantidad, 'vehiculo'], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ 
                success: true, 
                data: { 
                    id: this.lastID, 
                    codigo, 
                    descripcion, 
                    precio, 
                    stock: cantidad, 
                    categoria: 'vehiculo',
                    coche: coche
                } 
            });
        });
    });
});

// GET - Obtener todas las facturas (con paginación y caché)
app.get('/api/facturas', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', empresa_id = '', cliente_id = '', fecha_desde = '', fecha_hasta = '' } = req.query;
        
        // Usar caché si está disponible
        const cacheKey = `facturas:page:${page}:limit:${limit}:search:${search}:empresa:${empresa_id}:cliente:${cliente_id}:fecha_desde:${fecha_desde}:fecha_hasta:${fecha_hasta}`;
        const cachedResult = cacheManager.get(cacheKey);
        
        if (cachedResult) {
            return res.json({ success: true, data: cachedResult.data, pagination: cachedResult.pagination, cached: true });
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
            select: 'f.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion, e.nombre as empresa_nombre, e.cif as empresa_cif, e.direccion as empresa_direccion'
        });
        
        // Guardar en caché
        cacheManager.set(cacheKey, result, 180); // 3 minutos TTL
        
        res.json({ success: true, data: result.data, pagination: result.pagination, cached: false });
        
    } catch (error) {
        console.error('❌ Error al obtener facturas:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Crear nueva factura (Cumpliendo Ley Antifraude)
app.post('/api/facturas', async (req, res) => {
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
        
        // ==================== VALIDACIONES ESTRICTAS ====================
        
        // 1. Validar empresa_id ANTES de cualquier procesamiento
        if (!empresa_id || empresa_id === null || empresa_id === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'empresa_id es obligatorio para crear una factura' 
            });
        }
        
        // 2. Verificar que la empresa existe
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
        
        console.log(`✅ Validaciones pasadas - Creando factura para empresa: ${empresaExiste.nombre} (ID: ${empresa_id})`);
        
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
        const query = `
            INSERT INTO facturas (
                numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
                subtotal, igic, total, notas, numero_serie, fecha_operacion,
                tipo_documento, metodo_pago, referencia_operacion, hash_documento,
                sellado_temporal, estado_fiscal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            numero_factura, empresaIdValido, cliente_id, fecha_emision, fecha_vencimiento,
            subtotal, igic, total, notas, numero_serie, fecha_operacion || fecha_emision,
            tipo_documento, metodo_pago, referencia_operacion || '', hash_documento,
            selladoTemporal.timestamp, 'pendiente'
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
                        
                        await new Promise((resolve, reject) => {
                            // Aceptar tanto camelCase como snake_case para compatibilidad
                            const precioUnitario = producto.precio_unitario || producto.precioUnitario || producto.precio || 0;
                            const igic = producto.igic !== undefined ? producto.igic : (producto.impuesto !== undefined ? producto.impuesto : 0);
                            const tipoImpuesto = producto.tipo_impuesto || producto.tipoImpuesto || 'igic';
                            
                            db.run(`
                                INSERT INTO detalles_factura (factura_id, producto_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [facturaId, productoId, producto.cantidad || 1, precioUnitario, producto.subtotal || precioUnitario, igic, producto.total || (precioUnitario + igic), producto.descripcion || null, tipoImpuesto], function(err) {
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
                        if (producto.descripcion && producto.descripcion.includes(' - ')) {
                            // Extraer matrícula de la descripción (formato: "Modelo - MATRÍCULA - Color")
                            const partes = producto.descripcion.split(' - ');
                            if (partes.length >= 2) {
                                const matricula = partes[1].trim();
                                
                                // Verificar si es una matrícula válida (contiene números y letras)
                                if (/[A-Z0-9]/.test(matricula)) {
                                    console.log(`🔍 Marcando coche como vendido: ${matricula}`);
                                    
                                    // Marcar coche como vendido
                                    await new Promise((resolve, reject) => {
                                        db.run(`
                                            UPDATE coches 
                                            SET activo = 0 
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
                                    await new Promise((resolve, reject) => {
                                        db.run(`
                                            UPDATE productos 
                                            SET activo = 0 
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
                
                // Generar código VeriFactu
                const codigoVeriFactu = sistemaIntegridad.generarCodigoVeriFactu(datosCompletosFactura);
                
                // Actualizar factura con código VeriFactu
                db.run('UPDATE facturas SET codigo_verifactu = ? WHERE id = ?', [codigoVeriFactu, facturaId]);
                
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
                    db.run('UPDATE facturas SET respuesta_aeat = ? WHERE id = ?', 
                        [JSON.stringify({ firma_digital: firmaDigital.firma, archivo_firma: firmaDigital.archivo }), facturaId]);
                    
                    console.log('🔐 Factura firmada digitalmente:', firmaDigital.archivo);
                } else {
                    console.log('⚠️ No se pudo firmar la factura:', resultadoFirma.error);
                }
                
                console.log('✅ Factura creada con cumplimiento de Ley Antifraude:', facturaId);
                
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
                console.error('❌ Error en proceso de creación de factura:', error);
                console.error('❌ Stack trace:', error.stack);
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
            LEFT JOIN coches c ON (COALESCE(df.descripcion, p.descripcion) LIKE '%' || c.matricula || '%')
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
        const facturaId = req.params.id;
        const { metodo_pago, referencia_operacion, fecha_pago } = req.body;
        
        // Obtener factura actual
        const factura = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        // Actualizar factura como pagada
        const fechaPago = fecha_pago || new Date().toISOString().split('T')[0];
        const metodoPago = metodo_pago || 'transferencia';
        const referenciaOperacion = referencia_operacion || '';
        
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
                console.error('❌ Error al marcar factura como pagada:', err.message);
                res.status(500).json({ error: 'Error al actualizar la factura' });
                return;
            }
            
            // Registrar en auditoría
            sistemaAuditoria.registrarOperacion(
                'facturas',
                facturaId,
                'UPDATE',
                { estado: factura.estado, estado_fiscal: factura.estado_fiscal },
                { estado: 'pagada', estado_fiscal: 'pagada', metodo_pago: metodoPago, referencia_operacion: referenciaOperacion, fecha_operacion: fechaPago },
                'sistema'
            );
            
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
        });
        
    } catch (error) {
        console.error('❌ Error al marcar factura como pagada:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT - Marcar factura como pendiente (revertir pago)
app.put('/api/facturas/:id/marcar-pendiente', async (req, res) => {
    try {
        const facturaId = req.params.id;
        
        // Obtener factura actual
        const factura = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM facturas WHERE id = ?', [facturaId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        
        // Actualizar factura como pendiente
        db.run(`
            UPDATE facturas 
            SET estado = 'pendiente', 
                estado_fiscal = 'pendiente'
            WHERE id = ?
        `, [facturaId], function(err) {
            if (err) {
                console.error('❌ Error al marcar factura como pendiente:', err.message);
                res.status(500).json({ error: 'Error al actualizar la factura' });
                return;
            }
            
            // Registrar en auditoría
            sistemaAuditoria.registrarOperacion(
                'facturas',
                facturaId,
                'UPDATE',
                { estado: factura.estado, estado_fiscal: factura.estado_fiscal },
                { estado: 'pendiente', estado_fiscal: 'pendiente' },
                'sistema'
            );
            
            console.log('✅ Factura marcada como pendiente:', facturaId);
            res.json({ 
                success: true, 
                message: 'Factura marcada como pendiente exitosamente',
                data: {
                    id: facturaId,
                    estado: 'pendiente'
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error al marcar factura como pendiente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor HTTP
const server = app.listen(PORT, () => {
    logger.systemEvent('Servidor backend iniciado', { 
        port: PORT, 
        host: HOST,
        environment: config.get('server.environment')
    });
    logger.info(`📡 API disponible en: http://localhost:${PORT}`);
    logger.info(`📋 Documentación: http://localhost:${PORT}/`);
    
    console.log(`🚀 Servidor HTTP ejecutándose en http://${HOST}:${PORT}`);
    console.log(`📱 Aplicación de escritorio puede conectarse desde Electron`);
    
    // Configurar HTTPS para aplicación de escritorio
    if (config.get('electron.electronMode')) {
        httpsManager.setupHTTPSForDesktop(app, 3443);
    }
    
    // Inicializar sistemas de rendimiento
    initPerformanceSystems();
    
    // Inicializar módulos de Ley Antifraude
    initModulosAntifraude();
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
