// Configuración del Backend
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Función para cargar configuración de empresa desde la base de datos
function cargarConfiguracionEmpresa() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, 'database', 'telwagen.db');
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.warn('⚠️ No se pudo conectar a la BD para cargar configuración de empresa');
                resolve(config.empresa); // Usar valores por defecto
                return;
            }
            
            db.get("SELECT * FROM empresas ORDER BY id LIMIT 1", (err, row) => {
                db.close();
                if (err || !row) {
                    console.warn('⚠️ No se encontró empresa en la BD, usando valores por defecto');
                    resolve(config.empresa);
                } else {
                    // Actualizar configuración con datos reales
                    config.empresa = {
                        nombre: row.nombre || 'Empresa por defecto',
                        cif: row.cif || 'Sin CIF',
                        direccion: row.direccion || 'Dirección no configurada',
                        telefono: row.telefono || 'Sin teléfono',
                        email: row.email || 'sin@email.com'
                    };
                    console.log('✅ Configuración de empresa cargada desde BD:', config.empresa.nombre);
                    resolve(config.empresa);
                }
            });
        });
    });
}

const config = {
    // Configuración del servidor
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },
    
    // Configuración de la base de datos
    database: {
        path: './database/telwagen.db',
        timeout: 30000
    },
    
    // Configuración de CORS
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    
    // Configuración de logging
    logging: {
        level: process.env.LOG_LEVEL || 'combined',
        format: 'combined'
    },
    
    // Configuración de seguridad
    security: {
        helmet: true,
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100 // máximo 100 requests por ventana
        }
    },
    
    // Configuración de la empresa (valores por defecto - se sobrescriben con datos de BD)
    empresa: {
        nombre: 'Empresa por defecto',
        cif: 'Sin CIF',
        direccion: 'Dirección no configurada',
        telefono: 'Sin teléfono',
        email: 'sin@email.com'
    },
    
    // Configuración de facturación
    facturacion: {
        prefijo: 'C',
        formato: 'C{numero}/{año}',
        igic: 9.5, // Porcentaje IGIC por defecto
        diasVencimiento: 30 // Días para vencimiento por defecto
    },
    
    // Configuración de productos
    productos: {
        categorias: ['vehiculo', 'servicio', 'accesorio', 'mantenimiento'],
        stockMinimo: 0,
        stockMaximo: 999
    }
};

// Exportar configuración y función de carga
module.exports = {
    ...config,
    cargarConfiguracionEmpresa
};
