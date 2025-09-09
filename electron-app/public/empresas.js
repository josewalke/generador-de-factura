// Empresas.js - Lógica para la página de gestión de empresas
const { ipcRenderer } = require('electron');

// Elementos del DOM
const totalEmpresas = document.getElementById('total-empresas');
const empresasList = document.getElementById('empresas-list');
const buscarEmpresa = document.getElementById('buscar-empresa');
const btnRefresh = document.getElementById('btn-refresh');
const btnNuevoEmpresa = document.getElementById('btn-nuevo-empresa');
const btnHome = document.getElementById('btn-home');

// Modal
const modalEmpresa = document.getElementById('modal-empresa');
const modalTitle = document.getElementById('modal-title');
const formEmpresa = document.getElementById('form-empresa');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnGuardar = document.getElementById('btn-guardar');

// Variables globales
let empresas = [];
let empresaEditando = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏢 Iniciando página de empresas...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar empresas
    await cargarEmpresas();
});

// Configurar event listeners
function configurarEventListeners() {
    // Navegación
    btnHome.addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    // Botones de la lista
    btnRefresh.addEventListener('click', cargarEmpresas);
    btnNuevoEmpresa.addEventListener('click', abrirModalNuevoEmpresa);

    // Búsqueda
    buscarEmpresa.addEventListener('input', filtrarEmpresas);

    // Modal
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    btnGuardar.addEventListener('click', guardarEmpresa);

    // Cerrar modal al hacer clic fuera
    modalEmpresa.addEventListener('click', (e) => {
        if (e.target === modalEmpresa) {
            cerrarModal();
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalEmpresa.style.display === 'flex') {
            cerrarModal();
        }
    });
}

