// Generador de Facturas Telwagen - Renderer Process
const { ipcRenderer } = require('electron');

// Variables globales
let productos = [];
let facturaActual = {};
let clientesDisponibles = [];
let cochesDisponibles = [];
let cocheSeleccionado = null;
let tipoImpuestoActual = 'igic'; // 'igic' o 'iva'

// Elementos del DOM
const productosTabla = document.getElementById('productos-tabla');
const generarFacturaBtn = document.getElementById('generar-factura');
const vistaPrevia = document.getElementById('vista-previa');
const facturaPreview = document.getElementById('factura-preview');
const btnAgregarProducto = document.getElementById('btn-agregar-producto');
const cerrarVistaPreviaBtn = document.getElementById('cerrar-vista-previa');

// Elementos de cliente
const clienteExistenteRadio = document.getElementById('cliente-existente');
const clienteNuevoRadio = document.getElementById('cliente-nuevo');
const clienteExistenteSection = document.getElementById('cliente-existente-section');
const clienteNuevoSection = document.getElementById('cliente-nuevo-section');
const clienteSearch = document.getElementById('cliente-search');
const clienteDropdown = document.getElementById('cliente-dropdown');
const clienteInfo = document.getElementById('cliente-info');
const clienteNombreInfo = document.getElementById('cliente-nombre-info');
const clienteDireccionInfo = document.getElementById('cliente-direccion-info');
const clienteIdentificacionInfo = document.getElementById('cliente-identificacion-info');
const clienteEmailInfo = document.getElementById('cliente-email-info');
const clienteTelefonoInfo = document.getElementById('cliente-telefono-info');

// Elementos de coches
const cocheSearch = document.getElementById('buscar-coche-factura');
const cochesListFactura = document.getElementById('coches-list-factura');
const btnRefreshCoches = document.getElementById('btn-refresh-coches');
const productoForm = document.getElementById('producto-form');
const cocheDropdown = document.getElementById('coche-dropdown');
const cochePreview = document.getElementById('coche-preview');
const cocheMatriculaPreview = document.getElementById('coche-matricula-preview');
const cocheModeloPreview = document.getElementById('coche-modelo-preview');
const cocheColorPreview = document.getElementById('coche-color-preview');
const cocheKmsPreview = document.getElementById('coche-kms-preview');
const cocheChasisPreview = document.getElementById('coche-chasis-preview');

// Elementos de impuestos
const tipoImpuestoSelect = document.getElementById('tipo-impuesto');
const labelPorcentaje = document.getElementById('label-porcentaje');
const porcentajeImpuestoInput = document.getElementById('porcentaje-impuesto');
const labelImpuestoTotal = document.getElementById('label-impuesto-total');
const impuestoTotalSpan = document.getElementById('impuesto-total');

// Elementos de impuestos en totales
const tipoImpuestoTotalesSelect = document.getElementById('tipo-impuesto-totales');
const labelPorcentajeTotales = document.getElementById('label-porcentaje-totales');
const porcentajeImpuestoTotalesInput = document.getElementById('porcentaje-impuesto-totales');

// Variables para búsqueda de clientes
let clienteSeleccionado = null;
let resultadosBusqueda = [];

// Variables para búsqueda de coches
let resultadosBusquedaCoches = [];

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🧾 Generador de Facturas Telwagen iniciado');
    
    // Verificar conexión con el backend
    await verificarConexionBackend();
    
    // Cargar clientes disponibles
    await cargarClientes();
    
    // Cargar coches disponibles
    await cargarCoches();
    
    // Renderizar lista de coches para facturas
    renderizarCochesFactura();
    
    // Configurar manejadores de cliente
    configurarManejadoresCliente();
    
    // Configurar manejadores de coches
    configurarManejadoresCoches();
    
    // Configurar manejadores de impuestos
    configurarManejadoresImpuestos();
    
    // Configurar actualización de precios en tiempo real
    configurarActualizacionPreciosTiempoReal();
    
    mostrarNotificacion('Bienvenido', 'Generador de Facturas Telwagen cargado correctamente');
});

// Verificar conexión con el backend
async function verificarConexionBackend() {
    try {
        const resultado = await ipcRenderer.invoke('api-verificar-conexion');
        if (resultado.success) {
            console.log('✅ Backend conectado correctamente');
            mostrarNotificacion('Backend', 'Conectado correctamente');
        } else {
            console.error('❌ Error de conexión con backend:', resultado.error);
            alert('⚠️ Error de conexión con el backend. Asegúrate de que esté ejecutándose.');
        }
    } catch (error) {
        console.error('❌ Error al verificar conexión:', error);
        alert('⚠️ No se pudo conectar con el backend. Verifica que esté ejecutándose.');
    }
}

