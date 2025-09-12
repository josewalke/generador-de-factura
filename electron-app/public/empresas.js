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
    console.log('[EMPRESAS] Iniciando página de empresas...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Configurar event listeners para certificados
    configurarEventListenersCertificados();
    
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
                    <div class="detail-item-modern certificado-item-modern" id="certificado-${empresa.id}">
                        <span class="detail-icon">🔐</span>
                        <div class="detail-content">
                            <label>Certificado Digital</label>
                            <span class="certificado-status" id="cert-status-${empresa.id}">Cargando...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    empresasList.innerHTML = html;
    
    // Agregar event listeners después de renderizar
    agregarEventListeners();
    
    // Cargar información de certificados para cada empresa (con delay para asegurar que el DOM esté listo)
    setTimeout(() => {
        cargarCertificadosEmpresas();
    }, 100);
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
    
    // Esperar un poco para que el modal se renderice completamente
    setTimeout(async () => {
        console.log('[CERT] Cargando certificados después de abrir modal de nueva empresa...');
        // Cargar certificados disponibles
        await cargarCertificadosDisponibles();
        
        // Limpiar selección de certificado para nueva empresa
        if (certificadoSelect) {
            certificadoSelect.value = '';
        }
    }, 200);
}

// Abrir modal para editar empresa
async function editarEmpresa(id) {
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
    
    // Esperar un poco para que el modal se renderice completamente
    setTimeout(async () => {
        console.log('[CERT] Cargando certificados después de abrir modal de edición...');
        // Cargar certificados disponibles
        await cargarCertificadosDisponibles();
        
        // Cargar certificado asociado a la empresa
        await cargarCertificadoEmpresa(empresa.id);
    }, 200);
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
        email: formData.get('email'),
        firmaDigitalThumbprint: formData.get('certificado-digital') || null
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
            // Manejar errores específicos de certificados
            if (resultado.certificadoExpirado) {
                mostrarErrorCertificadoExpirado(resultado);
            } else if (resultado.certificadoProximoExpirado) {
                mostrarAdvertenciaCertificadoProximoExpirado(resultado);
            } else {
                throw new Error(resultado.error);
            }
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

// Mostrar error específico de certificado expirado
function mostrarErrorCertificadoExpirado(resultado) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-error certificado-expirado';
    notificacion.innerHTML = `
        <div class="notificacion-header">
            <span class="notificacion-icon">🚫</span>
            <span class="notificacion-titulo">Certificado Digital Expirado</span>
        </div>
        <div class="notificacion-mensaje">${resultado.error}</div>
        <div class="notificacion-detalles">
            <div class="detalle-item">
                <strong>Empresa:</strong> ${resultado.empresa?.nombre || 'N/A'}
            </div>
            <div class="detalle-item">
                <strong>Certificado:</strong> ${resultado.certificado?.CommonName || 'N/A'}
            </div>
            <div class="detalle-item">
                <strong>Fecha de expiración:</strong> ${resultado.fechaExpiracion ? new Date(resultado.fechaExpiracion).toLocaleDateString('es-ES') : 'N/A'}
            </div>
            <div class="detalle-item">
                <strong>Días restantes:</strong> ${resultado.diasRestantes || 0} días
            </div>
        </div>
        <div class="notificacion-accion">
            <button onclick="this.parentElement.parentElement.remove()" class="btn-cerrar-notificacion">
                Entendido
            </button>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    // No se cierra automáticamente para certificados expirados
}

// Mostrar advertencia de certificado próximo a expirar
function mostrarAdvertenciaCertificadoProximoExpirado(resultado) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-advertencia certificado-proximo-expirado';
    notificacion.innerHTML = `
        <div class="notificacion-header">
            <span class="notificacion-icon">⚠️</span>
            <span class="notificacion-titulo">Certificado Próximo a Expirar</span>
        </div>
        <div class="notificacion-mensaje">${resultado.error}</div>
        <div class="notificacion-detalles">
            <div class="detalle-item">
                <strong>Empresa:</strong> ${resultado.empresa?.nombre || 'N/A'}
            </div>
            <div class="detalle-item">
                <strong>Certificado:</strong> ${resultado.certificado?.CommonName || 'N/A'}
            </div>
            <div class="detalle-item">
                <strong>Fecha de expiración:</strong> ${resultado.fechaExpiracion ? new Date(resultado.fechaExpiracion).toLocaleDateString('es-ES') : 'N/A'}
            </div>
            <div class="detalle-item">
                <strong>Días restantes:</strong> ${resultado.diasRestantes || 0} días
            </div>
        </div>
        <div class="notificacion-accion">
            <button onclick="this.parentElement.parentElement.remove()" class="btn-cerrar-notificacion">
                Entendido
            </button>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    // Se cierra automáticamente después de 10 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 10000);
}

