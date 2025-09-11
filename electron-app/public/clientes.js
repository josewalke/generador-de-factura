// Clientes.js - Lógica para la página de gestión de clientes
const { ipcRenderer } = require('electron');

// Elementos del DOM
const totalClientes = document.getElementById('total-clientes');
const clientesList = document.getElementById('clientes-list');
const buscarCliente = document.getElementById('buscar-cliente');
const btnRefresh = document.getElementById('btn-refresh');
const btnNuevoCliente = document.getElementById('btn-nuevo-cliente');
const btnHome = document.getElementById('btn-home');

// Modal
const modalCliente = document.getElementById('modal-cliente');
const modalTitle = document.getElementById('modal-title');
const formCliente = document.getElementById('form-cliente');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnGuardar = document.getElementById('btn-guardar');

// Variables globales
let clientes = [];
let clienteEditando = null;
let empresas = [];

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('👥 Iniciando página de clientes...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar datos iniciales
    await cargarEmpresas();
    await cargarClientes();
});

// Configurar event listeners
function configurarEventListeners() {
    // Navegación
    btnHome.addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    // Botones de la lista
    btnRefresh.addEventListener('click', cargarClientes);
    btnNuevoCliente.addEventListener('click', abrirModalNuevoCliente);

    // Búsqueda
    buscarCliente.addEventListener('input', filtrarClientes);

    // Modal
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    btnGuardar.addEventListener('click', guardarCliente);

    // Cerrar modal al hacer clic fuera
    modalCliente.addEventListener('click', (e) => {
        if (e.target === modalCliente) {
            cerrarModal();
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalCliente.style.display === 'flex') {
            cerrarModal();
        }
    });
}

// Cargar empresas desde el backend
async function cargarEmpresas() {
    try {
        console.log('🏢 Cargando empresas...');
        
        const resultado = await ipcRenderer.invoke('api-obtener-empresas');
        
        if (resultado.success) {
            empresas = resultado.data;
            actualizarSelectEmpresas();
            console.log(`✅ ${empresas.length} empresas cargadas`);
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar empresas:', error);
        mostrarError('Error al cargar empresas: ' + error.message);
    }
}

// Actualizar el select de empresas
function actualizarSelectEmpresas() {
    const selectEmpresa = document.getElementById('empresa_id');
    if (!selectEmpresa) return;
    
    // Limpiar opciones existentes (excepto la primera)
    selectEmpresa.innerHTML = '<option value="">Seleccionar empresa...</option>';
    
    // Añadir empresas
    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nombre;
        selectEmpresa.appendChild(option);
    });
}