// Cargar clientes disponibles
async function cargarClientes() {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-clientes');
        if (resultado.success) {
            clientesDisponibles = resultado.data;
            console.log('✅ Clientes cargados:', clientesDisponibles.length);
        } else {
            console.error('❌ Error al cargar clientes:', resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar clientes:', error);
    }
}

// Cargar coches disponibles
async function cargarCoches() {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-coches-disponibles');
        if (resultado.success) {
            cochesDisponibles = resultado.data;
            console.log('✅ Coches disponibles cargados:', cochesDisponibles.length);
        } else {
            console.error('❌ Error al cargar coches:', resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar coches:', error);
    }
}

// Renderizar lista de coches en facturas
function renderizarCochesFactura() {
    if (cochesDisponibles.length === 0) {
        cochesListFactura.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🚗</div>
                <h3>No hay coches disponibles</h3>
                <p>No se encontraron coches para agregar como productos</p>
            </div>
        `;
        return;
    }

    const html = cochesDisponibles.map(coche => {
        return `
            <div class="coche-item-factura" data-coche-id="${coche.id}">
                <div class="coche-info-factura">
                    <div class="coche-matricula-factura">${coche.matricula}</div>
                    <div class="coche-details-factura">${coche.modelo} - ${coche.color} - ${coche.kms.toLocaleString()} km</div>
                </div>
                <button class="btn-agregar-coche" data-coche-id="${coche.id}">
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">Agregar</span>
                </button>
            </div>
        `;
    }).join('');

    cochesListFactura.innerHTML = html;
    
    // Agregar event listeners
    agregarEventListenersCoches();
}

// Agregar event listeners a los coches
function agregarEventListenersCoches() {
    const cocheItems = cochesListFactura.querySelectorAll('.coche-item-factura');
    const botonesAgregar = cochesListFactura.querySelectorAll('.btn-agregar-coche');
    
    // Event listener para seleccionar coche (click en el item)
    cocheItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // No hacer nada si se hace click en el botón
            if (e.target.closest('.btn-agregar-coche')) return;
            
            const cocheId = parseInt(item.getAttribute('data-coche-id'));
            seleccionarCocheFactura(cocheId);
        });
    });
    
    // Event listener para botones de agregar
    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se active el click del item
            const cocheId = parseInt(boton.getAttribute('data-coche-id'));
            agregarCocheDirectamente(cocheId);
        });
    });
}

// Seleccionar coche para factura
function seleccionarCocheFactura(cocheId) {
    const coche = cochesDisponibles.find(c => c.id === cocheId);
    if (!coche) return;

    cocheSeleccionado = coche;
    
    // Remover selección anterior
    const itemsAnteriores = cochesListFactura.querySelectorAll('.coche-item-factura.selected');
    itemsAnteriores.forEach(item => item.classList.remove('selected'));
    
    // Marcar como seleccionado
    const itemSeleccionado = cochesListFactura.querySelector(`[data-coche-id="${cocheId}"]`);
    if (itemSeleccionado) {
        itemSeleccionado.classList.add('selected');
    }
    
    // Llenar formulario de producto
    llenarFormularioProducto(coche);
    
    // Mostrar formulario
    productoForm.style.display = 'block';
    
    // Scroll hacia el formulario
    productoForm.scrollIntoView({ behavior: 'smooth' });
}

// Llenar formulario de producto con datos del coche
function llenarFormularioProducto(coche) {
    // Generar descripción automática con el formato: matricula-chasis-color-km
    const descripcion = `${coche.matricula} - ${coche.chasis} - ${coche.color} - ${coche.kms.toLocaleString()} km`;
    document.getElementById('descripcion-producto').value = descripcion;
    
    // Sugerir precio basado en el modelo
    const precioSugerido = calcularPrecioSugerido(coche);
    document.getElementById('precio-unitario').value = precioSugerido;
    
    // Resetear cantidad
    document.getElementById('cantidad').value = 1;
}

// Calcular precio sugerido basado en el modelo del coche
function calcularPrecioSugerido(coche) {
    const modelo = coche.modelo.toLowerCase();
    
    // Precios sugeridos basados en marcas conocidas
    if (modelo.includes('mercedes') || modelo.includes('bmw') || modelo.includes('audi')) {
        return 25000;
    } else if (modelo.includes('volkswagen') || modelo.includes('seat') || modelo.includes('skoda')) {
        return 18000;
    } else if (modelo.includes('nissan') || modelo.includes('toyota') || modelo.includes('honda')) {
        return 15000;
    } else if (modelo.includes('ford') || modelo.includes('opel') || modelo.includes('peugeot')) {
        return 12000;
    } else {
        return 10000; // Precio por defecto
    }
}

// Agregar coche directamente a la factura
function agregarCocheDirectamente(cocheId) {
    const coche = cochesDisponibles.find(c => c.id === cocheId);
    if (!coche) return;

    // Establecer el coche seleccionado
    cocheSeleccionado = coche;
    
    // Llenar formulario automáticamente
    llenarFormularioProducto(coche);
    
    // Agregar producto a la factura
    agregarProductoAFactura();
    
    // Mostrar notificación
    mostrarNotificacion('Producto Agregado', `Coche ${coche.matricula} agregado a la factura`);
}

// Agregar producto a la factura
function agregarProductoAFactura() {
    const cantidad = parseInt(document.getElementById('cantidad').value) || 1;
    const precioUnitario = parseFloat(document.getElementById('precio-unitario').value) || 0;
    const descripcion = document.getElementById('descripcion-producto').value;
    const porcentajeImpuesto = parseFloat(document.getElementById('porcentaje-impuesto').value) || (tipoImpuestoActual === 'igic' ? 9.5 : 21.0);

    if (!descripcion.trim()) {
        mostrarNotificacion('Error', 'La descripción es obligatoria');
        return;
    }

    if (precioUnitario <= 0) {
        mostrarNotificacion('Error', 'El precio debe ser mayor a 0');
        return;
    }

    const subtotal = cantidad * precioUnitario;
    const impuesto = subtotal * (porcentajeImpuesto / 100);
    const total = subtotal + impuesto;

    const producto = {
        id: Date.now(), // ID temporal
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        descripcion: descripcion,
        tipoImpuesto: tipoImpuestoActual,
        porcentajeImpuesto: porcentajeImpuesto,
        subtotal: subtotal,
        impuesto: impuesto,
        total: total,
        cocheId: cocheSeleccionado ? cocheSeleccionado.id : null
    };

    productos.push(producto);
    actualizarProductosTabla();
    actualizarTotales();
    
    // Ocultar coche de la lista si tiene cocheId
    if (producto.cocheId) {
        console.log('🔍 Intentando ocultar coche ID:', producto.cocheId);
        ocultarCocheDeLista(producto.cocheId);
    } else {
        console.log('❌ No hay cocheId en el producto:', producto);
    }
    
    limpiarCamposProducto();
    
    // Ocultar formulario
    productoForm.style.display = 'none';
    
    // Limpiar selección
    const itemsAnteriores = cochesListFactura.querySelectorAll('.coche-item-factura.selected');
    itemsAnteriores.forEach(item => item.classList.remove('selected'));
    cocheSeleccionado = null;
}

// Ocultar coche de la lista cuando se agrega a la factura
function ocultarCocheDeLista(cocheId) {
    console.log('🔍 Buscando coche con ID:', cocheId);
    const cocheItem = cochesListFactura.querySelector(`[data-coche-id="${cocheId}"]`);
    console.log('🔍 Elemento encontrado:', cocheItem);
    
    if (cocheItem) {
        cocheItem.style.display = 'none';
        cocheItem.classList.add('coche-agregado');
        console.log('✅ Coche ocultado correctamente');
    } else {
        console.log('❌ No se encontró el elemento del coche');
    }
}

// Mostrar coche en la lista cuando se elimina de la factura
function mostrarCocheEnLista(cocheId) {
    const cocheItem = cochesListFactura.querySelector(`[data-coche-id="${cocheId}"]`);
    if (cocheItem) {
        cocheItem.style.display = 'flex';
        cocheItem.classList.remove('coche-agregado');
    }
}

// Filtrar coches en facturas
function filtrarCochesFactura() {
    const busqueda = cocheSearch.value.toLowerCase().trim();
    
    if (busqueda === '') {
        // Mostrar todos los coches excepto los agregados
        const cocheItems = cochesListFactura.querySelectorAll('.coche-item-factura');
        cocheItems.forEach(item => {
            if (!item.classList.contains('coche-agregado')) {
                item.style.display = 'flex';
            }
        });
        return;
    }
    
    const cocheItems = cochesListFactura.querySelectorAll('.coche-item-factura');
    cocheItems.forEach(item => {
        if (item.classList.contains('coche-agregado')) {
            item.style.display = 'none';
            return;
        }
        
        const matricula = item.querySelector('.coche-matricula-factura').textContent.toLowerCase();
        const detalles = item.querySelector('.coche-details-factura').textContent.toLowerCase();
        
        if (matricula.includes(busqueda) || detalles.includes(busqueda)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Buscar clientes por nombre
function buscarClientes(termino) {
    if (!termino || termino.length < 2) {
        ocultarDropdown();
        return;
    }
    
    const terminoLower = termino.toLowerCase();
    resultadosBusqueda = clientesDisponibles.filter(cliente => 
        cliente.nombre.toLowerCase().includes(terminoLower) ||
        cliente.identificacion.toLowerCase().includes(terminoLower) ||
        (cliente.email && cliente.email.toLowerCase().includes(terminoLower))
    );
    
    mostrarResultadosBusqueda();
}

// Mostrar resultados de búsqueda
function mostrarResultadosBusqueda() {
    if (resultadosBusqueda.length === 0) {
        clienteDropdown.innerHTML = '<div class="cliente-dropdown-empty">No se encontraron clientes</div>';
    } else {
        clienteDropdown.innerHTML = resultadosBusqueda.map(cliente => `
            <div class="cliente-dropdown-item" data-cliente-id="${cliente.id}">
                <div class="cliente-nombre">${cliente.nombre}</div>
                <div class="cliente-detalles">
                    ${cliente.identificacion}${cliente.email ? ' • ' + cliente.email : ''}
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners a los elementos
        clienteDropdown.querySelectorAll('.cliente-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const clienteId = parseInt(item.dataset.clienteId);
                const cliente = clientesDisponibles.find(c => c.id === clienteId);
                if (cliente) {
                    seleccionarCliente(cliente);
                }
            });
        });
    }
    
    clienteDropdown.style.display = 'block';
}