// ===== FUNCIONES PARA CERTIFICADOS DIGITALES =====

// Elementos del DOM para certificados
const certificadoSelect = document.getElementById('certificado-digital');
const btnRefreshCertificados = document.getElementById('btn-refresh-certificados');
const certificadoInfo = document.getElementById('certificado-info');

// Variables para certificados
let certificadosDisponibles = [];

// Configurar event listeners para certificados
function configurarEventListenersCertificados() {
    console.log('[CERT] Configurando event listeners para certificados...');
    
    // Verificar que los elementos existan
    if (!certificadoSelect) {
        console.error('[CERT] ERROR: No se encontró el elemento certificadoSelect');
        return;
    }
    
    if (!btnRefreshCertificados) {
        console.error('[CERT] ERROR: No se encontró el elemento btnRefreshCertificados');
        return;
    }
    
    if (!certificadoInfo) {
        console.error('[CERT] ERROR: No se encontró el elemento certificadoInfo');
        return;
    }
    
    console.log('[CERT] OK: Elementos de certificados encontrados');
    
    // Botón de actualizar certificados
    btnRefreshCertificados.addEventListener('click', cargarCertificadosDisponibles);
    
    // Cambio de selección de certificado
    certificadoSelect.addEventListener('change', mostrarInfoCertificado);
    
    console.log('[CERT] OK: Event listeners de certificados configurados');
}

// Cargar certificados disponibles
async function cargarCertificadosDisponibles() {
    console.log('[CERT] Cargando certificados disponibles...');
    
    try {
        if (!certificadoSelect) {
            console.error('[CERT] ERROR: Elemento certificadoSelect no encontrado');
            console.log('[CERT] Elementos disponibles en el DOM:');
            console.log('[CERT] - certificado-digital:', document.getElementById('certificado-digital'));
            console.log('[CERT] - Todos los elementos con ID:', document.querySelectorAll('[id]'));
            return;
        }
        
        console.log('[CERT] Elemento certificadoSelect encontrado:', certificadoSelect);
        console.log('[CERT] Estableciendo estado de carga...');
        certificadoSelect.innerHTML = '<option value="">Cargando certificados...</option>';
        certificadoSelect.disabled = true;
        
        console.log('[CERT] Llamando a API para obtener firmas...');
        console.log('[CERT] IPC Renderer disponible:', typeof ipcRenderer);
        
        const resultado = await ipcRenderer.invoke('api-obtener-firmas-disponibles');
        console.log('[CERT] Resultado completo de API:', JSON.stringify(resultado, null, 2));
        console.log('[CERT] Tipo de resultado:', typeof resultado);
        console.log('[CERT] Resultado.success:', resultado?.success);
        console.log('[CERT] Resultado.firmas:', resultado?.firmas);
        console.log('[CERT] Resultado.total:', resultado?.total);
        
        if (resultado && resultado.success) {
            certificadosDisponibles = resultado.firmas || [];
            console.log(`[CERT] OK: Se cargaron ${certificadosDisponibles.length} certificados`);
            console.log('[CERT] Certificados disponibles:', certificadosDisponibles);
            actualizarSelectCertificados();
            mostrarExito(`Se cargaron ${resultado.total || certificadosDisponibles.length} certificados disponibles`);
        } else {
            console.error('[CERT] ERROR: Respuesta de API no exitosa:', resultado);
            throw new Error(resultado?.error || 'Error al cargar certificados');
        }
        
    } catch (error) {
        console.error('[CERT] ERROR completo al cargar certificados:', error);
        console.error('[CERT] Stack trace:', error.stack);
        if (certificadoSelect) {
            certificadoSelect.innerHTML = '<option value="">Error al cargar certificados</option>';
        }
        mostrarError('Error al cargar certificados: ' + error.message);
    } finally {
        if (certificadoSelect) {
            certificadoSelect.disabled = false;
            console.log('[CERT] Select habilitado nuevamente');
        }
    }
}

