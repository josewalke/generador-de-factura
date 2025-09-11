// Página de Historial de Facturas - Telwagen
const { ipcRenderer } = require('electron');

// Variables globales
let facturas = [];
let facturasFiltradas = [];
let vistaActual = 'tabla';
let paginaActual = 1;
const facturasPorPagina = 10;

// Elementos del DOM
const buscarCliente = document.getElementById('buscar-cliente');
const filtroCliente = document.getElementById('filtro-cliente');
const filtroEmpresa = document.getElementById('filtro-empresa');
const btnRefresh = document.getElementById('btn-refresh');
const btnNuevaFactura = document.getElementById('btn-nueva-factura');
const btnHome = document.getElementById('btn-home');
const btnVistaTabla = document.getElementById('btn-vista-tabla');
const btnVistaTarjetas = document.getElementById('btn-vista-tarjetas');
const vistaTabla = document.getElementById('vista-tabla');
const vistaTarjetas = document.getElementById('vista-tarjetas');
const facturasTbody = document.getElementById('facturas-tbody');
const facturasCards = document.getElementById('facturas-cards');
const modalFactura = document.getElementById('modal-factura');
const modalTitulo = document.getElementById('modal-titulo');
const modalBody = document.getElementById('modal-body');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCerrarModalFooter = document.getElementById('btn-cerrar-modal-footer');

// Elementos de estadísticas
const totalFacturas = document.getElementById('total-facturas');
const totalIngresos = document.getElementById('total-ingresos');

// Elementos de paginación
const paginationInfo = document.getElementById('pagination-info');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const paginationNumbers = document.getElementById('pagination-numbers');

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📋 Historial de Facturas iniciado');
    
    // Verificar conexión con el backend
    await verificarConexionBackend();
    
    // Cargar facturas
    await cargarFacturas();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Renderizar vista inicial
    renderizarFacturas();
    actualizarEstadisticas();
});

// Verificar conexión con el backend
async function verificarConexionBackend() {
    try {
        const resultado = await ipcRenderer.invoke('api-verificar-conexion');
        if (resultado.success) {
            console.log('✅ Backend conectado correctamente');
        } else {
            console.error('❌ Error de conexión con backend:', resultado.error);
            mostrarError('Error de conexión con el backend');
        }
    } catch (error) {
        console.error('❌ Error al verificar conexión:', error);
        mostrarError('No se pudo conectar con el backend');
    }
}

// Cargar facturas desde el backend
async function cargarFacturas() {
    try {
        console.log('📋 Cargando facturas...');
        const resultado = await ipcRenderer.invoke('api-obtener-facturas');
        if (resultado.success) {
            facturas = resultado.data;
            facturasFiltradas = [...facturas];
            console.log('✅ Facturas cargadas:', facturas.length);
            
            // Cargar clientes únicos para el dropdown
            await cargarClientes();
            
            // Cargar empresas únicas para el dropdown
            await cargarEmpresas();
        } else {
            console.error('❌ Error al cargar facturas:', resultado.error);
            mostrarError('Error al cargar las facturas');
        }
    } catch (error) {
        console.error('❌ Error al cargar facturas:', error);
        mostrarError('Error al cargar las facturas');
    }
}

// Cargar clientes únicos para el dropdown
async function cargarClientes() {
    try {
        // Obtener clientes únicos de las facturas
        const clientesUnicos = [...new Set(facturas
            .map(factura => factura.cliente_nombre)
            .filter(nombre => nombre && nombre.trim() !== '')
        )].sort();
        
        // Limpiar dropdown
        filtroCliente.innerHTML = '<option value="">Todos los clientes</option>';
        
        // Agregar clientes al dropdown
        clientesUnicos.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente;
            option.textContent = cliente;
            filtroCliente.appendChild(option);
        });
        
        console.log('✅ Clientes cargados:', clientesUnicos.length);
    } catch (error) {
        console.error('❌ Error al cargar clientes:', error);
    }
}