// Seleccionar cliente
function seleccionarCliente(cliente) {
    clienteSeleccionado = cliente;
    clienteSearch.value = cliente.nombre;
    ocultarDropdown();
    mostrarInfoCliente(cliente);
}

// Ocultar dropdown
function ocultarDropdown() {
    clienteDropdown.style.display = 'none';
}

// Configurar manejadores de cliente
function configurarManejadoresCliente() {
    // Manejadores de radio buttons
    clienteExistenteRadio.addEventListener('change', () => {
        if (clienteExistenteRadio.checked) {
            clienteExistenteSection.style.display = 'block';
            clienteNuevoSection.style.display = 'none';
        }
    });
    
    clienteNuevoRadio.addEventListener('change', () => {
        if (clienteNuevoRadio.checked) {
            clienteExistenteSection.style.display = 'none';
            clienteNuevoSection.style.display = 'block';
        }
    });
    
    // Manejador del input de búsqueda de clientes
    clienteSearch.addEventListener('input', (e) => {
        const termino = e.target.value;
        buscarClientes(termino);
    });
    
    // Ocultar dropdown cuando se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!clienteSearch.contains(e.target) && !clienteDropdown.contains(e.target)) {
            ocultarDropdown();
        }
    });
    
    // Limpiar selección cuando se borra el input
    clienteSearch.addEventListener('input', (e) => {
        if (e.target.value === '') {
            clienteSeleccionado = null;
            ocultarInfoCliente();
        }
    });
}

// Configurar manejadores de coches
function configurarManejadoresCoches() {
    // Manejador del input de búsqueda de coches
    cocheSearch.addEventListener('input', filtrarCochesFactura);
    
    // Manejador del botón de refresh
    btnRefreshCoches.addEventListener('click', async () => {
        await cargarCoches();
        renderizarCochesFactura();
        mostrarNotificacion('Actualizado', 'Lista de coches actualizada');
    });
}

