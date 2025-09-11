const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const puppeteer = require('puppeteer');
const ApiService = require('./apiService');

let mainWindow;
const apiService = new ApiService();

console.log('🔧 Registrando manejadores IPC...');

// Manejadores para facturas
ipcMain.handle('api-generar-pdf', async (event, facturaData) => {
    console.log('📄 Generando PDF de factura:', facturaData.numero);
    try {
        const html = generarHTMLFactura(facturaData);
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfPath = path.join(__dirname, '../temp', `factura_${facturaData.numero}.pdf`);
        await page.pdf({ 
            path: pdfPath, 
            format: 'A4', 
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });
        await browser.close();
        console.log('✅ PDF generado:', pdfPath);
        return { success: true, data: { path: pdfPath } };
    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        return { success: false, error: error.message };
    }
});

// Manejadores para clientes
ipcMain.handle('api-obtener-clientes', async () => {
    console.log('📋 Obteniendo clientes desde API...');
    try {
        const resultado = await apiService.obtenerClientes();
        console.log('✅ Clientes obtenidos:', resultado.data?.length || 0);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener clientes:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-obtener-cliente', async (event, id) => {
    console.log('📋 Obteniendo cliente:', id);
    try {
        const resultado = await apiService.obtenerCliente(id);
        console.log('✅ Cliente obtenido:', resultado.data?.nombre);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener cliente:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-crear-cliente', async (event, clienteData) => {
    console.log('📋 Creando cliente:', clienteData.nombre);
    try {
        const resultado = await apiService.crearCliente(clienteData);
        console.log('✅ Cliente creado:', resultado.data);
        return resultado;
    } catch (error) {
        console.error('❌ Error al crear cliente:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-actualizar-cliente', async (event, id, clienteData) => {
    console.log('📋 Actualizando cliente:', id, clienteData);
    try {
        const resultado = await apiService.actualizarCliente(id, clienteData);
        console.log('✅ Cliente actualizado:', resultado);
        return resultado;
    } catch (error) {
        console.error('❌ Error al actualizar cliente:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-desactivar-cliente', async (event, id) => {
    console.log('📋 Desactivando cliente:', id);
    try {
        const resultado = await apiService.desactivarCliente(id);
        console.log('✅ Cliente desactivado');
        return resultado;
    } catch (error) {
        console.error('❌ Error al desactivar cliente:', error);
        return { success: false, error: error.message };
    }
});

// Manejadores para coches
ipcMain.handle('api-obtener-coches', async () => {
    console.log('🚗 Obteniendo coches desde API...');
    try {
        const resultado = await apiService.obtenerCoches();
        console.log('✅ Coches obtenidos:', resultado.data?.length || 0);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener coches:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-obtener-coche', async (event, id) => {
    console.log('🚗 Obteniendo coche:', id);
    try {
        const resultado = await apiService.obtenerCoche(id);
        console.log('✅ Coche obtenido:', resultado.data?.matricula);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener coche:', error);
        return { success: false, error: error.message };
    }
});

// Manejadores para coches disponibles
ipcMain.handle('api-obtener-coches-disponibles', async () => {
    console.log('🚗 Obteniendo coches disponibles desde API...');
    try {
        const resultado = await apiService.obtenerCochesDisponibles();
        console.log('✅ Coches disponibles obtenidos:', resultado.data?.length || 0);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener coches disponibles:', error);
        return { success: false, error: error.message };
    }
});

// Manejador para crear producto desde coche
ipcMain.handle('api-crear-producto-desde-coche', async (event, cocheId, precio, cantidad) => {
    console.log('🚗 Creando producto desde coche:', cocheId);
    try {
        const resultado = await apiService.crearProductoDesdeCoche(cocheId, precio, cantidad);
        console.log('✅ Producto creado desde coche:', resultado.data?.codigo || 'N/A');
        return resultado;
    } catch (error) {
        console.error('❌ Error al crear producto desde coche:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-crear-coche', async (event, cocheData) => {
    console.log('🚗 Creando coche:', cocheData.matricula);
    try {
        const resultado = await apiService.crearCoche(cocheData);
        console.log('✅ Coche creado:', resultado.data);
        return resultado;
    } catch (error) {
        console.error('❌ Error al crear coche:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-actualizar-coche', async (event, id, cocheData) => {
    console.log('🚗 Actualizando coche:', id);
    try {
        const resultado = await apiService.actualizarCoche(id, cocheData);
        console.log('✅ Coche actualizado');
        return resultado;
    } catch (error) {
        console.error('❌ Error al actualizar coche:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-desactivar-coche', async (event, id) => {
    console.log('🚗 Desactivando coche:', id);
    try {
        const resultado = await apiService.desactivarCoche(id);
        console.log('✅ Coche desactivado');
        return resultado;
    } catch (error) {
        console.error('❌ Error al desactivar coche:', error);
        return { success: false, error: error.message };
    }
});

// Manejadores para empresas
ipcMain.handle('api-obtener-empresas', async () => {
    console.log('🏢 Obteniendo empresas desde API...');
    try {
        const resultado = await apiService.obtenerEmpresas();
        console.log('✅ Empresas obtenidas:', resultado.data?.length || 0);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener empresas:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-obtener-empresa', async (event, id) => {
    console.log('🏢 Obteniendo empresa:', id);
    try {
        const resultado = await apiService.obtenerEmpresa(id);
        console.log('✅ Empresa obtenida:', resultado.data?.nombre);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener empresa:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-crear-empresa', async (event, empresaData) => {
    console.log('🏢 Creando empresa:', empresaData.nombre);
    try {
        const resultado = await apiService.crearEmpresa(empresaData);
        console.log('✅ Empresa creada:', resultado.data);
        return resultado;
    } catch (error) {
        console.error('❌ Error al crear empresa:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-actualizar-empresa', async (event, id, empresaData) => {
    console.log('🏢 Actualizando empresa:', id);
    try {
        const resultado = await apiService.actualizarEmpresa(id, empresaData);
        console.log('✅ Empresa actualizada');
        return resultado;
    } catch (error) {
        console.error('❌ Error al actualizar empresa:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-eliminar-empresa', async (event, id) => {
    console.log('🏢 Eliminando empresa:', id);
    try {
        const resultado = await apiService.eliminarEmpresa(id);
        console.log('✅ Empresa eliminada');
        return resultado;
    } catch (error) {
        console.error('❌ Error al eliminar empresa:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-desactivar-empresa', async (event, id) => {
    console.log('🏢 Desactivando empresa:', id);
    try {
        const resultado = await apiService.desactivarEmpresa(id);
        console.log('✅ Empresa desactivada');
        return resultado;
    } catch (error) {
        console.error('❌ Error al desactivar empresa:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-obtener-producto', async (event, id) => {
    console.log('📦 Obteniendo producto:', id);
    try {
        const resultado = await apiService.obtenerProducto(id);
        console.log('✅ Producto obtenido:', resultado.data?.nombre);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener producto:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-crear-producto', async (event, productoData) => {
    console.log('📦 Creando producto:', productoData.nombre);
    try {
        const resultado = await apiService.crearProducto(productoData);
        console.log('✅ Producto creado:', resultado.data);
        return resultado;
    } catch (error) {
        console.error('❌ Error al crear producto:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-desactivar-producto', async (event, id) => {
    console.log('📦 Desactivando producto:', id);
    try {
        const resultado = await apiService.desactivarProducto(id);
        console.log('✅ Producto desactivado');
        return resultado;
    } catch (error) {
        console.error('❌ Error al desactivar producto:', error);
        return { success: false, error: error.message };
    }
});

// Manejadores para facturas
ipcMain.handle('api-obtener-facturas', async () => {
    console.log('📋 Obteniendo facturas desde API...');
    try {
        const resultado = await apiService.obtenerFacturas();
        console.log('✅ Facturas obtenidas:', resultado.data?.length || 0);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener facturas:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-obtener-factura', async (event, id) => {
    console.log('📋 Obteniendo factura:', id);
    try {
        const resultado = await apiService.obtenerFactura(id);
        console.log('✅ Factura obtenida:', resultado.data?.numero);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener factura:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-crear-factura', async (event, facturaData) => {
    console.log('📋 Creando factura:', facturaData.numero);
    try {
        const resultado = await apiService.crearFactura(facturaData);
        console.log('✅ Factura creada:', resultado.data);
        return resultado;
    } catch (error) {
        console.error('❌ Error al crear factura:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-actualizar-factura', async (event, id, facturaData) => {
    console.log('📋 Actualizando factura:', id);
    try {
        const resultado = await apiService.actualizarFactura(id, facturaData);
        console.log('✅ Factura actualizada');
        return resultado;
    } catch (error) {
        console.error('❌ Error al actualizar factura:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('api-desactivar-factura', async (event, id) => {
    console.log('📋 Desactivando factura:', id);
    try {
        const resultado = await apiService.desactivarFactura(id);
        console.log('✅ Factura desactivada');
        return resultado;
    } catch (error) {
        console.error('❌ Error al desactivar factura:', error);
        return { success: false, error: error.message };
    }
});

// Manejador para verificar conexión
ipcMain.handle('api-verificar-conexion', async () => {
    console.log('🔍 Verificando conexión con el backend...');
    try {
        const resultado = await apiService.verificarConexion();
        console.log('✅ Conexión verificada:', resultado.success);
        return resultado;
    } catch (error) {
        console.error('❌ Error al verificar conexión:', error);
        return { success: false, error: error.message };
    }
});

// Manejador para obtener siguiente número de factura
ipcMain.handle('api-obtener-siguiente-numero', async (event, empresaId) => {
    console.log('🔢 Obteniendo siguiente número de factura para empresa:', empresaId);
    try {
        const resultado = await apiService.obtenerSiguienteNumeroFactura(empresaId);
        console.log('✅ Siguiente número obtenido:', resultado.data);
        return resultado;
    } catch (error) {
        console.error('❌ Error al obtener siguiente número:', error);
        return { success: false, error: error.message };
    }
});

console.log('✅ Manejadores IPC registrados correctamente');
console.log('📋 Handlers registrados:');
console.log('- api-obtener-clientes');
console.log('- api-obtener-cliente');
console.log('- api-crear-cliente');
console.log('- api-actualizar-cliente');
console.log('- api-desactivar-cliente');
console.log('- api-obtener-coches');
console.log('- api-obtener-coche');
console.log('- api-crear-coche');
console.log('- api-actualizar-coche');
console.log('- api-obtener-productos');
console.log('- api-obtener-producto');
console.log('- api-crear-producto');
console.log('- api-actualizar-producto');
console.log('- api-obtener-empresas');
console.log('- api-obtener-empresa');
console.log('- api-crear-empresa');
console.log('- api-actualizar-empresa');
console.log('- api-eliminar-empresa');
console.log('- api-desactivar-empresa');
console.log('- api-obtener-facturas');
console.log('- api-obtener-factura');
console.log('- api-crear-factura');
console.log('- api-obtener-siguiente-numero');
console.log('- api-verificar-conexion');

// Función para generar HTML de la factura
function generarHTMLFactura(facturaData) {
    const totales = calcularTotalesFactura(facturaData.productos);
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${facturaData.numero}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .factura-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            
            .empresa-info h2 {
                font-size: 18px;
                margin-bottom: 5px;
                color: #333;
            }
            
            .empresa-info p {
                margin: 3px 0;
                color: #666;
            }
            
            .factura-info h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #333;
            }
            
            .factura-info p {
                margin: 5px 0;
                color: #666;
            }
            
            .cliente-section {
                margin-bottom: 30px;
            }
            
            .cliente-section h3 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #333;
            }
            
            .cliente-section p {
                margin: 3px 0;
                color: #666;
            }
            
            .productos-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .productos-table th,
            .productos-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            
            .productos-table th {
                background: #f5f5f5;
                font-weight: bold;
                font-size: 11px;
            }
            
            .productos-table td {
                font-size: 11px;
            }
            
            .totales-section {
                margin-bottom: 30px;
                text-align: right;
            }
            
            .totales-section p {
                margin: 5px 0;
                font-size: 12px;
            }
            
            .total-final {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                border-top: 1px solid #333;
                padding-top: 20px;
            }
            
            .banco-section h3 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #333;
            }
            
            .banco-section p {
                margin: 3px 0;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="factura-container">
            <!-- Header de la factura -->
            <div class="header">
                <div class="empresa-info">
                    <h2>${facturaData.empresa.nombre}</h2>
                    <p>CIF: ${facturaData.empresa.cif}</p>
                    <p>${facturaData.empresa.direccion}</p>
                    <p>Tel: ${facturaData.empresa.telefono}</p>
                    <p>Email: ${facturaData.empresa.email}</p>
                </div>
                <div class="factura-info">
                    <h1>FACTURA</h1>
                    <p>Nº: ${facturaData.numero}</p>
                    <p>Fecha: ${formatearFecha(facturaData.fecha)}</p>
                </div>
            </div>
            
            <!-- Datos del cliente -->
            <div class="cliente-section">
                <h3>DATOS DEL CLIENTE:</h3>
                <p><strong>Nombre:</strong> ${facturaData.cliente.nombre}</p>
                <p><strong>Dirección:</strong> ${facturaData.cliente.direccion}</p>
                <p><strong>Identificación:</strong> ${facturaData.cliente.identificacion}</p>
            </div>
            
            <!-- Tabla de productos -->
            <table class="productos-table">
                <thead>
                    <tr>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                        <th>Precio Unit.</th>
                        <th>IGIC</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${facturaData.productos.map(producto => `
                        <tr>
                            <td>${producto.cantidad}</td>
                            <td>${producto.descripcion}</td>
                            <td>${producto.precioUnitario.toFixed(2)} €</td>
                            <td>${producto.igic.toFixed(2)} €</td>
                            <td>${producto.total.toFixed(2)} €</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Totales -->
            <div class="totales-section">
                <p><strong>Base Imponible:</strong> ${totales.baseImponible.toFixed(2)} €</p>
                <p><strong>IGIC:</strong> ${totales.igic.toFixed(2)} €</p>
                <p class="total-final"><strong>TOTAL:</strong> ${totales.total.toFixed(2)} €</p>
            </div>
            
            <!-- Datos bancarios -->
            <div class="banco-section">
                <h3>DATOS BANCARIOS:</h3>
                <p><strong>Banco:</strong> ${facturaData.banco.nombre}</p>
                <p><strong>IBAN:</strong> ${facturaData.banco.iban}</p>
                <p><strong>SWIFT:</strong> ${facturaData.banco.swift}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Función para calcular totales de la factura
function calcularTotalesFactura(productos) {
    const baseImponible = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const igic = productos.reduce((sum, p) => sum + p.igic, 0);
    const total = baseImponible + igic;
    
    return { baseImponible, igic, total };
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

// Crear ventana principal
function createWindow() {
    console.log('🔧 Inicializando servicio API...');
    console.log('✅ Servicio API inicializado correctamente');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../public/LOGO.png')
    });

    // Cargar el archivo home.html de la aplicación
    mainWindow.loadFile(path.join(__dirname, '../public/home.html'));
    
    // Mostrar la ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('🖥️ Ventana de aplicación mostrada');
    });

    // Manejar el cierre de la ventana
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Inicializar la aplicación
app.whenReady().then(() => {
    createWindow();
});

// Manejar el cierre de la aplicación
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
