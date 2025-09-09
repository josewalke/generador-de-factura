// Configuración del Backend
module.exports = {
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
    
    // Configuración de la empresa
    empresa: {
        nombre: 'Telwagen Car Ibérica, S.L.',
        cif: 'B-93.289.585',
        direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria',
        telefono: '+34 928 123 456',
        email: 'info@telwagen.es'
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