// Configurar manejadores de impuestos
function configurarManejadoresImpuestos() {
    console.log('🔧 Configurando manejadores de impuestos...');
    console.log('tipoImpuestoSelect:', tipoImpuestoSelect);
    console.log('labelPorcentaje:', labelPorcentaje);
    console.log('porcentajeImpuestoInput:', porcentajeImpuestoInput);
    console.log('labelImpuestoTotal:', labelImpuestoTotal);
    console.log('impuestoTotalSpan:', impuestoTotalSpan);
    console.log('tipoImpuestoTotalesSelect:', tipoImpuestoTotalesSelect);
    
    // Verificar que los elementos existan
    if (!tipoImpuestoSelect || !labelPorcentaje || !porcentajeImpuestoInput || !labelImpuestoTotal || !impuestoTotalSpan) {
        console.error('❌ Elementos de impuestos no encontrados');
        return;
    }
    
    // Manejador del selector de tipo de impuesto en detalles del producto
    tipoImpuestoSelect.addEventListener('change', (e) => {
        tipoImpuestoActual = e.target.value;
        actualizarLabelsImpuesto();
        actualizarPorcentajePorDefecto();
        sincronizarSelectoresImpuesto();
        recalcularProductosConNuevoTipoImpuesto();
        actualizarTotales();
    });
    
    // Manejador del selector de tipo de impuesto en totales
    if (tipoImpuestoTotalesSelect) {
        tipoImpuestoTotalesSelect.addEventListener('change', (e) => {
            tipoImpuestoActual = e.target.value;
            actualizarLabelsImpuesto();
            actualizarPorcentajePorDefecto();
            sincronizarSelectoresImpuesto();
            sincronizarPorcentajes();
            recalcularProductosConNuevoTipoImpuesto();
            actualizarTotales();
        });
    }
    
    // Manejador del campo de porcentaje en totales
    if (porcentajeImpuestoTotalesInput) {
        porcentajeImpuestoTotalesInput.addEventListener('input', (e) => {
            sincronizarPorcentajes();
            recalcularTotalesConNuevoPorcentaje();
        });
    }
    
    // Inicializar con valores por defecto
    actualizarLabelsImpuesto();
    sincronizarSelectoresImpuesto();
    sincronizarPorcentajes();
    console.log('✅ Manejadores de impuestos configurados correctamente');
}

// Configurar actualización de precios en tiempo real
function configurarActualizacionPreciosTiempoReal() {
    console.log('🔧 Configurando actualización de precios en tiempo real...');
    
    // Usar delegación de eventos para manejar inputs que se crean dinámicamente
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('precio-input')) {
            const productoId = parseInt(e.target.getAttribute('data-producto-id'));
            const nuevoPrecio = e.target.value;
            
            if (productoId && nuevoPrecio !== undefined) {
                actualizarPrecioProducto(productoId, nuevoPrecio);
            }
        }
    });
    
    console.log('✅ Actualización de precios en tiempo real configurada');
}

// Actualizar labels según el tipo de impuesto
function actualizarLabelsImpuesto() {
    if (!labelPorcentaje || !labelImpuestoTotal) {
        console.error('❌ Labels de impuestos no encontrados');
        return;
    }
    
    if (tipoImpuestoActual === 'igic') {
        labelPorcentaje.textContent = 'IGIC (%):';
        labelImpuestoTotal.textContent = 'IGIC:';
        if (labelPorcentajeTotales) {
            labelPorcentajeTotales.textContent = 'IGIC (%):';
        }
    } else {
        labelPorcentaje.textContent = 'IVA (%):';
        labelImpuestoTotal.textContent = 'IVA:';
        if (labelPorcentajeTotales) {
            labelPorcentajeTotales.textContent = 'IVA (%):';
        }
    }
}

// Sincronizar selectores de impuesto
function sincronizarSelectoresImpuesto() {
    if (tipoImpuestoTotalesSelect) {
        tipoImpuestoTotalesSelect.value = tipoImpuestoActual;
    }
}

// Sincronizar porcentajes entre ambos campos
function sincronizarPorcentajes() {
    if (porcentajeImpuestoTotalesInput && porcentajeImpuestoInput) {
        porcentajeImpuestoInput.value = porcentajeImpuestoTotalesInput.value;
    }
}

// Recalcular productos con el nuevo tipo de impuesto
function recalcularProductosConNuevoTipoImpuesto() {
    if (productos.length === 0) return;
    
    // Obtener el nuevo porcentaje según el tipo de impuesto
    const nuevoPorcentaje = tipoImpuestoActual === 'igic' ? 9.5 : 21.0;
    
    console.log(`🔄 Recalculando productos con nuevo tipo: ${tipoImpuestoActual.toUpperCase()} (${nuevoPorcentaje}%)`);
    
    // Recalcular todos los productos con el nuevo tipo y porcentaje
    productos.forEach(producto => {
        producto.tipoImpuesto = tipoImpuestoActual;
        producto.porcentajeImpuesto = nuevoPorcentaje;
        producto.impuesto = producto.subtotal * (nuevoPorcentaje / 100);
        producto.total = producto.subtotal + producto.impuesto;
        
        console.log(`📦 Producto "${producto.descripcion}": ${producto.impuesto.toFixed(2)}€ de ${tipoImpuestoActual.toUpperCase()}`);
    });
    
    // Actualizar la tabla y totales
    actualizarProductosTabla();
    console.log('✅ Productos recalculados con nuevo tipo de impuesto');
}

// Recalcular totales con el nuevo porcentaje
function recalcularTotalesConNuevoPorcentaje() {
    if (productos.length === 0) return;
    
    const nuevoPorcentaje = parseFloat(porcentajeImpuestoTotalesInput.value) || (tipoImpuestoActual === 'igic' ? 9.5 : 21.0);
    
    // Recalcular todos los productos con el nuevo porcentaje
    productos.forEach(producto => {
        producto.porcentajeImpuesto = nuevoPorcentaje;
        producto.impuesto = producto.subtotal * (nuevoPorcentaje / 100);
        producto.total = producto.subtotal + producto.impuesto;
    });
    
    // Actualizar la tabla y totales
    actualizarProductosTabla();
    actualizarTotales();
}

// Actualizar porcentaje por defecto según el tipo de impuesto
function actualizarPorcentajePorDefecto() {
    if (!porcentajeImpuestoInput) {
        console.error('❌ Input de porcentaje no encontrado');
        return;
    }
    
    const porcentajeDefecto = tipoImpuestoActual === 'igic' ? '9.5' : '21.0';
    porcentajeImpuestoInput.value = porcentajeDefecto;
    
    if (porcentajeImpuestoTotalesInput) {
        porcentajeImpuestoTotalesInput.value = porcentajeDefecto;
    }
}