// Cargar clientes desde el backend
async function cargarClientes() {
    try {
        console.log('📋 Cargando clientes...');
        mostrarEstadoCarga();
        
        const resultado = await ipcRenderer.invoke('api-obtener-clientes');
        
        if (resultado.success) {
            clientes = resultado.data;
            actualizarEstadisticas();
            renderizarListaClientes();
            console.log(`✅ ${clientes.length} clientes cargados`);
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar clientes:', error);
        mostrarError('Error al cargar clientes: ' + error.message);
        mostrarEstadoError();
    }
}

// Mostrar estado de carga
function mostrarEstadoCarga() {
    clientesList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner-modern"></div>
            <p>Cargando clientes...</p>
        </div>
    `;
}

// Mostrar estado de error
function mostrarEstadoError() {
    clientesList.innerHTML = `
        <div class="error-state">
            <div class="error-icon">❌</div>
            <p>Error al cargar clientes</p>
            <button onclick="cargarClientes()" class="btn-retry">Reintentar</button>
        </div>
    `;
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = clientes.length;
    
    totalClientes.textContent = total;
}

// Renderizar lista de clientes
function renderizarListaClientes() {
    if (clientes.length === 0) {
        clientesList.innerHTML = `
            <div class="empty-state-modern">
                <div class="empty-icon">📭</div>
                <h3>No hay clientes registrados</h3>
                <p>Comienza agregando tu primer cliente</p>
                <button onclick="abrirModalNuevoCliente()" class="btn-primary-modern">
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">Agregar Cliente</span>
                </button>
            </div>
        `;
        return;
    }

    const html = clientes.map(cliente => `
        <div class="cliente-card-modern" data-id="${cliente.id}">
            <div class="cliente-card-header" data-cliente-id="${cliente.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">👤</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${cliente.nombre}</h4>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-edit-modern" data-cliente-id="${cliente.id}" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action-modern btn-delete-modern" data-cliente-id="${cliente.id}" title="Eliminar">
                        🗑️
                    </button>
                    <span class="dropdown-arrow-modern" id="arrow-${cliente.id}">▼</span>
                </div>
            </div>
            <div class="cliente-card-details" id="details-${cliente.id}">
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <span class="detail-icon">🆔</span>
                        <div class="detail-content">
                            <label>Identificación</label>
                            <span>${cliente.identificacion}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📍</span>
                        <div class="detail-content">
                            <label>Dirección</label>
                            <span>${cliente.direccion}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📮</span>
                        <div class="detail-content">
                            <label>Código Postal</label>
                            <span>${cliente.codigo_postal || 'No especificado'}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📧</span>
                        <div class="detail-content">
                            <label>Email</label>
                            <span>${cliente.email || 'No especificado'}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📞</span>
                        <div class="detail-content">
                            <label>Teléfono</label>
                            <span>${cliente.telefono || 'No especificado'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    clientesList.innerHTML = html;
    
    // Agregar event listeners después de renderizar
    agregarEventListeners();
}

// Función para agregar event listeners a las tarjetas
function agregarEventListeners() {
    console.log('🔗 Agregando event listeners a las tarjetas...');
    
    // Event listeners para headers (dropdown)
    const headers = clientesList.querySelectorAll('.cliente-card-header');
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            const clienteId = header.getAttribute('data-cliente-id');
            console.log('🖱️ Click en header del cliente:', clienteId);
            toggleDropdown(parseInt(clienteId));
        });
    });
    
    // Event listeners para botones de editar
    const botonesEditar = clientesList.querySelectorAll('.btn-edit-modern');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const clienteId = boton.getAttribute('data-cliente-id');
            console.log('✏️ Click en editar cliente:', clienteId);
            editarCliente(parseInt(clienteId));
        });
    });
    
    // Event listeners para botones de eliminar
    const botonesEliminar = clientesList.querySelectorAll('.btn-delete-modern');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const clienteId = boton.getAttribute('data-cliente-id');
            console.log('🗑️ Click en eliminar cliente:', clienteId);
            eliminarCliente(parseInt(clienteId));
        });
    });
}

// Toggle dropdown para mostrar/ocultar detalles
function toggleDropdown(id) {
    console.log('🔄 Intentando toggle dropdown para cliente ID:', id);
    
    const cardElement = document.querySelector(`[data-id="${id}"]`);
    const arrowElement = document.getElementById(`arrow-${id}`);
    
    console.log('🔍 Card element encontrado:', cardElement);
    console.log('🔍 Arrow element encontrado:', arrowElement);
    
    // Verificar que todos los elementos existen
    if (!cardElement) {
        console.error('❌ No se encontró la tarjeta del cliente:', id);
        return;
    }
    
    if (!arrowElement) {
        console.error('❌ No se encontró la flecha para cliente:', id);
        return;
    }
    
    console.log('✅ Elementos encontrados, procediendo con toggle');
    
    // Verificar el estado actual usando clases CSS
    const isCurrentlyExpanded = cardElement.classList.contains('expanded');
    console.log('📊 Estado actual - expanded:', isCurrentlyExpanded);
    console.log('📊 Clases actuales de la tarjeta:', cardElement.className);
    
    if (!isCurrentlyExpanded) {
        console.log('📖 Expandindo detalles del cliente:', id);
        cardElement.classList.add('expanded');
        arrowElement.textContent = '▲';
        arrowElement.classList.add('rotated');
        console.log('✅ Clase expanded agregada. Nuevas clases:', cardElement.className);
        console.log('✅ Clase rotated agregada al arrow. Nuevas clases:', arrowElement.className);
    } else {
        console.log('📖 Contrayendo detalles del cliente:', id);
        cardElement.classList.remove('expanded');
        arrowElement.textContent = '▼';
        arrowElement.classList.remove('rotated');
        console.log('✅ Clase expanded removida. Nuevas clases:', cardElement.className);
        console.log('✅ Clase rotated removida del arrow. Nuevas clases:', arrowElement.className);
    }
}

