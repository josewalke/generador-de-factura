/**
 * Constantes de la Aplicación
 * Centraliza todos los valores mágicos (magic numbers/strings) del sistema
 */

const AppConstants = {
    // ==================== CONFIGURACIÓN DE BASE DE DATOS ====================
    DATABASE: {
        POSTGRESQL: 'postgresql',
        SQLITE: 'sqlite',
        DEFAULT_TYPE: 'postgresql',
        RETRY_ATTEMPTS: 10,
        RETRY_DELAY_MS: 100
    },

    // ==================== VALORES DE ACTIVO/INACTIVO ====================
    ACTIVO: {
        TRUE: true,
        FALSE: false,
        SQLITE_TRUE: 1,
        SQLITE_FALSE: 0
    },

    // ==================== ESTADOS DE FACTURAS ====================
    ESTADO_FACTURA: {
        PENDIENTE: 'pendiente',
        PAGADA: 'pagada',
        ANULADA: 'anulado',
        VENCIDA: 'vencida'
    },

    // ==================== ESTADOS DE PROFORMAS ====================
    ESTADO_PROFORMA: {
        PENDIENTE: 'pendiente',
        FACTURADA: 'facturada',
        SEMIFACTURADO: 'semifacturado',
        ANULADA: 'anulado',
        CANCELADA: 'cancelada'
    },

    // ==================== TIPOS DE DOCUMENTO ====================
    TIPO_DOCUMENTO: {
        FACTURA: 'factura',
        ABONO: 'abono',
        NOTA_CREDITO: 'nota_credito'
    },

    // ==================== MÉTODOS DE PAGO ====================
    METODO_PAGO: {
        TRANSFERENCIA: 'transferencia',
        CONTADO: 'contado',
        FINANCIADO: 'financiado',
        CHEQUE: 'cheque',
        EFECTIVO: 'efectivo',
        DEFAULT: 'transferencia'
    },

    // ==================== CACHÉ ====================
    CACHE: {
        TTL_EMPRESAS: 300, // 5 minutos
        TTL_PROFORMAS: 30, // 30 segundos
        TTL_FACTURAS: 30, // 30 segundos
        TTL_CLIENTES: 300, // 5 minutos
        TTL_PRODUCTOS: 300, // 5 minutos
        TTL_COCHES: 300 // 5 minutos
    },

    // ==================== PAGINACIÓN ====================
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
        MIN_LIMIT: 1
    },

    // ==================== VALIDACIÓN ====================
    VALIDATION: {
        MIN_CANTIDAD: 0.01,
        MIN_PRECIO: 0,
        MIN_TOTAL: 0,
        MAX_NOMBRE_LENGTH: 200,
        MAX_DIRECCION_LENGTH: 500,
        MAX_THUMBPRINT_LENGTH: 100,
        MIN_STRING_LENGTH: 1
    },

    // ==================== SEGURIDAD ====================
    SECURITY: {
        HSTS_MAX_AGE: 31536000, // 1 año en segundos
        RATE_LIMIT_FACTURAS: 100, // 100 requests por ventana
        RATE_LIMIT_PROFORMAS: 100,
        RATE_LIMIT_ABONOS: 50,
        RATE_LIMIT_IMPORT_EXPORT: 20,
        RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
        RATE_LIMIT_IMPORT_WINDOW_MS: 60 * 60 * 1000 // 1 hora
    },

    // ==================== HTTP STATUS CODES ====================
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500
    },

    // ==================== MENSAJES DE ERROR COMUNES ====================
    ERROR_MESSAGES: {
        EMPRESA_NOT_FOUND: 'Empresa no encontrada',
        CLIENTE_NOT_FOUND: 'Cliente no encontrado',
        FACTURA_NOT_FOUND: 'Factura no encontrada',
        PROFORMA_NOT_FOUND: 'Proforma no encontrada',
        COCHE_NOT_FOUND: 'Coche no encontrado',
        PRODUCTO_NOT_FOUND: 'Producto no encontrado',
        CIF_DUPLICADO: 'El CIF ya existe',
        NUMERO_FACTURA_DUPLICADO: 'El número de factura ya existe',
        NUMERO_PROFORMA_DUPLICADO: 'El número de proforma ya existe',
        VALIDATION_ERROR: 'Error de validación',
        DATABASE_ERROR: 'Error de base de datos',
        INTERNAL_ERROR: 'Error interno del servidor'
    },

    // ==================== MENSAJES DE ÉXITO ====================
    SUCCESS_MESSAGES: {
        EMPRESA_CREADA: 'Empresa creada exitosamente',
        EMPRESA_ACTUALIZADA: 'Empresa actualizada exitosamente',
        EMPRESA_ELIMINADA: 'Empresa eliminada exitosamente',
        FACTURA_CREADA: 'Factura creada exitosamente',
        FACTURA_ANULADA: 'Factura anulada exitosamente',
        PROFORMA_CREADA: 'Proforma creada exitosamente'
    },

    // ==================== REGEX PATTERNS ====================
    REGEX: {
        CIF: /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/,
        NIF: /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/,
        NIE: /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^[0-9\s\-\+\(\)]{6,20}$/,
        ALPHANUMERIC: /^[A-Za-z0-9]+$/,
        MATRICULA: /[A-Z0-9]/
    }
};

module.exports = AppConstants;