// Ocultar preview del coche
function ocultarPreviewCoche() {
    cochePreview.style.display = 'none';
}

// Mostrar información del cliente
function mostrarInfoCliente(cliente) {
    clienteNombreInfo.textContent = cliente.nombre;
    clienteDireccionInfo.textContent = cliente.direccion;
    clienteIdentificacionInfo.textContent = cliente.identificacion;
    clienteEmailInfo.textContent = cliente.email || 'N/A';
    clienteTelefonoInfo.textContent = cliente.telefono || 'N/A';
    clienteInfo.style.display = 'block';
}

// Ocultar información del cliente
function ocultarInfoCliente() {
    clienteInfo.style.display = 'none';
}

// Buscar coches por matrícula, modelo, etc.
function buscarCoches(termino) {
    if (!termino || termino.length < 2) {
        ocultarDropdownCoches();
        return;
    }
    
    const terminoLower = termino.toLowerCase();
    resultadosBusquedaCoches = cochesDisponibles.filter(coche => 
        coche.matricula.toLowerCase().includes(terminoLower) ||
        coche.modelo.toLowerCase().includes(terminoLower) ||
        coche.color.toLowerCase().includes(terminoLower) ||
        coche.chasis.toLowerCase().includes(terminoLower)
    );
    
    mostrarResultadosBusquedaCoches();
}

// Mostrar resultados de búsqueda de coches
function mostrarResultadosBusquedaCoches() {
    if (resultadosBusquedaCoches.length === 0) {
        cocheDropdown.innerHTML = '<div class="coche-dropdown-empty">No se encontraron coches</div>';
    } else {
        cocheDropdown.innerHTML = resultadosBusquedaCoches.map(coche => {
            const tieneProducto = coche.tiene_producto ? 
                '<span class="producto-existe">✅ Producto creado</span>' : 
                '<span class="producto-nuevo">🆕 Nuevo producto</span>';
            
            return `
                <div class="coche-dropdown-item" data-coche-id="${coche.id}">
                    <div class="coche-matricula">🚗 ${coche.matricula}</div>
                    <div class="coche-detalles">
                        ${coche.modelo} • ${coche.color} • ${coche.kms.toLocaleString()} km
                    </div>
                    <div class="coche-producto-info">
                        ${tieneProducto}
                        ${coche.precio_producto ? `<span class="precio-producto">€${coche.precio_producto}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Agregar event listeners a los elementos
        cocheDropdown.querySelectorAll('.coche-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const cocheId = parseInt(item.dataset.cocheId);
                const coche = cochesDisponibles.find(c => c.id === cocheId);
                if (coche) {
                    seleccionarCoche(coche);
                }
            });
        });
    }
    
    cocheDropdown.style.display = 'block';
}

// Seleccionar coche
function seleccionarCoche(coche) {
    cocheSeleccionado = coche;
    cocheSearch.value = coche.matricula;
    ocultarDropdownCoches();
    mostrarPreviewCoche(coche);
    
    // Auto-completar campos del producto
    autoCompletarProductoDesdeCoche(coche);
}

// Ocultar dropdown de coches
function ocultarDropdownCoches() {
    cocheDropdown.style.display = 'none';
}

// Mostrar preview del coche seleccionado
function mostrarPreviewCoche(coche) {
    cocheMatriculaPreview.textContent = coche.matricula;
    cocheModeloPreview.textContent = coche.modelo;
    cocheColorPreview.textContent = coche.color;
    cocheKmsPreview.textContent = `${coche.kms.toLocaleString()} km`;
    cocheChasisPreview.textContent = coche.chasis;
    cochePreview.style.display = 'block';
}

// Auto-completar campos del producto desde el coche seleccionado
function autoCompletarProductoDesdeCoche(coche) {
    // Generar descripción automática del coche
    const descripcion = `${coche.modelo} - ${coche.color} - ${coche.kms.toLocaleString()} km - Chasis: ${coche.chasis}`;
    document.getElementById('descripcion-producto').value = descripcion;
    
    // Usar precio del producto existente si está disponible, sino calcular precio sugerido
    let precioSugerido = 0;
    if (coche.precio_producto && coche.precio_producto > 0) {
        precioSugerido = coche.precio_producto;
        console.log('💰 Usando precio del producto existente:', precioSugerido);
    } else {
        precioSugerido = calcularPrecioSugerido(coche);
        console.log('💰 Calculando precio sugerido:', precioSugerido);
    }
    
    if (precioSugerido > 0) {
        document.getElementById('precio-unitario').value = precioSugerido;
    }
}

// Calcular precio sugerido basado en el modelo del coche
function calcularPrecioSugerido(coche) {
    // Mapeo básico de modelos a precios sugeridos
    const preciosModelos = {
        'NISSAN MICRA': 9589.04,
        'NISSAN QASHQAI': 18950.00,
        'NISSAN LEAF': 28990.00,
        'NISSAN JUKE': 15990.00,
        'VOLKSWAGEN GOLF': 12000.00,
        'MERCEDES-BENZ': 25000.00,
        'BMW': 22000.00
    };
    
    // Buscar coincidencia parcial en el modelo
    for (const [marca, precio] of Object.entries(preciosModelos)) {
        if (coche.modelo.toUpperCase().includes(marca)) {
            return precio;
        }
    }
    
    // Precio por defecto si no se encuentra coincidencia
    return 15000.00;
}

