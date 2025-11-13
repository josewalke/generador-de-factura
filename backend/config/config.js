// Sistema de Configuración Avanzado
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

class ConfigManager {
    constructor() {
        this.config = {};
        this.db = null;
        this.configPath = path.join(__dirname, 'config.json');
        this.envPath = path.join(__dirname, '..', '.env');
        this.loadEnvironmentVariables();
        this.loadDefaultConfig();
    }

    /**
     * Carga variables de entorno desde archivo .env
     */
    loadEnvironmentVariables() {
        if (fs.existsSync(this.envPath)) {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    }

    /**
     * Carga configuración por defecto
     */
    loadDefaultConfig() {
        this.config = {
            // Configuración del servidor
            server: {
                port: process.env.PORT || 3000,
                // Usar 0.0.0.0 para permitir conexiones desde otros ordenadores
                host: process.env.HOST || '0.0.0.0',
                environment: process.env.NODE_ENV || 'development',
                cors: {
                    origin: function (origin, callback) {
                        // Permitir requests sin origin (como mobile apps o curl)
                        if (!origin) return callback(null, true);
                        
                        // En producción, permitir todos los orígenes para facilitar acceso desde otros ordenadores
                        // En desarrollo, mantener lista restrictiva
                        const isProduction = process.env.NODE_ENV === 'production';
                        
                        // Permitir todos los orígenes para acceso desde Internet
                        // En producción y desarrollo, permitir cualquier origen para facilitar acceso remoto
                        // (Puedes restringir esto más tarde si es necesario para mayor seguridad)
                        callback(null, true);
                    },
                    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
                    credentials: true,
                    maxAge: 86400 // 24 horas
                }
            },
            
            // Configuración de la base de datos (PostgreSQL)
            database: {
                type: process.env.DB_TYPE || 'postgresql', // 'postgresql' o 'sqlite'
                // PostgreSQL
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || 'telwagen',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '',
                maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
                connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
                idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
                // SQLite (para compatibilidad)
                path: process.env.DB_PATH || './telwagen.db',
                timeout: parseInt(process.env.DB_TIMEOUT) || 30000,
                journalMode: process.env.DB_JOURNAL_MODE || 'WAL',
                synchronous: process.env.DB_SYNCHRONOUS || 'NORMAL',
                cacheSize: parseInt(process.env.DB_CACHE_SIZE) || 2000
            },
            
            // Configuración de seguridad
            security: {
                helmet: process.env.HELMET_ENABLED !== 'false',
                rateLimit: {
                    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutos
                    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
                    // Rate limiting más estricto para login
                    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW) || 900000, // 15 minutos
                    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5 // Solo 5 intentos por 15 minutos
                },
                jwt: {
                    secret: process.env.JWT_SECRET || (() => {
                        console.error('🚨 CRÍTICO: JWT_SECRET no configurado. Usando clave temporal.');
                        return 'temp-secret-' + Date.now();
                    })(),
                    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
                },
                encryption: {
                    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
                    key: process.env.ENCRYPTION_KEY || (() => {
                        console.error('🚨 CRÍTICO: ENCRYPTION_KEY no configurado. Usando clave temporal.');
                        return 'temp-key-' + Date.now();
                    })()
                }
            },
            
            // Configuración de logging
            logging: {
                level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'warn' : 'info'),
                format: process.env.LOG_FORMAT || 'combined',
                file: process.env.LOG_FILE || './logs/app.log',
                maxSize: process.env.LOG_MAX_SIZE || '10m',
                maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
            },
            
            // Configuración de backup
            backup: {
                enabled: process.env.BACKUP_ENABLED !== 'false',
                frequency: parseInt(process.env.BACKUP_FREQUENCY) || 86400000, // 24 horas
                retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 1460, // 4 años
                directory: process.env.BACKUP_DIRECTORY || './backups',
                compression: process.env.BACKUP_COMPRESSION !== 'false'
            },
            
            // Configuración de caché
            cache: {
                enabled: process.env.CACHE_ENABLED !== 'false',
                ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutos
                maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                    password: process.env.REDIS_PASSWORD || null
                }
            },
            