// Cargar empresas desde el backend
async function cargarEmpresas() {
    try {
        console.log('📋 Cargando empresas...');
        mostrarEstadoCarga();
        
        const resultado = await ipcRenderer.invoke('api-obtener-empresas');
        
        if (resultado.success) {
            empresas = resultado.data;
            actualizarEstadisticas();
            renderizarListaEmpresas();
            console.log(`✅ ${empresas.length} empresas cargadas`);
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar empresas:', error);
        mostrarError('Error al cargar empresas: ' + error.message);
        mostrarEstadoError();
    }
}

// Mostrar estado de carga
function mostrarEstadoCarga() {
    empresasList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner-modern"></div>
            <p>Cargando empresas...</p>
        </div>
    `;
}

// Mostrar estado de error
function mostrarEstadoError() {
    empresasList.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error al cargar empresas</h3>
            <p>No se pudieron cargar las empresas. Inténtalo de nuevo.</p>
            <button onclick="cargarEmpresas()" class="btn-retry">🔄 Reintentar</button>
        </div>
    `;
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = empresas.length;
    
    totalEmpresas.textContent = total;
}

// Renderizar lista de empresas
function renderizarListaEmpresas() {
    if (empresas.length === 0) {
        empresasList.innerHTML = `
            <div class="empty-state-modern">
                <div class="empty-icon">📭</div>
                <h3>No hay empresas registradas</h3>
                <p>Comienza agregando tu primera empresa</p>
                <button onclick="abrirModalNuevoEmpresa()" class="btn-primary-modern">
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">Agregar Empresa</span>
                </button>
            </div>
        `;
        return;
    }

    const html = empresas.map(empresa => `
        <div class="cliente-card-modern" data-id="${empresa.id}">
            <div class="cliente-card-header" data-empresa-id="${empresa.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🏢</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${empresa.nombre}</h4>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-edit-modern" data-empresa-id="${empresa.id}" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action-modern btn-delete-modern" data-empresa-id="${empresa.id}" title="Eliminar">
                        🗑️
                    </button>
                    <span class="dropdown-arrow-modern" id="arrow-${empresa.id}">▼</span>
                </div>
            </div>
            <div class="cliente-card-details" id="details-${empresa.id}">
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <span class="detail-icon">🏢</span>
                        <div class="detail-content">
                            <label>Nombre</label>
                            <span>${empresa.nombre}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🆔</span>
                        <div class="detail-content">
                            <label>CIF</label>
                            <span>${empresa.cif}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📍</span>
                        <div class="detail-content">
                            <label>Dirección</label>
                            <span>${empresa.direccion}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📞</span>
                        <div class="detail-content">
                            <label>Teléfono</label>
                            <span>${empresa.telefono || 'No especificado'}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📧</span>
                        <div class="detail-content">
                            <label>Email</label>
                            <span>${empresa.email || 'No especificado'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    empresasList.innerHTML = html;
    
    // Agregar event listeners después de renderizar
    agregarEventListeners();
}

// Función para agregar event listeners a las tarjetas
function agregarEventListeners() {
    console.log('🔗 Agregando event listeners a las tarjetas...');
    
    // Event listeners para headers (dropdown)
    const headers = empresasList.querySelectorAll('.cliente-card-header');
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            const empresaId = header.getAttribute('data-empresa-id');
            console.log('🖱️ Click en header de la empresa:', empresaId);
            toggleDropdown(parseInt(empresaId));
        });
    });
    
    // Event listeners para botones de editar
    const botonesEditar = empresasList.querySelectorAll('.btn-edit-modern');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const empresaId = boton.getAttribute('data-empresa-id');
            console.log('✏️ Click en editar empresa:', empresaId);
            editarEmpresa(parseInt(empresaId));
        });
    });
    
    // Event listeners para botones de eliminar
    const botonesEliminar = empresasList.querySelectorAll('.btn-delete-modern');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const empresaId = boton.getAttribute('data-empresa-id');
            console.log('🗑️ Click en eliminar empresa:', empresaId);
            eliminarEmpresa(parseInt(empresaId));
        });
    });
}

// Toggle dropdown para mostrar/ocultar detalles
function toggleDropdown(id) {
    console.log('🔄 Intentando toggle dropdown para empresa ID:', id);
    
    const cardElement = document.querySelector(`[data-id="${id}"]`);
    const arrowElement = document.getElementById(`arrow-${id}`);
    
    console.log('🔍 Card element encontrado:', cardElement);
    console.log('🔍 Arrow element encontrado:', arrowElement);
    
    // Verificar que todos los elementos existen
    if (!cardElement) {
        console.error('❌ No se encontró la tarjeta de la empresa:', id);
        return;
    }
    
    if (!arrowElement) {
        console.error('❌ No se encontró la flecha para empresa:', id);
        return;
    }
    
    console.log('✅ Elementos encontrados, procediendo con toggle');
    
    // Verificar el estado actual usando clases CSS
    const isCurrentlyExpanded = cardElement.classList.contains('expanded');
    console.log('📊 Estado actual - expanded:', isCurrentlyExpanded);
    console.log('📊 Clases actuales de la tarjeta:', cardElement.className);
    
    if (!isCurrentlyExpanded) {
        console.log('📖 Expandindo detalles de la empresa:', id);
        cardElement.classList.add('expanded');
        arrowElement.textContent = '▲';
        arrowElement.classList.add('rotated');
        console.log('✅ Clase expanded agregada. Nuevas clases:', cardElement.className);
        console.log('✅ Clase rotated agregada al arrow. Nuevas clases:', arrowElement.className);
    } else {
        console.log('📖 Contrayendo detalles de la empresa:', id);
        cardElement.classList.remove('expanded');
        arrowElement.textContent = '▼';
        arrowElement.classList.remove('rotated');
        console.log('✅ Clase expanded removida. Nuevas clases:', cardElement.className);
        console.log('✅ Clase rotated removida del arrow. Nuevas clases:', arrowElement.className);
    }
}

// Filtrar empresas
function filtrarEmpresas() {
    const busqueda = buscarEmpresa.value.toLowerCase().trim();
    
    if (busqueda === '') {
        // Si la búsqueda está vacía, mostrar todas las empresas
        renderizarListaEmpresas();
        return;
    }
    
    const empresasFiltradas = empresas.filter(empresa => 
        empresa.nombre.toLowerCase().includes(busqueda) ||
        empresa.cif.toLowerCase().includes(busqueda) ||
        empresa.direccion.toLowerCase().includes(busqueda)
    );
    
    if (empresasFiltradas.length === 0) {
        empresasList.innerHTML = `
            <div class="no-results-state">
                <div class="no-results-icon">🔍</div>
                <h3>No se encontraron empresas</h3>
                <p>No hay empresas que coincidan con "${busqueda}"</p>
            </div>
        `;
        return;
    }
    
    const html = empresasFiltradas.map(empresa => `
        <div class="cliente-card-modern" data-id="${empresa.id}">
            <div class="cliente-card-header" data-empresa-id="${empresa.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🏢</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${empresa.nombre}</h4>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-edit-modern" data-empresa-id="${empresa.id}" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action-modern btn-delete-modern" data-empresa-id="${empresa.id}" title="Eliminar">
                        🗑️
                    </button>
                    <span class="dropdown-arrow-modern" id="arrow-${empresa.id}">▼</span>
                </div>
            </div>
            <div class="cliente-card-details" id="details-${empresa.id}">
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <span class="detail-icon">🏢</span>
                        <div class="detail-content">
                            <label>Nombre</label>
                            <span>${empresa.nombre}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🆔</span>
                        <div class="detail-content">
                            <label>CIF</label>
                            <span>${empresa.cif}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📍</span>
                        <div class="detail-content">
                            <label>Dirección</label>
                            <span>${empresa.direccion}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📞</span>
                        <div class="detail-content">
                            <label>Teléfono</label>
                            <span>${empresa.telefono || 'No especificado'}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📧</span>
                        <div class="detail-content">
                            <label>Email</label>
                            <span>${empresa.email || 'No especificado'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    empresasList.innerHTML = html;
    agregarEventListeners();
}

// Abrir modal para nueva empresa
function abrirModalNuevoEmpresa() {
    empresaEditando = null;
    modalTitle.textContent = 'Nueva Empresa';
    formEmpresa.reset();
    
    modalEmpresa.style.display = 'flex';
    
    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 100);
}

// Abrir modal para editar empresa
function editarEmpresa(id) {
    const empresa = empresas.find(e => e.id === id);
    if (!empresa) {
        mostrarError('Empresa no encontrada');
        return;
    }
    
    empresaEditando = empresa;
    modalTitle.textContent = 'Editar Empresa';
    
    // Llenar formulario con datos de la empresa
    document.getElementById('nombre').value = empresa.nombre;
    document.getElementById('cif').value = empresa.cif;
    document.getElementById('direccion').value = empresa.direccion;
    document.getElementById('telefono').value = empresa.telefono || '';
    document.getElementById('email').value = empresa.email || '';
    
    modalEmpresa.style.display = 'flex';
    
    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 100);
}

// Cerrar modal
function cerrarModal() {
    modalEmpresa.style.display = 'none';
    empresaEditando = null;
    formEmpresa.reset();
}

// Guardar empresa
async function guardarEmpresa() {
    const formData = new FormData(formEmpresa);
    const datos = {
        nombre: formData.get('nombre'),
        cif: formData.get('cif'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono'),
        email: formData.get('email')
    };
    
    // Validaciones básicas
    if (!datos.nombre || !datos.cif || !datos.direccion) {
        mostrarError('Los campos Nombre, CIF y Dirección son obligatorios');
        return;
    }
    
    let btnGuardarOriginal;
    
    try {
        btnGuardarOriginal = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '💾 Guardando...';
        btnGuardar.disabled = true;
        
        let resultado;
        
        if (empresaEditando) {
            // Editar empresa existente
            resultado = await ipcRenderer.invoke('api-actualizar-empresa', empresaEditando.id, datos);
        } else {
            // Crear nueva empresa
            resultado = await ipcRenderer.invoke('api-crear-empresa', datos);
        }
        
        if (resultado.success) {
            mostrarExito(empresaEditando ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente');
            cerrarModal();
            await cargarEmpresas();
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al guardar empresa:', error);
        mostrarError('Error al guardar empresa: ' + error.message);
    } finally {
        if (btnGuardarOriginal) {
            btnGuardar.innerHTML = btnGuardarOriginal;
            btnGuardar.disabled = false;
        }
    }
}

// Eliminar empresa
async function eliminarEmpresa(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
        return;
    }
    
    try {
        const resultado = await ipcRenderer.invoke('api-eliminar-empresa', id);
        
        if (resultado.success) {
            mostrarExito('Empresa eliminada correctamente');
            await cargarEmpresas();
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al eliminar empresa:', error);
        mostrarError('Error al eliminar empresa: ' + error.message);
    }
}

// Mostrar notificación de éxito
function mostrarExito(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-exito';
    notificacion.innerHTML = `
        <span class="notificacion-icon">✅</span>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// Mostrar notificación de error
function mostrarError(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-error';
    notificacion.innerHTML = `
        <span class="notificacion-icon">❌</span>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}