// Cargar empresas únicas para el dropdown
async function cargarEmpresas() {
    try {
        // Obtener empresas únicas de las facturas
        const empresasUnicas = [...new Set(facturas
            .map(factura => factura.empresa_nombre)
            .filter(nombre => nombre && nombre.trim() !== '')
        )].sort();
        
        // Limpiar dropdown
        filtroEmpresa.innerHTML = '<option value="">Todas las empresas</option>';
        
        // Agregar empresas al dropdown
        empresasUnicas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa;
            option.textContent = empresa;
            filtroEmpresa.appendChild(option);
        });
        
        console.log('✅ Empresas cargadas:', empresasUnicas.length);
    } catch (error) {
        console.error('❌ Error al cargar empresas:', error);
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Búsqueda por cliente
    buscarCliente.addEventListener('input', () => {
        // Limpiar dropdown cuando se busca
        filtroCliente.value = '';
        filtrarFacturas();
    });
    
    // Filtro por cliente
    filtroCliente.addEventListener('change', () => {
        // Limpiar input cuando se selecciona del dropdown
        buscarCliente.value = '';
        filtrarFacturas();
    });
    
    // Filtro por empresa
    filtroEmpresa.addEventListener('change', () => {
        filtrarFacturas();
    });
    
    // Botones
    btnRefresh.addEventListener('click', async () => {
        await cargarFacturas();
        renderizarFacturas();
        actualizarEstadisticas();
        mostrarNotificacion('Actualizado', 'Lista de facturas actualizada');
    });
    
    btnNuevaFactura.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    btnHome.addEventListener('click', () => {
        window.location.href = 'home.html';
    });
    
    // Cambio de vista
    btnVistaTabla.addEventListener('click', () => cambiarVista('tabla'));
    btnVistaTarjetas.addEventListener('click', () => cambiarVista('tarjetas'));
    
    // Modal
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCerrarModalFooter.addEventListener('click', cerrarModal);
    
    // Botones del modal
    const btnExportarPdf = document.getElementById('btn-exportar-pdf');
    
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', () => {
            const facturaId = modalFactura.dataset.facturaId;
            if (facturaId) {
                descargarPDF(facturaId);
            }
        });
    }
    
    // Paginación
    btnPrev.addEventListener('click', () => cambiarPagina(paginaActual - 1));
    btnNext.addEventListener('click', () => cambiarPagina(paginaActual + 1));
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalFactura.style.display === 'block') {
            cerrarModal();
        }
    });
}

// Filtrar facturas por cliente y empresa
function filtrarFacturas() {
    const busquedaCliente = buscarCliente.value.toLowerCase().trim();
    const clienteFiltro = filtroCliente.value;
    const empresaFiltro = filtroEmpresa.value;
    
    facturasFiltradas = facturas.filter(factura => {
        // Filtro por búsqueda de cliente
        const coincideBusqueda = !busquedaCliente || 
            (factura.cliente_nombre && factura.cliente_nombre.toLowerCase().includes(busquedaCliente));
        
        // Filtro por selección de cliente
        const coincideCliente = !clienteFiltro || factura.cliente_nombre === clienteFiltro;
        
        // Filtro por selección de empresa
        const coincideEmpresa = !empresaFiltro || factura.empresa_nombre === empresaFiltro;
        
        return coincideBusqueda && coincideCliente && coincideEmpresa;
    });
    
    paginaActual = 1;
    renderizarFacturas();
    actualizarEstadisticas();
}

// Cambiar vista
function cambiarVista(vista) {
    vistaActual = vista;
    
    // Actualizar botones
    btnVistaTabla.classList.toggle('active', vista === 'tabla');
    btnVistaTarjetas.classList.toggle('active', vista === 'tarjetas');
    
    // Mostrar/ocultar vistas
    vistaTabla.style.display = vista === 'tabla' ? 'block' : 'none';
    vistaTarjetas.style.display = vista === 'tarjetas' ? 'block' : 'none';
    
    // Re-renderizar
    renderizarFacturas();
}

// Renderizar facturas según la vista actual
function renderizarFacturas() {
    if (vistaActual === 'tabla') {
        renderizarTabla();
    } else {
        renderizarTarjetas();
    }
    actualizarPaginacion();
}