// Obtener datos del cliente seleccionado
function obtenerDatosCliente() {
    if (clienteExistenteRadio.checked) {
        const clienteId = selectCliente.value;
        if (!clienteId) {
            throw new Error('Selecciona un cliente existente');
        }
        const cliente = clientesDisponibles.find(c => c.id == clienteId);
        if (!cliente) {
            throw new Error('Cliente no encontrado');
        }
        return cliente;
    } else {
        const nombre = document.getElementById('nombre-cliente').value;
        const direccion = document.getElementById('direccion-cliente').value;
        const identificacion = document.getElementById('identificacion-cliente').value;
        const email = document.getElementById('email-cliente').value;
        const telefono = document.getElementById('telefono-cliente').value;
        
        if (!nombre || !direccion || !identificacion) {
            throw new Error('Completa los campos obligatorios del cliente nuevo');
        }
        
        return { nombre, direccion, identificacion, email, telefono };
    }
}

// Manejar formulario de productos
btnAgregarProducto.addEventListener('click', async () => {
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const descripcion = document.getElementById('descripcion-producto').value;
    const precioUnitario = parseFloat(document.getElementById('precio-unitario').value);
    const porcentajeIgic = parseFloat(document.getElementById('porcentaje-igic').value);
    
    if (!cantidad || !descripcion || !precioUnitario) {
        alert('❌ Completa todos los campos del producto');
        return;
    }
    
    // Si hay un coche seleccionado y no tiene producto asociado, crear uno automáticamente
    if (cocheSeleccionado && !cocheSeleccionado.tiene_producto) {
        try {
            console.log('🔄 Creando producto automáticamente desde coche...');
            const resultado = await ipcRenderer.invoke('api-crear-producto-desde-coche', 
                cocheSeleccionado.id, precioUnitario, cantidad);
            
            if (resultado.success) {
                console.log('✅ Producto creado automáticamente:', resultado.data.codigo);
                mostrarNotificacion('Producto Creado', `Se ha creado automáticamente el producto ${resultado.data.codigo}`);
                
                // Recargar coches para actualizar el estado
                await cargarCoches();
            }
        } catch (error) {
            console.warn('⚠️ No se pudo crear producto automáticamente:', error);
        }
    }
    
    const producto = {
        id: Date.now(),
        cantidad,
        descripcion,
        precioUnitario,
        porcentajeIgic,
        subtotal: cantidad * precioUnitario,
        igic: (cantidad * precioUnitario * porcentajeIgic) / 100,
        total: cantidad * precioUnitario * (1 + porcentajeIgic / 100),
        // Información del coche si está seleccionado
        coche: cocheSeleccionado ? {
            id: cocheSeleccionado.id,
            matricula: cocheSeleccionado.matricula,
            modelo: cocheSeleccionado.modelo,
            color: cocheSeleccionado.color,
            kms: cocheSeleccionado.kms,
            chasis: cocheSeleccionado.chasis
        } : null
    };
    
    productos.push(producto);
    actualizarProductosTabla();
    actualizarTotales();
    
    // Limpiar campos y resetear selección de coche
    limpiarCamposProducto();
    
    mostrarNotificacion('Producto Agregado', 'El producto se ha agregado correctamente a la factura');
});

// Limpiar campos del producto
function limpiarCamposProducto() {
    document.getElementById('cantidad').value = '1';
    document.getElementById('precio-unitario').value = '';
    document.getElementById('descripcion-producto').value = '';
    document.getElementById('porcentaje-impuesto').value = tipoImpuestoActual === 'igic' ? '9.5' : '21.0';
    
    // Limpiar selección de coche
    cocheSearch.value = '';
    cocheSeleccionado = null;
    ocultarPreviewCoche();
}

