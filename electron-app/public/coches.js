// Coches.js - Lógica para la página de gestión de coches
const { ipcRenderer } = require('electron');

// Elementos del DOM
const totalCoches = document.getElementById('total-coches');
const cochesList = document.getElementById('coches-list');
const buscarCoche = document.getElementById('buscar-coche');
const btnRefresh = document.getElementById('btn-refresh');
const btnNuevoCoche = document.getElementById('btn-nuevo-coche');
const btnHome = document.getElementById('btn-home');

// Filtros avanzados
const btnFiltroAvanzado = document.getElementById('btn-filtro-avanzado');
const filtrosPanel = document.getElementById('filtros-avanzados');
const btnCerrarFiltros = document.getElementById('btn-cerrar-filtros');
const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
const filtroModelo = document.getElementById('filtro-modelo');

// Modal
const modalCoche = document.getElementById('modal-coche');
const modalTitle = document.getElementById('modal-title');
const formCoche = document.getElementById('form-coche');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCancelar = document.getElementById('btn-cancelar');
const btnGuardar = document.getElementById('btn-guardar');

// Variables globales
let coches = [];
let cocheEditando = null;
let filtrosActivos = {
    modelo: ''
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚗 Iniciando página de coches...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar coches
    await cargarCoches();
});

// Configurar event listeners
function configurarEventListeners() {
    // Navegación
    btnHome.addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    // Botones de la lista
    btnRefresh.addEventListener('click', cargarCoches);
    btnNuevoCoche.addEventListener('click', abrirModalNuevoCoche);

    // Filtros avanzados
    btnFiltroAvanzado.addEventListener('click', abrirFiltrosAvanzados);
    btnCerrarFiltros.addEventListener('click', cerrarFiltrosAvanzados);
    btnAplicarFiltros.addEventListener('click', aplicarFiltrosAvanzados);
    btnLimpiarFiltros.addEventListener('click', limpiarFiltrosAvanzados);

    // Búsqueda
    buscarCoche.addEventListener('input', filtrarCoches);

    // Modal
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    btnGuardar.addEventListener('click', guardarCoche);

    // Cerrar modal al hacer clic fuera
    modalCoche.addEventListener('click', (e) => {
        if (e.target === modalCoche) {
            cerrarModal();
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalCoche.style.display === 'flex') {
            cerrarModal();
        }
        if (e.key === 'Escape' && filtrosPanel.style.display === 'block') {
            cerrarFiltrosAvanzados();
        }
    });

}