// Actualizar el select con los certificados disponibles
function actualizarSelectCertificados() {
    console.log('[CERT] Actualizando select de certificados...');
    console.log('[CERT] Certificados disponibles para actualizar:', certificadosDisponibles);
    console.log('[CERT] Tipo de certificadosDisponibles:', typeof certificadosDisponibles);
    console.log('[CERT] Es array:', Array.isArray(certificadosDisponibles));
    console.log('[CERT] Longitud:', certificadosDisponibles?.length);
    
    if (!certificadoSelect) {
        console.error('[CERT] ERROR: Elemento certificadoSelect no encontrado');
        return;
    }
    
    console.log('[CERT] Limpiando select...');
    certificadoSelect.innerHTML = '<option value="">Seleccionar certificado...</option>';
    
    if (!certificadosDisponibles || certificadosDisponibles.length === 0) {
        certificadoSelect.innerHTML = '<option value="">No hay certificados disponibles</option>';
        console.log('[CERT] WARNING: No hay certificados disponibles');
        return;
    }
    
    console.log(`[CERT] Agregando ${certificadosDisponibles.length} certificados al select`);
    
    certificadosDisponibles.forEach((certificado, index) => {
        console.log(`[CERT] Procesando certificado ${index + 1}:`, certificado);
        
        const option = document.createElement('option');
        option.value = certificado.thumbprint || '';
        
        // Extraer organización del certificado
        const organizacion = extraerOrganizacionDeFirma(certificado);
        const nombreMostrar = organizacion || certificado.empresa || certificado.descripcion || 'Certificado sin nombre';
        
        option.textContent = `${nombreMostrar} ${certificado.isValido ? 'OK' : 'EXPIRADO'}`;
        
        // Agregar clases para estilos
        if (certificado.isValido) {
            option.className = 'certificado-valido';
        } else {
            option.className = 'certificado-expirado';
        }
        
        certificadoSelect.appendChild(option);
        console.log(`[CERT] OK: Agregado certificado ${index + 1}: ${nombreMostrar}`);
    });
    
    console.log('[CERT] OK: Select de certificados actualizado completamente');
    console.log(`[CERT] Total de opciones en select: ${certificadoSelect.options.length}`);
}