// Filtrar clientes
function filtrarClientes() {
    const busqueda = buscarCliente.value.toLowerCase();
    const items = clientesList.querySelectorAll('.cliente-card-modern');
    let resultadosEncontrados = 0;
    
    items.forEach(item => {
        const texto = item.textContent.toLowerCase();
        if (texto.includes(busqueda)) {
            item.style.display = '';
            resultadosEncontrados++;
        } else {
            item.style.display = 'none';
        }
    });

    // Mostrar mensaje si no hay resultados
    if (resultadosEncontrados === 0 && busqueda !== '') {
        clientesList.innerHTML = `
            <div class="no-results-state">
                <div class="no-results-icon">🔍</div>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
    } else if (busqueda === '') {
        // Si la búsqueda está vacía, volver a renderizar la lista completa
        renderizarListaClientes();
    }
}

// Abrir modal para nuevo cliente
function abrirModalNuevoCliente() {
    clienteEditando = null;
    modalTitle.textContent = 'Nuevo Cliente';
    formCliente.reset();
    modalCliente.style.display = 'flex';
    
    // Enfocar el primer campo
    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 100);
}

// Abrir modal para editar cliente
function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    clienteEditando = cliente;
    modalTitle.textContent = 'Editar Cliente';
    
    // Llenar formulario
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('identificacion').value = cliente.identificacion;
    document.getElementById('direccion').value = cliente.direccion;
    document.getElementById('codigo_postal').value = cliente.codigo_postal || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telefono').value = cliente.telefono || '';
    
    modalCliente.style.display = 'flex';
}

// Cerrar modal
function cerrarModal() {
    modalCliente.style.display = 'none';
    clienteEditando = null;
    formCliente.reset();
}

// Guardar cliente
async function guardarCliente() {
    let btnGuardarOriginal;
    
    try {
        const formData = new FormData(formCliente);
        const clienteData = {
            nombre: formData.get('nombre'),
            identificacion: formData.get('identificacion'),
            direccion: formData.get('direccion'),
            codigo_postal: formData.get('codigo_postal') || null,
            email: formData.get('email') || null,
            telefono: formData.get('telefono') || null
        };

        // Validaciones
        if (!clienteData.nombre || !clienteData.identificacion || !clienteData.direccion) {
            mostrarError('Por favor, completa todos los campos obligatorios');
            return;
        }

        // Mostrar estado de carga en el botón
        btnGuardarOriginal = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Guardando...</span>';
        btnGuardar.disabled = true;

        let resultado;
        if (clienteEditando) {
            // Actualizar cliente existente
            resultado = await ipcRenderer.invoke('api-actualizar-cliente', clienteEditando.id, clienteData);
        } else {
            // Crear nuevo cliente
            resultado = await ipcRenderer.invoke('api-crear-cliente', clienteData);
        }

        if (resultado.success) {
            cerrarModal();
            await cargarClientes();
            mostrarExito(clienteEditando ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al guardar cliente:', error);
        mostrarError('Error al guardar cliente: ' + error.message);
    } finally {
        // Restaurar botón solo si se cambió
        if (btnGuardarOriginal) {
            btnGuardar.innerHTML = btnGuardarOriginal;
            btnGuardar.disabled = false;
        }
    }
}

// Eliminar cliente
async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
        return;
    }

    try {
        const resultado = await ipcRenderer.invoke('api-desactivar-cliente', id);
        
        if (resultado.success) {
            await cargarClientes();
            mostrarExito('Cliente eliminado correctamente');
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al eliminar cliente:', error);
        mostrarError('Error al eliminar cliente: ' + error.message);
    }
}

// Funciones de utilidad
function mostrarExito(mensaje) {
    // Crear notificación de éxito
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-exito';
    notificacion.innerHTML = `
        <span class="notificacion-icon">✅</span>
        <span class="notificacion-texto">${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

function mostrarError(mensaje) {
    // Crear notificación de error
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-error';
    notificacion.innerHTML = `
        <span class="notificacion-icon">❌</span>
        <span class="notificacion-texto">${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 5000);
}

// Hacer funciones globales para onclick
window.abrirModalNuevoCliente = abrirModalNuevoCliente;
window.cargarClientes = cargarClientes;