            // Configuración de paginación
            pagination: {
                defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 20,
                maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT) || 100,
                defaultOffset: parseInt(process.env.PAGINATION_DEFAULT_OFFSET) || 0
            },
            
            // Configuración de facturación
            facturacion: {
                prefijo: process.env.FACTURA_PREFIJO || 'C',
                formato: process.env.FACTURA_FORMATO || 'C{numero}/{año}',
                igic: parseFloat(process.env.IGIC_PORCENTAJE) || 9.5,
                diasVencimiento: parseInt(process.env.FACTURA_DIAS_VENCIMIENTO) || 30,
                formatoNumero: process.env.FACTURA_FORMATO_NUMERO || '000'
            },
            
            // Configuración de productos
            productos: {
                categorias: (process.env.PRODUCTOS_CATEGORIAS || 'vehiculo,servicio,accesorio,mantenimiento').split(','),
                stockMinimo: parseInt(process.env.PRODUCTOS_STOCK_MINIMO) || 0,
                stockMaximo: parseInt(process.env.PRODUCTOS_STOCK_MAXIMO) || 999,
                autoCrearDesdeCoche: process.env.PRODUCTOS_AUTO_CREAR_DESDE_COCHE !== 'false'
            },
            
            // Configuración de empresa (valores por defecto)
            empresa: {
                nombre: process.env.EMPRESA_NOMBRE || 'Empresa por defecto',
                cif: process.env.EMPRESA_CIF || 'Sin CIF',
                direccion: process.env.EMPRESA_DIRECCION || 'Dirección no configurada',
                telefono: process.env.EMPRESA_TELEFONO || 'Sin teléfono',
                email: process.env.EMPRESA_EMAIL || 'sin@email.com',
                codigoPostal: process.env.EMPRESA_CODIGO_POSTAL || '',
                provincia: process.env.EMPRESA_PROVINCIA || '',
                pais: process.env.EMPRESA_PAIS || 'España',
                codigoPais: process.env.EMPRESA_CODIGO_PAIS || 'ES',
                regimenFiscal: process.env.EMPRESA_REGIMEN_FISCAL || 'General'
            },
            
            // Configuración de firma digital
            firmaDigital: {
                enabled: process.env.FIRMA_DIGITAL_ENABLED !== 'false',
                algoritmo: process.env.FIRMA_DIGITAL_ALGORITMO || 'sha256',
                directorioCertificados: process.env.FIRMA_DIGITAL_DIR_CERTIFICADOS || './certificados',
                directorioFirmas: process.env.FIRMA_DIGITAL_DIR_FIRMAS || './firmas',
                autoDetectarWindows: process.env.FIRMA_DIGITAL_AUTO_DETECTAR !== 'false'
            },
            
            // Configuración de VeriFactu
            verifactu: {
                enabled: process.env.VERIFACTU_ENABLED !== 'false',
                url: process.env.VERIFACTU_URL || 'https://www2.agenciatributaria.gob.es/wlpl/REGD-JDIT/VeriFactu',
                timeout: parseInt(process.env.VERIFACTU_TIMEOUT) || 30000,
                retryAttempts: parseInt(process.env.VERIFACTU_RETRY_ATTEMPTS) || 3
            },
            
            // Configuración específica para Electron
            electron: {
                electronMode: process.env.ELECTRON_MODE === 'true',
                secureMode: process.env.ELECTRON_SECURE_MODE !== 'false',
                allowLocalhost: process.env.ELECTRON_ALLOW_LOCALHOST !== 'false',
                disableCorsForLocal: process.env.ELECTRON_DISABLE_CORS_FOR_LOCAL === 'true'
            }
        };
    }

    /**
     * Carga configuración desde base de datos
     */
    async loadFromDatabase() {
        return new Promise((resolve, reject) => {
            const dbPath = this.config.database.path;
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.warn('⚠️ No se pudo conectar a la BD para cargar configuración');
                    resolve(this.config);
                    return;
                }
                
                // Cargar configuración de empresa
                this.db.get("SELECT * FROM empresas ORDER BY id LIMIT 1", (err, row) => {
                    if (err || !row) {
                        console.warn('⚠️ No se encontró empresa en la BD');
                        resolve(this.config);
                    } else {
                        // Actualizar configuración con datos reales
                        this.config.empresa = {
                            ...this.config.empresa,
                            nombre: row.nombre || this.config.empresa.nombre,
                            cif: row.cif || this.config.empresa.cif,
                            direccion: row.direccion || this.config.empresa.direccion,
                            telefono: row.telefono || this.config.empresa.telefono,
                            email: row.email || this.config.empresa.email,
                            codigoPostal: row.codigo_postal || this.config.empresa.codigoPostal,
                            provincia: row.provincia || this.config.empresa.provincia,
                            pais: row.pais || this.config.empresa.pais,
                            codigoPais: row.codigo_pais || this.config.empresa.codigoPais,
                            regimenFiscal: row.regimen_fiscal || this.config.empresa.regimenFiscal
                        };
                        console.log('✅ Configuración de empresa cargada desde BD:', this.config.empresa.nombre);
                        resolve(this.config);
                    }
                });
            });
        });
    }

    /**
     * Guarda configuración en archivo JSON
     */
    saveToFile() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log('✅ Configuración guardada en archivo');
        } catch (error) {
            console.error('❌ Error al guardar configuración:', error);
        }
    }

    /**
     * Carga configuración desde archivo JSON
     */
    loadFromFile() {
        try {
            if (fs.existsSync(this.configPath)) {
                const fileContent = fs.readFileSync(this.configPath, 'utf8');
                const fileConfig = JSON.parse(fileContent);
                this.config = { ...this.config, ...fileConfig };
                console.log('✅ Configuración cargada desde archivo');
            }
        } catch (error) {
            console.error('❌ Error al cargar configuración desde archivo:', error);
        }
    }

    /**
     * Obtiene un valor de configuración
     */
    get(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.config);
    }

    /**
     * Establece un valor de configuración
     */
    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => {
            if (!obj[k]) obj[k] = {};
            return obj[k];
        }, this.config);
        target[lastKey] = value;
    }

    /**
     * Obtiene toda la configuración
     */
    getAll() {
        return this.config;
    }

    /**
     * Valida la configuración
     */
    validate() {
        const errors = [];
        
        // Validar puerto
        if (this.config.server.port < 1 || this.config.server.port > 65535) {
            errors.push('Puerto del servidor debe estar entre 1 y 65535');
        }
        
        // Validar IGIC
        if (this.config.facturacion.igic < 0 || this.config.facturacion.igic > 100) {
            errors.push('IGIC debe estar entre 0 y 100');
        }
        
        // Validar días de vencimiento
        if (this.config.facturacion.diasVencimiento < 1) {
            errors.push('Días de vencimiento debe ser mayor a 0');
        }
        
        // Validar límites de paginación
        if (this.config.pagination.defaultLimit < 1) {
            errors.push('Límite de paginación debe ser mayor a 0');
        }
        
        if (this.config.pagination.maxLimit < this.config.pagination.defaultLimit) {
            errors.push('Límite máximo debe ser mayor o igual al límite por defecto');
        }
        
        return errors;
    }

    /**
     * Cierra la conexión a la base de datos
     */
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Crear instancia singleton
const configManager = new ConfigManager();

module.exports = configManager;