// Generar factura
generarFacturaBtn.addEventListener('click', async () => {
    try {
        // Obtener datos del cliente
        const datosCliente = obtenerDatosCliente();
        
        if (productos.length === 0) {
            alert('❌ Agrega al menos un producto');
            return;
        }
        
        try {
            // Obtener número de factura automático del backend
            const numeroResult = await ipcRenderer.invoke('api-obtener-siguiente-numero');
            if (!numeroResult.success) {
                alert('❌ Error al obtener número de factura: ' + numeroResult.error);
                return;
            }
            
            const numeroFactura = numeroResult.data.numero_factura;
            const fechaFactura = new Date().toISOString().split('T')[0];
            
            const facturaData = {
                numero: numeroFactura,
                fecha: fechaFactura,
                cliente: {
                    nombre: datosCliente.nombre,
                    direccion: datosCliente.direccion,
                    identificacion: datosCliente.identificacion
                },
                productos: productos,
                empresa: {
                    nombre: 'Telwagen Car Ibérica, S.L.',
                    cif: 'B-93.289.585',
                    direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria'
                },
                banco: {
                    nombre: 'Banco Santander',
                    iban: 'ES83 0049 7246 7024 1000 2644',
                    swift: 'BSCHESMM'
                }
            };
            
            generarVistaPrevia(facturaData);
            
            // Guardar factura en el backend
            const guardarResult = await ipcRenderer.invoke('api-crear-factura', facturaData);
            if (guardarResult.success) {
                console.log('✅ Factura guardada en el backend:', guardarResult.data);
            } else {
                console.warn('⚠️ No se pudo guardar la factura:', guardarResult.error);
            }
            
        } catch (error) {
            console.error('❌ Error al generar factura:', error);
            alert('❌ Error al generar factura: ' + error.message);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Generar PDF de la factura
generarPdfBtn.addEventListener('click', async () => {
    try {
        // Obtener datos del cliente
        const datosCliente = obtenerDatosCliente();
        
        if (productos.length === 0) {
            alert('❌ Agrega al menos un producto');
            return;
        }
        
        try {
            // Obtener número de factura automático del backend
            const numeroResult = await ipcRenderer.invoke('api-obtener-siguiente-numero');
            if (!numeroResult.success) {
                alert('❌ Error al obtener número de factura: ' + numeroResult.error);
                return;
            }
            
            const numeroFactura = numeroResult.data.numero_factura;
            const fechaFactura = new Date().toISOString().split('T')[0];
            
            const facturaData = {
                numero: numeroFactura,
                fecha: fechaFactura,
                cliente: {
                    nombre: datosCliente.nombre,
                    direccion: datosCliente.direccion,
                    identificacion: datosCliente.identificacion
                },
                productos: productos,
                empresa: {
                    nombre: 'Telwagen Car Ibérica, S.L.',
                    cif: 'B-93.289.585',
                    direccion: 'C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria'
                },
                banco: {
                    nombre: 'Banco Santander',
                    iban: 'ES83 0049 7246 7024 1000 2644',
                    swift: 'BSCHESMM'
                }
            };
            
            // Generar PDF
            const pdfResult = await ipcRenderer.invoke('generar-pdf', facturaData);
            if (pdfResult.success) {
                alert('✅ PDF generado correctamente: ' + pdfResult.data.path);
                
                // Abrir el PDF automáticamente
                const { shell } = require('electron');
                shell.openPath(pdfResult.data.path);
            } else {
                alert('❌ Error al generar PDF: ' + pdfResult.error);
            }
            
        } catch (error) {
            console.error('❌ Error al generar PDF:', error);
            alert('❌ Error al generar PDF: ' + error.message);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
});

// Limpiar formulario
limpiarFormularioBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres limpiar todo el formulario?')) {
        limpiarFormulario();
    }
});

// Ver clientes
verClientesBtn.addEventListener('click', async () => {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-clientes');
        if (resultado.success) {
            if (resultado.data.length === 0) {
                alert('👥 No hay clientes registrados');
            } else {
                let mensaje = '👥 Clientes registrados:\n\n';
                resultado.data.forEach(cliente => {
                    mensaje += `• ${cliente.nombre}\n`;
                    mensaje += `  Identificación: ${cliente.identificacion}\n`;
                    mensaje += `  Dirección: ${cliente.direccion}\n`;
                    mensaje += `  Teléfono: ${cliente.telefono || 'N/A'}\n`;
                    mensaje += `  Email: ${cliente.email || 'N/A'}\n\n`;
                });
                alert(mensaje);
            }
        } else {
            alert('❌ Error al cargar clientes: ' + resultado.error);
        }
    } catch (error) {
        alert('❌ Error al cargar clientes: ' + error.message);
    }
});

// Ver empresas
verEmpresasBtn.addEventListener('click', async () => {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-empresas');
        if (resultado.success) {
            if (resultado.data.length === 0) {
                alert('🏢 No hay empresas registradas');
            } else {
                let mensaje = '🏢 Empresas registradas:\n\n';
                resultado.data.forEach(empresa => {
                    mensaje += `• ${empresa.nombre}\n`;
                    mensaje += `  CIF: ${empresa.cif}\n`;
                    mensaje += `  Dirección: ${empresa.direccion}\n`;
                    mensaje += `  Teléfono: ${empresa.telefono || 'N/A'}\n`;
                    mensaje += `  Email: ${empresa.email || 'N/A'}\n`;
                    mensaje += `  Web: ${empresa.web || 'N/A'}\n\n`;
                });
                alert(mensaje);
            }
        } else {
            alert('❌ Error al cargar empresas: ' + resultado.error);
        }
    } catch (error) {
        alert('❌ Error al cargar empresas: ' + error.message);
    }
});

// Ver historial de facturas
verHistorialBtn.addEventListener('click', async () => {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-facturas');
        if (resultado.success) {
            if (resultado.data.length === 0) {
                alert('📋 No hay facturas guardadas');
            } else {
                let mensaje = '📋 Facturas guardadas:\n\n';
                resultado.data.forEach(factura => {
                    const fecha = new Date(factura.fecha_emision).toLocaleDateString();
                    mensaje += `• ${factura.numero_factura} - ${factura.cliente_nombre || 'Cliente'} - ${factura.total.toFixed(2)} € (${fecha})\n`;
                });
                alert(mensaje);
            }
        } else {
            alert('❌ Error al cargar facturas: ' + resultado.error);
        }
    } catch (error) {
        alert('❌ Error al cargar facturas: ' + error.message);
    }
});

// Cerrar vista previa
cerrarVistaPreviaBtn.addEventListener('click', () => {
    vistaPrevia.style.display = 'none';
});

// Botón Home
const btnHome = document.getElementById('btn-home');
if (btnHome) {
    btnHome.addEventListener('click', () => {
        window.location.href = 'home.html';
    });
}