// Mostrar información del certificado seleccionado
function mostrarInfoCertificado() {
    const thumbprint = certificadoSelect.value;
    
    if (!thumbprint) {
        certificadoInfo.style.display = 'none';
        return;
    }
    
    const certificado = certificadosDisponibles.find(c => c.thumbprint === thumbprint);
    
    if (!certificado) {
        certificadoInfo.style.display = 'none';
        return;
    }
    
    // Actualizar información del certificado
    const organizacion = extraerOrganizacionDeFirma(certificado);
    document.getElementById('cert-empresa').textContent = organizacion || certificado.empresa || 'N/A';
    document.getElementById('cert-cif').textContent = certificado.cif || 'N/A';
    document.getElementById('cert-valido-hasta').textContent = certificado.validoHasta || 'N/A';
    document.getElementById('cert-dias-restantes').textContent = certificado.diasRestantes ? `${certificado.diasRestantes} días` : 'N/A';
    
    // Actualizar estado con colores
    const estadoElement = document.getElementById('cert-estado');
    if (certificado.isValido) {
        estadoElement.textContent = 'Válido';
        estadoElement.className = 'certificado-value certificado-estado-valido';
    } else {
        estadoElement.textContent = 'Expirado';
        estadoElement.className = 'certificado-value certificado-estado-expirado';
    }
    
    // Mostrar información
    certificadoInfo.style.display = 'block';
}