// Cargar coches desde el backend
async function cargarCoches() {
    try {
        console.log('📋 Cargando coches...');
        mostrarEstadoCarga();
        
        const resultado = await ipcRenderer.invoke('api-obtener-coches');
        
        if (resultado.success) {
            coches = resultado.data;
            actualizarEstadisticas();
            renderizarListaCoches();
            console.log(`✅ ${coches.length} coches cargados`);
            
            // Actualizar opciones de filtros si el panel está abierto
            if (filtrosPanel.style.display === 'block') {
                cargarOpcionesFiltros();
            }
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar coches:', error);
        mostrarError('Error al cargar coches: ' + error.message);
        mostrarEstadoError();
    }
}

// Mostrar estado de carga
function mostrarEstadoCarga() {
    cochesList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner-modern"></div>
            <p>Cargando coches...</p>
        </div>
    `;
}
        
        // Mostrar estado de error
function mostrarEstadoError() {
        cochesList.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error al cargar coches</h3>
            <p>No se pudieron cargar los coches. Inténtalo de nuevo.</p>
            <button onclick="cargarCoches()" class="btn-retry">🔄 Reintentar</button>
            </div>
        `;
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = coches.length;
    
    totalCoches.textContent = total;
}

// Renderizar lista de coches
function renderizarListaCoches() {
    if (coches.length === 0) {
        cochesList.innerHTML = `
            <div class="empty-state-modern">
                <div class="empty-icon">🚗</div>
                <h3>No hay coches registrados</h3>
                <p>Comienza agregando tu primer coche</p>
                <button onclick="abrirModalNuevoCoche()" class="btn-primary-modern">
                    <span class="btn-icon">➕</span>
                    <span class="btn-text">Agregar Coche</span>
                </button>
            </div>
        `;
        return;
    }

    const html = coches.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-edit-modern" data-coche-id="${coche.id}" title="Editar">
                            ✏️
                        </button>
                    <button class="btn-action-modern btn-delete-modern" data-coche-id="${coche.id}" title="Eliminar">
                            🗑️
                        </button>
                    <span class="dropdown-arrow-modern" id="arrow-${coche.id}">▼</span>
                </div>
            </div>
            <div class="cliente-card-details" id="details-${coche.id}">
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <span class="detail-icon">🚗</span>
                        <div class="detail-content">
                            <label>Matrícula</label>
                            <span>${coche.matricula}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🔧</span>
                        <div class="detail-content">
                            <label>Chasis</label>
                            <span>${coche.chasis}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🎨</span>
                        <div class="detail-content">
                            <label>Color</label>
                            <span>${coche.color}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📏</span>
                        <div class="detail-content">
                            <label>Kilómetros</label>
                            <span>${coche.kms.toLocaleString()} km</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🏷️</span>
                        <div class="detail-content">
                            <label>Modelo</label>
                            <span>${coche.modelo}</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
    `).join('');

    cochesList.innerHTML = html;
    
    // Agregar event listeners después de renderizar
    agregarEventListeners();
}

// Función para agregar event listeners a las tarjetas
function agregarEventListeners() {
    console.log('🔗 Agregando event listeners a las tarjetas...');
    
    // Event listeners para headers (dropdown)
    const headers = cochesList.querySelectorAll('.cliente-card-header');
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            const cocheId = header.getAttribute('data-coche-id');
            console.log('🖱️ Click en header del coche:', cocheId);
            toggleDropdown(parseInt(cocheId));
        });
    });
    
    // Event listeners para botones de editar
    const botonesEditar = cochesList.querySelectorAll('.btn-edit-modern');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const cocheId = boton.getAttribute('data-coche-id');
            console.log('✏️ Click en editar coche:', cocheId);
            editarCoche(parseInt(cocheId));
        });
    });
    
    // Event listeners para botones de eliminar
    const botonesEliminar = cochesList.querySelectorAll('.btn-delete-modern');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const cocheId = boton.getAttribute('data-coche-id');
            console.log('🗑️ Click en eliminar coche:', cocheId);
            eliminarCoche(parseInt(cocheId));
        });
    });
}

// Toggle dropdown para mostrar/ocultar detalles
function toggleDropdown(id) {
    console.log('🔄 Intentando toggle dropdown para coche ID:', id);
    
    const cardElement = document.querySelector(`[data-id="${id}"]`);
    const arrowElement = document.getElementById(`arrow-${id}`);
    
    console.log('🔍 Card element encontrado:', cardElement);
    console.log('🔍 Arrow element encontrado:', arrowElement);
    
    // Verificar que todos los elementos existen
    if (!cardElement) {
        console.error('❌ No se encontró la tarjeta del coche:', id);
        return;
    }
    
    if (!arrowElement) {
        console.error('❌ No se encontró la flecha para coche:', id);
        return;
    }
    
    console.log('✅ Elementos encontrados, procediendo con toggle');
    
    // Verificar el estado actual usando clases CSS
    const isCurrentlyExpanded = cardElement.classList.contains('expanded');
    console.log('📊 Estado actual - expanded:', isCurrentlyExpanded);
    console.log('📊 Clases actuales de la tarjeta:', cardElement.className);
    
    if (!isCurrentlyExpanded) {
        console.log('📖 Expandindo detalles del coche:', id);
        cardElement.classList.add('expanded');
        arrowElement.textContent = '▲';
        arrowElement.classList.add('rotated');
        console.log('✅ Clase expanded agregada. Nuevas clases:', cardElement.className);
        console.log('✅ Clase rotated agregada al arrow. Nuevas clases:', arrowElement.className);
    } else {
        console.log('📖 Contrayendo detalles del coche:', id);
        cardElement.classList.remove('expanded');
        arrowElement.textContent = '▼';
        arrowElement.classList.remove('rotated');
        console.log('✅ Clase expanded removida. Nuevas clases:', cardElement.className);
        console.log('✅ Clase rotated removida del arrow. Nuevas clases:', arrowElement.className);
    }
}

// Filtrar coches
function filtrarCoches() {
    // Si hay filtros avanzados activos, usar la función de filtros avanzados
    if (filtrosActivos.modelo) {
        aplicarFiltrosYRenderizar();
        return;
    }
    
    const busqueda = buscarCoche.value.toLowerCase().trim();
    
    if (busqueda === '') {
        // Si la búsqueda está vacía, mostrar todos los coches
    renderizarListaCoches();
        return;
    }
    
    const cochesFiltrados = coches.filter(coche => 
        coche.matricula.toLowerCase().includes(busqueda) ||
        coche.chasis.toLowerCase().includes(busqueda) ||
        coche.color.toLowerCase().includes(busqueda) ||
        coche.modelo.toLowerCase().includes(busqueda) ||
        coche.kms.toString().includes(busqueda)
    );
    
    if (cochesFiltrados.length === 0) {
        cochesList.innerHTML = `
            <div class="no-results-state">
                <div class="no-results-icon">🔍</div>
                <h3>No se encontraron coches</h3>
                <p>No hay coches que coincidan con "${busqueda}"</p>
            </div>
        `;
        return;
    }
    
    const html = cochesFiltrados.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-edit-modern" data-coche-id="${coche.id}" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action-modern btn-delete-modern" data-coche-id="${coche.id}" title="Eliminar">
                        🗑️
                    </button>
                    <span class="dropdown-arrow-modern" id="arrow-${coche.id}">▼</span>
                </div>
            </div>
            <div class="cliente-card-details" id="details-${coche.id}">
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <span class="detail-icon">🚗</span>
                        <div class="detail-content">
                            <label>Matrícula</label>
                            <span>${coche.matricula}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🔧</span>
                        <div class="detail-content">
                            <label>Chasis</label>
                            <span>${coche.chasis}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🎨</span>
                        <div class="detail-content">
                            <label>Color</label>
                            <span>${coche.color}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📏</span>
                        <div class="detail-content">
                            <label>Kilómetros</label>
                            <span>${coche.kms.toLocaleString()} km</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🏷️</span>
                        <div class="detail-content">
                            <label>Modelo</label>
                            <span>${coche.modelo}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    cochesList.innerHTML = html;
    agregarEventListeners();
}

// Abrir modal para nuevo coche
function abrirModalNuevoCoche() {
    cocheEditando = null;
    modalTitle.textContent = 'Nuevo Coche';
    formCoche.reset();
    
    modalCoche.style.display = 'flex';
    
    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('matricula').focus();
    }, 100);
}

// Abrir modal para editar coche
function editarCoche(id) {
    const coche = coches.find(c => c.id === id);
    if (!coche) {
        mostrarError('Coche no encontrado');
        return;
    }

    cocheEditando = coche;
    modalTitle.textContent = 'Editar Coche';
    
    // Llenar formulario con datos del coche
    document.getElementById('matricula').value = coche.matricula;
    document.getElementById('chasis').value = coche.chasis;
    document.getElementById('color').value = coche.color;
    document.getElementById('kms').value = coche.kms;
    document.getElementById('modelo').value = coche.modelo;
    
    modalCoche.style.display = 'flex';
    
    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('matricula').focus();
    }, 100);
}

// Cerrar modal
function cerrarModal() {
    modalCoche.style.display = 'none';
    cocheEditando = null;
    formCoche.reset();
}

// Guardar coche
async function guardarCoche() {
        const formData = new FormData(formCoche);
    const datos = {
            matricula: formData.get('matricula'),
            chasis: formData.get('chasis'),
            color: formData.get('color'),
            kms: parseInt(formData.get('kms')),
            modelo: formData.get('modelo')
        };

    // Validaciones básicas
    if (!datos.matricula || !datos.chasis || !datos.color || !datos.modelo) {
        mostrarError('Los campos Matrícula, Chasis, Color y Modelo son obligatorios');
            return;
        }

    if (datos.kms < 0) {
            mostrarError('Los kilómetros no pueden ser negativos');
            return;
        }
    
    let btnGuardarOriginal;
    
    try {
        btnGuardarOriginal = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '💾 Guardando...';
        btnGuardar.disabled = true;

        let resultado;
        
        if (cocheEditando) {
            // Editar coche existente
            resultado = await ipcRenderer.invoke('api-actualizar-coche', cocheEditando.id, datos);
        } else {
            // Crear nuevo coche
            resultado = await ipcRenderer.invoke('api-crear-coche', datos);
        }

        if (resultado.success) {
            mostrarExito(cocheEditando ? 'Coche actualizado correctamente' : 'Coche creado correctamente');
            cerrarModal();
            await cargarCoches();
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al guardar coche:', error);
        mostrarError('Error al guardar coche: ' + error.message);
    } finally {
        if (btnGuardarOriginal) {
            btnGuardar.innerHTML = btnGuardarOriginal;
            btnGuardar.disabled = false;
        }
    }
}

// Eliminar coche
async function eliminarCoche(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este coche?')) {
        return;
    }

    try {
        const resultado = await ipcRenderer.invoke('api-eliminar-coche', id);
        
        if (resultado.success) {
            mostrarExito('Coche eliminado correctamente');
            await cargarCoches();
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error al eliminar coche:', error);
        mostrarError('Error al eliminar coche: ' + error.message);
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

// Funciones para filtros avanzados
function abrirFiltrosAvanzados() {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'filtros-overlay';
    overlay.id = 'filtros-overlay';
    document.body.appendChild(overlay);
    
    // Cargar opciones dinámicamente desde la base de datos
    cargarOpcionesFiltros();
    
    // Cargar valores actuales de los filtros
    filtroModelo.value = filtrosActivos.modelo;
    
    filtrosPanel.style.display = 'block';
    
    // Cerrar al hacer clic en overlay
    overlay.addEventListener('click', cerrarFiltrosAvanzados);
}

function cargarOpcionesFiltros() {
    // Extraer modelos únicos de los coches
    const modelosUnicos = [...new Set(coches.map(coche => coche.modelo).filter(modelo => modelo && modelo.trim() !== ''))].sort();
    
    // Actualizar dropdown de modelos
    const modeloSelect = document.getElementById('filtro-modelo');
    const opcionesModelosActuales = modeloSelect.querySelectorAll('option:not(:first-child)');
    opcionesModelosActuales.forEach(option => option.remove());
    
    modelosUnicos.forEach(modelo => {
        const option = document.createElement('option');
        option.value = modelo.toLowerCase();
        option.textContent = `🚙 ${modelo}`;
        modeloSelect.appendChild(option);
    });
    
    console.log(`📊 Filtros cargados: ${modelosUnicos.length} modelos`);
}

function cerrarFiltrosAvanzados() {
    filtrosPanel.style.display = 'none';
    
    // Remover overlay
    const overlay = document.getElementById('filtros-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function aplicarFiltrosAvanzados() {
    // Obtener valores de los filtros
    filtrosActivos.modelo = filtroModelo.value;
    
    console.log(`🔧 Aplicando filtros avanzados:`, filtrosActivos);
    
    // Aplicar filtros y cerrar panel
    aplicarFiltrosYRenderizar();
    cerrarFiltrosAvanzados();
    mostrarExito('Filtros aplicados correctamente');
}

function limpiarFiltrosAvanzados() {
    // Limpiar valores en el formulario
    filtroModelo.value = '';
    
    // Limpiar filtros activos
    filtrosActivos = {
        modelo: ''
    };
    
    // Aplicar filtros limpios
    aplicarFiltrosYRenderizar();
    mostrarExito('Filtros limpiados correctamente');
}

function aplicarFiltrosYRenderizar() {
    let cochesFiltrados = [...coches];
    
    // Aplicar filtro de búsqueda básica
    const busqueda = buscarCoche.value.toLowerCase().trim();
    if (busqueda) {
        cochesFiltrados = cochesFiltrados.filter(coche => 
            coche.matricula.toLowerCase().includes(busqueda) ||
            coche.chasis.toLowerCase().includes(busqueda) ||
            coche.color.toLowerCase().includes(busqueda) ||
            coche.modelo.toLowerCase().includes(busqueda) ||
            coche.kms.toString().includes(busqueda)
        );
    }
    
    // Aplicar filtro de modelo
    if (filtrosActivos.modelo) {
        cochesFiltrados = cochesFiltrados.filter(coche => 
            coche.modelo && coche.modelo.toLowerCase() === filtrosActivos.modelo.toLowerCase()
        );
    }
    
    console.log(`🎨 Renderizando ${cochesFiltrados.length} coches filtrados`);
    
    // Renderizar lista filtrada
    renderizarListaCochesFiltrada(cochesFiltrados);
}

function renderizarListaCochesFiltrada(cochesFiltrados) {
    if (cochesFiltrados.length === 0) {
        cochesList.innerHTML = `
            <div class="no-results-state">
                <div class="no-results-icon">🔍</div>
                <h3>No se encontraron coches</h3>
                <p>No hay coches que coincidan con los filtros aplicados</p>
                <button onclick="limpiarFiltrosAvanzados()" class="btn-primary-modern">
                    <span class="btn-icon">🗑️</span>
                    <span class="btn-text">Limpiar Filtros</span>
                </button>
            </div>
        `;
        return;
    }

    const html = cochesFiltrados.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-edit-modern" data-coche-id="${coche.id}" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-action-modern btn-delete-modern" data-coche-id="${coche.id}" title="Eliminar">
                        🗑️
                    </button>
                    <span class="dropdown-arrow-modern" id="arrow-${coche.id}">▼</span>
                </div>
            </div>
            <div class="cliente-card-details" id="details-${coche.id}">
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <span class="detail-icon">🚗</span>
                        <div class="detail-content">
                            <label>Matrícula</label>
                            <span>${coche.matricula}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🔧</span>
                        <div class="detail-content">
                            <label>Chasis</label>
                            <span>${coche.chasis}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🎨</span>
                        <div class="detail-content">
                            <label>Color</label>
                            <span>${coche.color}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📏</span>
                        <div class="detail-content">
                            <label>Kilómetros</label>
                            <span>${coche.kms.toLocaleString()} km</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">🏷️</span>
                        <div class="detail-content">
                            <label>Modelo</label>
                            <span>${coche.modelo}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    cochesList.innerHTML = html;
    agregarEventListeners();
}