// Actualizar tabla de productos
function actualizarProductosTabla() {
    if (productos.length === 0) {
        productosTabla.innerHTML = '<p style="text-align: center; opacity: 0.7;">No hay productos agregados</p>';
        return;
    }
    
    let html = '<table>';
    html += '<thead><tr><th>Cant.</th><th>Descripción</th><th>Precio</th><th>Acciones</th></tr></thead>';
    html += '<tbody>';
    
    productos.forEach(producto => {
        html += `
            <tr>
                <td>${producto.cantidad}</td>
                <td>${producto.descripcion}</td>
                <td>
                    <input type="number" 
                           class="precio-input" 
                           value="${producto.precioUnitario}" 
                           step="0.01" 
                           data-producto-id="${producto.id}"
                           oninput="actualizarPrecioProducto(${producto.id}, this.value)"
                           onchange="actualizarPrecioProducto(${producto.id}, this.value)">
                </td>
                <td>
                    <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    productosTabla.innerHTML = html;
}

// Actualizar totales en tiempo real
function actualizarTotales() {
    const totales = calcularTotales();
    
    // Actualizar valores numéricos
    document.getElementById('base-imponible').textContent = totales.baseImponible.toFixed(2) + ' €';
    document.getElementById('impuesto-total').textContent = totales.impuesto.toFixed(2) + ' €';
    document.getElementById('total-final').textContent = totales.total.toFixed(2) + ' €';
    
    // Actualizar el label del impuesto dinámicamente
    const labelImpuestoTotal = document.getElementById('label-impuesto-total');
    if (labelImpuestoTotal) {
        const tipoImpuestoTexto = tipoImpuestoActual === 'igic' ? 'IGIC' : 'IVA';
        labelImpuestoTotal.textContent = tipoImpuestoTexto + ':';
    }
}

// Actualizar precio de un producto en tiempo real
function actualizarPrecioProducto(productoId, nuevoPrecio) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    // Convertir a número, usar 0 si está vacío o es inválido
    const precioUnitario = parseFloat(nuevoPrecio) || 0;
    
    // Calcular subtotal, impuesto y total
    const subtotal = producto.cantidad * precioUnitario;
    const impuesto = subtotal * (producto.porcentajeImpuesto / 100);
    const total = subtotal + impuesto;
    
    // Actualizar el producto en el array
    producto.precioUnitario = precioUnitario;
    producto.subtotal = subtotal;
    producto.impuesto = impuesto;
    producto.total = total;
    
    // Actualizar la tabla y recalcular totales inmediatamente
    actualizarProductosTabla();
    actualizarTotales();
    
    console.log(`Precio actualizado: ${precioUnitario}€ - Total: ${total.toFixed(2)}€`);
}

// Eliminar producto
function eliminarProducto(id) {
    // Encontrar el producto antes de eliminarlo para obtener el cocheId
    const productoEliminado = productos.find(p => p.id === id);
    
    productos = productos.filter(p => p.id !== id);
    actualizarProductosTabla();
    actualizarTotales();
    
    // Mostrar el coche nuevamente en la lista si tenía cocheId
    if (productoEliminado && productoEliminado.cocheId) {
        mostrarCocheEnLista(productoEliminado.cocheId);
    }
    
    alert('✅ Producto eliminado');
}

// Calcular totales
function calcularTotales() {
    const baseImponible = productos.reduce((sum, p) => sum + p.subtotal, 0);
    const impuesto = productos.reduce((sum, p) => sum + p.impuesto, 0);
    const total = baseImponible + impuesto;
    
    return { baseImponible, impuesto, total };
}

// Generar vista previa de la factura
function generarVistaPrevia(facturaData) {
    const totales = calcularTotales();
    
    // Determinar el tipo de impuesto predominante
    const tiposImpuesto = productos.map(p => p.tipoImpuesto);
    const tipoImpuestoPredominante = tiposImpuesto.length > 0 ? tiposImpuesto[0] : 'igic';
    const labelImpuesto = tipoImpuestoPredominante === 'igic' ? 'IGIC' : 'IVA';
    
    let html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <!-- Header de la factura -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <div>
                    <h2 style="margin: 0; color: #333;">${facturaData.empresa.nombre}</h2>
                    <p style="margin: 5px 0; color: #666;">CIF: ${facturaData.empresa.cif}</p>
                    <p style="margin: 5px 0; color: #666;">${facturaData.empresa.direccion}</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="margin: 0; color: #333; font-size: 2rem;">FACTURA</h1>
                    <p style="margin: 5px 0; color: #666;">Nº: ${facturaData.numero}</p>
                    <p style="margin: 5px 0; color: #666;">Fecha: ${formatearFecha(facturaData.fecha)}</p>
                </div>
            </div>
            
            <!-- Datos del cliente -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">DATOS DEL CLIENTE:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Nombre:</strong> ${facturaData.cliente.nombre}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Dirección:</strong> ${facturaData.cliente.direccion}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Identificación:</strong> ${facturaData.cliente.identificacion}</p>
            </div>
            
            <!-- Tabla de productos -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Cantidad</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Descripción</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Precio Unit.</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Subtotal</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">${labelImpuesto}</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    facturaData.productos.forEach(producto => {
        html += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${producto.cantidad}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${producto.descripcion}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${producto.precioUnitario.toFixed(2)} €</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${producto.subtotal.toFixed(2)} €</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${producto.impuesto.toFixed(2)} €</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${producto.total.toFixed(2)} €</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            
            <!-- Totales -->
            <div style="text-align: right; margin-bottom: 30px;">
                <p style="margin: 5px 0; font-size: 1.1rem;"><strong>Base Imponible:</strong> ${totales.baseImponible.toFixed(2)} €</p>
                <p style="margin: 5px 0; font-size: 1.1rem;"><strong>${labelImpuesto}:</strong> ${totales.impuesto.toFixed(2)} €</p>
                <p style="margin: 5px 0; font-size: 1.5rem; color: #4facfe;"><strong>TOTAL:</strong> ${totales.total.toFixed(2)} €</p>
            </div>
            
            <!-- Datos bancarios -->
            <div style="border-top: 2px solid #333; padding-top: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">DATOS BANCARIOS:</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Banco:</strong> ${facturaData.banco.nombre}</p>
                <p style="margin: 5px 0; color: #666;"><strong>IBAN:</strong> ${facturaData.banco.iban}</p>
                <p style="margin: 5px 0; color: #666;"><strong>SWIFT:</strong> ${facturaData.banco.swift}</p>
            </div>
        </div>
    `;
    
    facturaPreview.innerHTML = html;
    vistaPrevia.style.display = 'flex';
}

// Función para limpiar formulario
function limpiarFormulario() {
    productos = [];
    actualizarProductosTabla();
    actualizarTotales();
    
    // Limpiar formulario de cliente
    document.getElementById('nombre-cliente').value = '';
    document.getElementById('direccion-cliente').value = '';
    document.getElementById('identificacion-cliente').value = '';
    
    // Limpiar formulario de productos
    document.getElementById('cantidad').value = '1';
    document.getElementById('precio-unitario').value = '';
    document.getElementById('descripcion-producto').value = '';
    document.getElementById('porcentaje-impuesto').value = tipoImpuestoActual === 'igic' ? '9.5' : '21.0';
    
    // Ocultar vista previa
    vistaPrevia.style.display = 'none';
    
    alert('✅ Formulario limpiado correctamente');
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

// Función para mostrar notificaciones
function mostrarNotificacion(titulo, mensaje) {
    console.log(`📢 ${titulo}: ${mensaje}`);
    
    // Crear notificación visual
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
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 3000);
}