// Cargar certificado asociado a una empresa
async function cargarCertificadoEmpresa(empresaId) {
    try {
        const resultado = await ipcRenderer.invoke('api-obtener-certificado-empresa', empresaId);
        
        if (resultado.success) {
            // Seleccionar el certificado en el select
            certificadoSelect.value = resultado.thumbprint;
            mostrarInfoCertificado();
        } else {
            // No hay certificado asociado
            certificadoSelect.value = '';
            certificadoInfo.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error al cargar certificado de empresa:', error);
        certificadoSelect.value = '';
        certificadoInfo.style.display = 'none';
    }
}

// Función para probar certificados manualmente (debug)
window.probarCertificadosManual = async () => {
    console.log('[CERT] Llamando a cargarCertificadosDisponibles...');
    cargarCertificadosDisponibles().then(() => {
        console.log('[CERT] Certificados cargados manualmente');
    }).catch(error => {
        console.error('[CERT] Error al cargar certificados manualmente:', error);
    });
};

// Modificar la función abrirModalNuevoEmpresa para cargar certificados
const abrirModalNuevoEmpresaOriginal = abrirModalNuevoEmpresa;
async function abrirModalNuevoEmpresa() {
    console.log('🏢 Abriendo modal para nueva empresa...');
    await abrirModalNuevoEmpresaOriginal();
    
    // Esperar un poco para que el modal se renderice completamente
    setTimeout(async () => {
        console.log('🔐 Cargando certificados después de abrir modal...');
        // Cargar certificados disponibles
        await cargarCertificadosDisponibles();
        
        // Limpiar selección de certificado
        if (certificadoSelect) {
            certificadoSelect.value = '';
        }
        if (certificadoInfo) {
            certificadoInfo.style.display = 'none';
        }
    }, 100);
}

// Modificar la función limpiarModal para limpiar certificados
const limpiarModalOriginal = limpiarModal;
function limpiarModal() {
    limpiarModalOriginal();
    
    // Limpiar certificados
    certificadoSelect.value = '';
    certificadoInfo.style.display = 'none';
    certificadosDisponibles = [];
}

// Función para extraer la organización del certificado en el select
function extraerOrganizacionDeFirma(certificado) {
    // Para certificados que vienen del endpoint de firmas disponibles
    if (certificado.sujeto) {
        const match = certificado.sujeto.match(/O=([^,]+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    // Para certificados que vienen del endpoint de certificado específico
    if (certificado.Subject) {
        const match = certificado.Subject.match(/O=([^,]+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return null;
}

// Función para extraer la organización del certificado
function extraerOrganizacion(certificado) {
    if (!certificado.Subject) {
        return null;
    }
    
    // Buscar el campo O= en el Subject
    const match = certificado.Subject.match(/O=([^,]+)/);
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return null;
}

// Cargar información de certificados para todas las empresas
async function cargarCertificadosEmpresas() {
    console.log('[CERT] Cargando certificados para todas las empresas...');
    console.log('[CERT] Total empresas:', empresas.length);
    
    for (const empresa of empresas) {
        try {
            console.log(`[CERT] Procesando empresa: ${empresa.nombre} (ID: ${empresa.id})`);
            const resultado = await ipcRenderer.invoke('api-obtener-certificado-empresa', empresa.id);
            console.log(`[CERT] Resultado para empresa ${empresa.nombre}:`, resultado);
            
            const statusElement = document.getElementById(`cert-status-${empresa.id}`);
            console.log(`[CERT] Elemento DOM encontrado para empresa ${empresa.id}:`, statusElement);
            
            if (statusElement) {
                if (resultado.success && resultado.certificado) {
                    const certificado = resultado.certificado;
                    console.log(`[CERT] Certificado encontrado para ${empresa.nombre}:`, certificado);
                    
                    const diasRestantes = certificado.DaysUntilExpiry || certificado.diasRestantes || 0;
                    const esValido = certificado.IsValid || certificado.valido || false;
                    
                    let estadoClass = 'certificado-sin-certificado';
                    let estadoText = 'Sin certificado';
                    
                    if (esValido) {
                        if (diasRestantes > 30) {
                            estadoClass = 'certificado-valido';
                            estadoText = extraerOrganizacion(certificado) || certificado.CommonName || certificado.empresa || 'Certificado válido';
                        } else if (diasRestantes > 0) {
                            estadoClass = 'certificado-proximo-expiracion';
                            estadoText = extraerOrganizacion(certificado) || certificado.CommonName || certificado.empresa || 'Certificado próximo a expirar';
                        } else {
                            estadoClass = 'certificado-expirado';
                            estadoText = extraerOrganizacion(certificado) || certificado.CommonName || certificado.empresa || 'Certificado expirado';
                        }
                    } else if (certificado.Organization || certificado.CommonName || certificado.empresa) {
                        estadoClass = 'certificado-expirado';
                        estadoText = extraerOrganizacion(certificado) || certificado.CommonName || certificado.empresa || 'Certificado expirado';
                    }
                    
                    statusElement.className = `certificado-status ${estadoClass}`;
                    statusElement.textContent = estadoText;
                    
                    console.log(`[CERT] Certificado cargado para empresa ${empresa.nombre}: ${estadoText}`);
                } else {
                    statusElement.className = 'certificado-status certificado-sin-certificado';
                    statusElement.textContent = 'Sin certificado';
                    console.log(`[CERT] Sin certificado para empresa ${empresa.nombre}`);
                }
            } else {
                console.error(`[CERT] No se encontró el elemento DOM para empresa ${empresa.id}`);
            }
        } catch (error) {
            console.error(`[CERT] Error al cargar certificado para empresa ${empresa.nombre}:`, error);
            const statusElement = document.getElementById(`cert-status-${empresa.id}`);
            if (statusElement) {
                statusElement.className = 'certificado-status certificado-error';
                statusElement.textContent = 'Error al cargar';
            }
        }
    }
}

// Función de prueba manual para certificados
function probarCertificadosManual() {
    console.log('[CERT] Iniciando prueba manual de certificados...');
    
    // Verificar elementos
    console.log('[CERT] Verificando elementos:');
    console.log('- certificadoSelect:', certificadoSelect);
    console.log('- btnRefreshCertificados:', btnRefreshCertificados);
    console.log('- certificadoInfo:', certificadoInfo);
    
    // Verificar IPC
    console.log('[CERT] Verificando IPC:');
    console.log('- ipcRenderer:', typeof ipcRenderer);
    console.log('- invoke disponible:', typeof ipcRenderer.invoke);
    
    // Llamar función de carga
    console.log('[CERT] Llamando a cargarCertificadosDisponibles...');
    cargarCertificadosDisponibles().then(() => {
        console.log('[CERT] OK: Prueba manual completada');
    }).catch((error) => {
        console.error('[CERT] ERROR en prueba manual:', error);
    });
}

// Exponer función de prueba globalmente
window.probarCertificadosManual = probarCertificadosManual;
