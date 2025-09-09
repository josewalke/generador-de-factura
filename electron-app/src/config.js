// Configuración para conectar Electron con el Backend
const config = {
    // URL del backend API
    apiUrl: 'http://localhost:3000',
    
    // Endpoints del backend
    endpoints: {
        // Clientes
        clientes: '/api/clientes',
        buscarCliente: '/api/clientes/buscar',
        
        // Productos
        productos: '/api/productos',
        buscarProducto: '/api/productos/buscar',
        
        // Facturas
        facturas: '/api/facturas',
        siguienteNumero: '/api/facturas/siguiente-numero',
        
        // Documentación
        docs: '/'
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
        igic: 9.5,
        diasVencimiento: 30
    },
    
    // Configuración de la aplicación
    app: {
        nombre: 'Generador de Facturas Telwagen',
        version: '1.0.0',
        autor: 'Telwagen Car Ibérica'
    }
};

module.exports = config;