// Renderizar vista tabla
function renderizarTabla() {
    const facturasPagina = obtenerFacturasPagina();
    
    if (facturasPagina.length === 0) {
        facturasTbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <div class="no-data-content">
                        <div class="no-data-icon">📋</div>
                        <h3>No hay facturas</h3>
                        <p>No se encontraron facturas con los filtros aplicados</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    facturasTbody.innerHTML = facturasPagina.map(factura => `
        <tr class="factura-row" data-factura-id="${factura.id}">
            <td class="numero-factura">
                <span class="factura-numero">${factura.numero_factura}</span>
            </td>
            <td class="fecha-factura">
                ${formatearFecha(factura.fecha_emision)}
            </td>
            <td class="cliente-factura">
                ${factura.cliente_nombre || 'Sin cliente'}
            </td>
            <td class="subtotal-factura">
                ${factura.subtotal.toFixed(2)} €
            </td>
            <td class="impuesto-factura">
                ${factura.igic.toFixed(2)} €
            </td>
            <td class="total-factura">
                <strong>${factura.total.toFixed(2)} €</strong>
            </td>
            <td class="acciones-factura">
                <button class="btn-ver" onclick="verDetallesFactura(${factura.id})" title="Ver detalles">
                    👁️
                </button>
            </td>
        </tr>
    `).join('');
}

// Renderizar vista tarjetas
function renderizarTarjetas() {
    const facturasPagina = obtenerFacturasPagina();
    
    if (facturasPagina.length === 0) {
        facturasCards.innerHTML = `
            <div class="no-data-card">
                <div class="no-data-icon">📋</div>
                <h3>No hay facturas</h3>
                <p>No se encontraron facturas con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    facturasCards.innerHTML = facturasPagina.map(factura => `
        <div class="factura-card" data-factura-id="${factura.id}">
            <div class="card-header">
                <div class="factura-numero">${factura.numero_factura}</div>
                <span class="estado-badge estado-${factura.estado}">${factura.estado}</span>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Fecha:</span>
                        <span class="info-value">${formatearFecha(factura.fecha_emision)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cliente:</span>
                        <span class="info-value">${factura.cliente_nombre || 'Sin cliente'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Subtotal:</span>
                        <span class="info-value">${factura.subtotal.toFixed(2)} €</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Impuesto:</span>
                        <span class="info-value">${factura.igic.toFixed(2)} €</span>
                    </div>
                </div>
                <div class="card-total">
                    <span class="total-label">Total:</span>
                    <span class="total-value">${factura.total.toFixed(2)} €</span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn-ver" onclick="verDetallesFactura(${factura.id})">
                    👁️ Ver Detalles
                </button>
            </div>
        </div>
    `).join('');
}

// Obtener facturas de la página actual
function obtenerFacturasPagina() {
    const inicio = (paginaActual - 1) * facturasPorPagina;
    const fin = inicio + facturasPorPagina;
    return facturasFiltradas.slice(inicio, fin);
}

// Actualizar paginación
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);
    const inicio = (paginaActual - 1) * facturasPorPagina + 1;
    const fin = Math.min(paginaActual * facturasPorPagina, facturasFiltradas.length);
    
    // Actualizar información
    paginationInfo.textContent = `Mostrando ${inicio}-${fin} de ${facturasFiltradas.length} facturas`;
    
    // Actualizar botones
    btnPrev.disabled = paginaActual === 1;
    btnNext.disabled = paginaActual === totalPaginas;
    
    // Generar números de página
    paginationNumbers.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-number ${i === paginaActual ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => cambiarPagina(i));
        paginationNumbers.appendChild(btn);
    }
}

// Cambiar página
function cambiarPagina(pagina) {
    const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);
    if (pagina >= 1 && pagina <= totalPaginas) {
        paginaActual = pagina;
        renderizarFacturas();
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = facturasFiltradas.length;
    
    // Calcular ingresos del mes actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();
    
    // Obtener nombre del mes actual
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const nombreMesActual = nombresMeses[mesActual];
    
    const ingresosMesActual = facturasFiltradas.reduce((sum, f) => {
        const fechaFactura = new Date(f.fecha_emision);
        const esDelMesActual = fechaFactura.getMonth() === mesActual && 
                              fechaFactura.getFullYear() === añoActual;
        return esDelMesActual ? sum + f.total : sum;
    }, 0);
    
    totalFacturas.textContent = total;
    totalIngresos.textContent = ingresosMesActual.toFixed(2) + ' €';
    
    // Actualizar la etiqueta con el nombre del mes
    const etiquetaIngresos = document.querySelector('#total-ingresos').parentElement.querySelector('.stat-label');
    etiquetaIngresos.textContent = `Ingresos de ${nombreMesActual}`;
}

// Ver detalles de factura
async function verDetallesFactura(facturaId) {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-factura', facturaId);
        if (resultado.success) {
            mostrarModalFactura(resultado.data);
        } else {
            mostrarError('Error al cargar los detalles de la factura');
        }
    } catch (error) {
        console.error('❌ Error al cargar detalles:', error);
        mostrarError('Error al cargar los detalles de la factura');
    }
}

// Mostrar modal con detalles de factura
function mostrarModalFactura(factura) {
    modalTitulo.textContent = `Factura ${factura.numero_factura}`;
    
    // Guardar el ID de la factura en el dataset del modal
    modalFactura.dataset.facturaId = factura.id;
    
    // Determinar el tipo de impuesto predominante
    const tiposImpuesto = factura.detalles ? factura.detalles.map(d => d.tipo_impuesto) : [];
    const tipoImpuestoPredominante = tiposImpuesto.length > 0 ? tiposImpuesto[0] : 'igic';
    const labelImpuesto = tipoImpuestoPredominante === 'igic' ? 'IGIC' : 'IVA';
    
    modalBody.innerHTML = `
        <div class="factura-detalle">
            <div class="detalle-header">
                <div class="detalle-info">
                    <h4>Información General</h4>
                    <p><strong>Número:</strong> ${factura.numero_factura}</p>
                    <p><strong>Fecha:</strong> ${formatearFecha(factura.fecha_emision)}</p>
                    ${factura.cliente_nombre ? `<p><strong>Cliente:</strong> ${factura.cliente_nombre}</p>` : ''}
                </div>
                <div class="detalle-totales">
                    <h4>Totales</h4>
                    <p><strong>${labelImpuesto}:</strong> ${factura.igic.toFixed(2)} €</p>
                    <p><strong>Total:</strong> ${factura.total.toFixed(2)} €</p>
                </div>
            </div>
            
            ${factura.detalles && factura.detalles.length > 0 ? `
                <div class="detalle-productos">
                    <h4>Productos</h4>
                    <table class="productos-table">
                        <thead>
                            <tr>
                                <th>Cantidad</th>
                                <th>Descripción</th>
                                <th>Precio Unit.</th>
                                <th>${labelImpuesto}</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${factura.detalles.map(detalle => `
                                <tr>
                                    <td>${detalle.cantidad}</td>
                                    <td>${detalle.descripcion || detalle.codigo || 'Producto directo'}</td>
                                    <td>${detalle.precio_unitario.toFixed(2)} €</td>
                                    <td>${detalle.igic.toFixed(2)} €</td>
                                    <td>${detalle.total.toFixed(2)} €</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        </div>
    `;
    
    modalFactura.style.display = 'block';
}

// Cerrar modal
function cerrarModal() {
    modalFactura.style.display = 'none';
}

// Descargar PDF de la factura
async function descargarPDF(facturaId) {
    try {
        mostrarNotificacion('Descargando PDF', 'Generando PDF de la factura...');
        
        // Obtener los detalles de la factura
        const response = await fetch(`http://localhost:3000/api/facturas/${facturaId}`);
        if (!response.ok) {
            throw new Error('Error al obtener los detalles de la factura');
        }
        
        const result = await response.json();
        const factura = result.data;
        
        // Crear el contenido HTML para el PDF usando el mismo estilo que la generación de factura
        const htmlContent = generarHTMLFacturaEstiloGeneracion(factura);
        
        // Crear un elemento temporal para renderizar el HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '800px'; // Mismo ancho que la vista previa
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.padding = '30px'; // Agregar más margen interno
        document.body.appendChild(tempDiv);
        
        // Esperar un momento para que se renderice
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Usar html2canvas para convertir HTML a imagen
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 860, // 800px + 60px de padding (30px cada lado)
            height: tempDiv.scrollHeight
        });
        
        // Crear PDF con jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Calcular dimensiones
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Agregar la imagen al PDF
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Si la imagen es más alta que una página, agregar páginas adicionales
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Limpiar el elemento temporal
        document.body.removeChild(tempDiv);
        
        // Descargar el PDF
        pdf.save(`Factura_${factura.numero_factura.replace('/', '_')}.pdf`);
        
        mostrarNotificacion('PDF Generado', 'El PDF se ha descargado correctamente');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        mostrarNotificacion('Error', 'No se pudo generar el PDF');
        
        // Limpiar elemento temporal en caso de error
        const tempDiv = document.querySelector('div[style*="-9999px"]');
        if (tempDiv) {
            document.body.removeChild(tempDiv);
        }
    }
}

// Generar HTML para la factura con el mismo estilo que la generación de factura
function generarHTMLFacturaEstiloGeneracion(factura) {
    // Determinar el tipo de impuesto predominante
    const tiposImpuesto = factura.detalles ? factura.detalles.map(d => d.tipo_impuesto) : [];
    const tipoImpuestoPredominante = tiposImpuesto.length > 0 ? tiposImpuesto[0] : 'igic';
    const labelImpuesto = tipoImpuestoPredominante === 'igic' ? 'IGIC' : 'IVA';
    
    // Obtener el porcentaje del impuesto (usar el porcentaje del primer detalle)
    const porcentajeImpuesto = factura.detalles && factura.detalles.length > 0 ? 
        (tipoImpuestoPredominante === 'igic' ? 9.5 : 21.0) : 9.5;
    
    const fechaFormateada = formatearFecha(factura.fecha_emision);
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <!-- Header de la factura -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; color: #333;">Telwagen Car Ibérica, S.L.</h2>
                    <p style="margin: 5px 0; color: #666;">CIF: B-93.289.585</p>
                    <p style="margin: 5px 0; color: #666;">C. / Tomás Miller N° 48 Local 35007 Las Palmas de Gran Canaria</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="margin: 0; color: #333; font-size: 2rem;">FACTURA</h1>
                    <p style="margin: 5px 0; color: #666;">Nº: ${factura.numero_factura}</p>
                    <p style="margin: 5px 0; color: #666;">Fecha: ${fechaFormateada}</p>
                </div>
            </div>
            
            <!-- Datos del cliente -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">DATOS DEL CLIENTE:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Nombre:</strong> ${factura.cliente_nombre || 'Sin cliente'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Dirección:</strong> ${factura.cliente_direccion || 'Sin especificar'}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Identificación:</strong> ${factura.cliente_identificacion || 'Sin especificar'}</p>
            </div>
            
            <!-- Tabla de productos -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; color: #000000;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left; color: #000000; font-weight: bold;">Cantidad</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left; color: #000000; font-weight: bold;">Descripción</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #000000; font-weight: bold;">Precio Unit.</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #000000; font-weight: bold;">${labelImpuesto} (${porcentajeImpuesto}%)</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #000000; font-weight: bold;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${factura.detalles ? factura.detalles.map(detalle => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; color: #000000;">${detalle.cantidad}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; color: #000000;">${detalle.descripcion || detalle.codigo || 'Producto directo'}</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #000000;">${detalle.precio_unitario.toFixed(2)} €</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #000000;">${detalle.igic.toFixed(2)} €</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #000000;">${detalle.total.toFixed(2)} €</td>
                        </tr>
                    `).join('') : ''}
                </tbody>
            </table>
            
            <!-- Totales -->
            <div style="text-align: right; margin-bottom: 30px;">
                <p style="margin: 5px 0; font-size: 1.1rem;"><strong>Base Imponible:</strong> ${factura.base_imponible ? factura.base_imponible.toFixed(2) : (factura.total - factura.igic).toFixed(2)} €</p>
                <p style="margin: 5px 0; font-size: 1.1rem;"><strong>${labelImpuesto} (${porcentajeImpuesto}%):</strong> ${factura.igic.toFixed(2)} €</p>
                <p style="margin: 5px 0; font-size: 1.5rem; color: #4facfe;"><strong>TOTAL:</strong> ${factura.total.toFixed(2)} €</p>
            </div>
            
            <!-- Datos bancarios -->
            <div style="border-top: 2px solid #333; padding-top: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">DATOS BANCARIOS:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Banco:</strong> Banco Santander</p>
                <p style="margin: 5px 0; color: #666;"><strong>IBAN:</strong> ES83 0049 7246 7024 1000 2644</p>
                <p style="margin: 5px 0; color: #666;"><strong>SWIFT:</strong> BSCHESMM</p>
            </div>
        </div>
    `;
}

// Generar HTML para la factura (función original mantenida para compatibilidad)
function generarHTMLFactura(factura) {
    // Determinar el tipo de impuesto predominante
    const tiposImpuesto = factura.detalles ? factura.detalles.map(d => d.tipo_impuesto) : [];
    const tipoImpuestoPredominante = tiposImpuesto.length > 0 ? tiposImpuesto[0] : 'igic';
    const labelImpuesto = tipoImpuestoPredominante === 'igic' ? 'IGIC' : 'IVA';
    
    const fechaFormateada = formatearFecha(factura.fecha_emision);
    
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Factura ${factura.numero_factura}</title>
            <style>
                * {
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 15mm;
                    color: #333;
                    background: white;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #4facfe;
                    padding-bottom: 15px;
                }
                .header h1 {
                    color: #4facfe;
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                }
                .header h2 {
                    color: #666;
                    margin: 5px 0;
                    font-size: 14px;
                }
                .info-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    gap: 10px;
                }
                .info-box {
                    flex: 1;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    overflow: hidden;
                }
                .info-box h3 {
                    background: #4facfe;
                    color: white;
                    padding: 8px;
                    margin: 0;
                    font-size: 11px;
                    font-weight: bold;
                }
                .info-box p {
                    margin: 5px 8px;
                    font-size: 10px;
                }
                .products-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }
                .products-table th,
                .products-table td {
                    border: 1px solid #ddd;
                    padding: 6px;
                    text-align: left;
                }
                .products-table th {
                    background: #f5f5f5;
                    font-weight: bold;
                    font-size: 9px;
                }
                .products-table td:last-child,
                .products-table th:last-child {
                    text-align: right;
                }
                .products-table td:nth-child(4),
                .products-table th:nth-child(4) {
                    text-align: right;
                }
                .totals {
                    text-align: right;
                    margin-top: 15px;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .totals p {
                    margin: 3px 0;
                    font-size: 11px;
                }
                .totals .total-final {
                    font-size: 14px;
                    font-weight: bold;
                    color: #4facfe;
                    border-top: 2px solid #4facfe;
                    padding-top: 8px;
                    margin-top: 8px;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 9px;
                    color: #666;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>FACTURA ${factura.numero_factura}</h1>
                <h2>Telwagen Car Ibérica, S.L.</h2>
            </div>
            
            <div class="info-section">
                <div class="info-box">
                    <h3>Información de la Factura</h3>
                    <p><strong>Número:</strong> ${factura.numero_factura}</p>
                    <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                </div>
                
                <div class="info-box">
                    <h3>Cliente</h3>
                    <p><strong>Nombre:</strong> ${factura.cliente_nombre || 'Sin especificar'}</p>
                </div>
                
                <div class="info-box">
                    <h3>Empresa</h3>
                    <p><strong>Telwagen Car Ibérica, S.L.</strong></p>
                    <p>CIF: B-93.289.585</p>
                    <p>C. / Tomás Miller N° 48 Local</p>
                    <p>35007 Las Palmas de Gran Canaria</p>
                </div>
            </div>
            
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                        <th>Precio Unit.</th>
                        <th>${labelImpuesto}</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${factura.detalles ? factura.detalles.map(detalle => `
                        <tr>
                            <td>${detalle.cantidad}</td>
                            <td>${detalle.descripcion || detalle.codigo || 'Producto directo'}</td>
                            <td>${detalle.precio_unitario.toFixed(2)} €</td>
                            <td>${detalle.igic.toFixed(2)} €</td>
                            <td>${detalle.total.toFixed(2)} €</td>
                        </tr>
                    `).join('') : ''}
                </tbody>
            </table>
            
            <div class="totals">
                <p><strong>${labelImpuesto}:</strong> ${factura.igic.toFixed(2)} €</p>
                <p class="total-final"><strong>TOTAL: ${factura.total.toFixed(2)} €</strong></p>
            </div>
            
            <div class="footer">
                <p>Gracias por su confianza en Telwagen Car Ibérica, S.L.</p>
                <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
            </div>
        </body>
        </html>
    `;
}

// Formatear fecha
function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

// Mostrar notificación
function mostrarNotificacion(titulo, mensaje) {
    console.log(`📢 ${titulo}: ${mensaje}`);
    
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-exito';
    notificacion.innerHTML = `
        <span class="notificacion-icon">✅</span>
        <div class="notificacion-content">
            <div class="notificacion-titulo">${titulo}</div>
            <div class="notificacion-mensaje">${mensaje}</div>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 3000);
}

// Mostrar error
function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);
    
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-error';
    notificacion.innerHTML = `
        <span class="notificacion-icon">❌</span>
        <div class="notificacion-content">
            <div class="notificacion-titulo">Error</div>
            <div class="notificacion-mensaje">${mensaje}</div>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 5000);
}
