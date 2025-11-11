// Coches.js - Lógica para la página de gestión de coches
const { ipcRenderer } = require('electron');

// Elementos del DOM
const totalCoches = document.getElementById('total-coches');
const totalDisponibles = document.getElementById('total-disponibles');
const totalVendidos = document.getElementById('total-vendidos');
const cochesDisponiblesList = document.getElementById('coches-disponibles-list');
const cochesVendidosList = document.getElementById('coches-vendidos-list');
const countDisponibles = document.getElementById('count-disponibles');
const countVendidos = document.getElementById('count-vendidos');
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
let cochesDisponibles = [];
let cochesVendidos = [];
let cocheEditando = null;
let filtrosActivos = {
    modelo: ''
};

// Elementos de importación Excel
const btnImportarExcel = document.getElementById('btn-importar-excel');
const modalImportarExcel = document.getElementById('modal-importar-excel');
const btnCerrarModalExcel = document.getElementById('btn-cerrar-modal-excel');
const btnCancelarExcel = document.getElementById('btn-cancelar-excel');
const btnImportar = document.getElementById('btn-importar');
const fileInput = document.getElementById('file-input');
const btnSeleccionarArchivo = document.getElementById('btn-seleccionar-archivo');
const fileUploadArea = document.getElementById('file-upload-area');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const btnRemoverArchivo = document.getElementById('btn-remover-archivo');
const btnDescargarPlantilla = document.getElementById('btn-descargar-plantilla');
const modalResultadosImportacion = document.getElementById('modal-resultados-importacion');
const btnCerrarResultados = document.getElementById('btn-cerrar-resultados');
const btnCerrarResultadosFooter = document.getElementById('btn-cerrar-resultados-footer');
const importResults = document.getElementById('import-results');

// Elementos de exportación Excel
const btnExportarExcel = document.getElementById('btn-exportar-excel');

// Variables para importación
let archivoSeleccionado = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚗 Iniciando página de coches...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Cargar coches
    await cargarCochesSeparados();
});

// Configurar event listeners
function configurarEventListeners() {
    // Navegación
    btnHome.addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    // Botones de la lista
    btnRefresh.addEventListener('click', cargarCochesSeparados);
    btnNuevoCoche.addEventListener('click', abrirModalNuevoCoche);

    // Filtros avanzados
    btnFiltroAvanzado.addEventListener('click', abrirFiltrosAvanzados);
    btnCerrarFiltros.addEventListener('click', cerrarFiltrosAvanzados);
    btnAplicarFiltros.addEventListener('click', aplicarFiltrosAvanzados);
    btnLimpiarFiltros.addEventListener('click', limpiarFiltrosAvanzados);

    // Búsqueda
    buscarCoche.addEventListener('input', filtrarCochesSeparados);

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
    
    // Importación Excel
    btnImportarExcel.addEventListener('click', abrirModalImportacion);
    btnCerrarModalExcel.addEventListener('click', cerrarModalImportacion);
    btnCancelarExcel.addEventListener('click', cerrarModalImportacion);
    btnImportar.addEventListener('click', importarCoches);
    btnSeleccionarArchivo.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', manejarSeleccionArchivo);
    btnRemoverArchivo.addEventListener('click', removerArchivo);
    btnDescargarPlantilla.addEventListener('click', descargarPlantilla);
    btnCerrarResultados.addEventListener('click', cerrarModalResultados);
    btnCerrarResultadosFooter.addEventListener('click', cerrarModalResultados);
    
    // Exportación Excel
    btnExportarExcel.addEventListener('click', exportarCoches);
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', manejarDragOver);
    fileUploadArea.addEventListener('dragleave', manejarDragLeave);
    fileUploadArea.addEventListener('drop', manejarDrop);
    fileUploadArea.addEventListener('click', () => fileInput.click());
    
    // Cerrar modales al hacer clic fuera
    modalImportarExcel.addEventListener('click', (e) => {
        if (e.target === modalImportarExcel) {
            cerrarModalImportacion();
        }
    });
    
    modalResultadosImportacion.addEventListener('click', (e) => {
        if (e.target === modalResultadosImportacion) {
            cerrarModalResultados();
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalCoche.style.display === 'flex') {
                cerrarModal();
            } else if (filtrosPanel.style.display === 'block') {
                cerrarFiltrosAvanzados();
            } else if (modalImportarExcel.style.display === 'flex') {
                cerrarModalImportacion();
            } else if (modalResultadosImportacion.style.display === 'flex') {
                cerrarModalResultados();
            }
        }
    });

}

// ==================== FUNCIONES DE IMPORTACIÓN EXCEL ====================

// Abrir modal de importación
function abrirModalImportacion() {
    console.log('📊 Abriendo modal de importación Excel...');
    modalImportarExcel.style.display = 'flex';
    resetearFormularioImportacion();
}

// Cerrar modal de importación
function cerrarModalImportacion() {
    console.log('📊 Cerrando modal de importación Excel...');
    modalImportarExcel.style.display = 'none';
    resetearFormularioImportacion();
}

// Resetear formulario de importación
function resetearFormularioImportacion() {
    archivoSeleccionado = null;
    fileInput.value = '';
    fileUploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
    btnImportar.disabled = true;
}

// Manejar selección de archivo
function manejarSeleccionArchivo(event) {
    const archivo = event.target.files[0];
    if (archivo) {
        procesarArchivo(archivo);
    }
}

// Manejar drag over
function manejarDragOver(event) {
    event.preventDefault();
    fileUploadArea.classList.add('dragover');
}

// Manejar drag leave
function manejarDragLeave(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

// Manejar drop
function manejarDrop(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const archivos = event.dataTransfer.files;
    if (archivos.length > 0) {
        procesarArchivo(archivos[0]);
    }
}

// Procesar archivo seleccionado
function procesarArchivo(archivo) {
    // Validar tipo de archivo
    const tiposPermitidos = ['.xlsx', '.xls'];
    const extension = archivo.name.toLowerCase().substring(archivo.name.lastIndexOf('.'));
    
    if (!tiposPermitidos.includes(extension)) {
        mostrarNotificacion('❌ Solo se permiten archivos Excel (.xlsx, .xls)', 'error');
        return;
    }
    
    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (archivo.size > maxSize) {
        mostrarNotificacion('❌ El archivo es demasiado grande. Máximo 10MB', 'error');
        return;
    }
    
    archivoSeleccionado = archivo;
    
    // Mostrar información del archivo
    fileName.textContent = archivo.name;
    fileSize.textContent = formatearTamaño(archivo.size);
    
    fileUploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';
    btnImportar.disabled = false;
    
    console.log('📄 Archivo seleccionado:', archivo.name, formatearTamaño(archivo.size));
}

// Remover archivo
function removerArchivo() {
    archivoSeleccionado = null;
    fileInput.value = '';
    fileUploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
    btnImportar.disabled = true;
}

// Formatear tamaño de archivo
function formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Descargar plantilla
function descargarPlantilla() {
    console.log('📥 Descargando plantilla de coches...');
    
    const url = 'http://localhost:3000/api/importar/plantilla/coches';
    
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_coches.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarNotificacion('📥 Descargando plantilla...', 'info');
}

// Importar coches
async function importarCoches() {
    if (!archivoSeleccionado) {
        mostrarNotificacion('❌ Por favor selecciona un archivo', 'error');
        return;
    }
    
    console.log('📊 Iniciando importación de coches...');
    
    // Mostrar estado de carga
    btnImportar.disabled = true;
    btnImportar.innerHTML = '<span class="import-spinner"></span>Importando...';
    
    try {
        const formData = new FormData();
        formData.append('archivo', archivoSeleccionado);
        
        const response = await fetch('http://localhost:3000/api/importar/coches', {
            method: 'POST',
            body: formData
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            console.log('✅ Importación exitosa:', resultado);
            mostrarResultadosImportacion(resultado);
            
            // Recargar lista de coches
            await cargarCochesSeparados();
            
            // Cerrar modal de importación
            cerrarModalImportacion();
        } else {
            console.error('❌ Error en importación:', resultado.error);
            mostrarNotificacion(`❌ Error: ${resultado.error}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        mostrarNotificacion('❌ Error de conexión con el servidor', 'error');
    } finally {
        // Restaurar botón
        btnImportar.disabled = false;
        btnImportar.innerHTML = '<span class="btn-icon">📊</span><span class="btn-text">Importar</span>';
    }
}

// Mostrar resultados de importación
function mostrarResultadosImportacion(resultado) {
    console.log('📊 Mostrando resultados de importación...');
    
    let html = '';
    
    // Resumen
    const esExitoso = resultado.errores === 0;
    const tieneErrores = resultado.errores > 0;
    
    html += `
        <div class="result-summary ${esExitoso ? 'success' : tieneErrores ? 'warning' : 'error'}">
            <h4>${esExitoso ? '✅ Importación Exitosa' : tieneErrores ? '⚠️ Importación Parcial' : '❌ Importación Fallida'}</h4>
            <p>Se procesaron ${resultado.total} registros en total.</p>
        </div>
    `;
    
    // Estadísticas
    html += `
        <div class="result-stats">
            <div class="stat-item">
                <div class="stat-number success">${resultado.importados}</div>
                <div class="stat-label">Importados</div>
            </div>
            <div class="stat-item">
                <div class="stat-number ${resultado.errores > 0 ? 'error' : 'success'}">${resultado.errores}</div>
                <div class="stat-label">Errores</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${resultado.total}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>
    `;
    
    // Errores detallados
    if (resultado.erroresDetalle && resultado.erroresDetalle.length > 0) {
        html += `
            <div class="error-details">
                <h5>🔍 Errores Detallados:</h5>
                <div class="error-list">
        `;
        
        resultado.erroresDetalle.forEach(error => {
            html += `
                <div class="error-item">
                    <div class="error-row">Fila ${error.fila}</div>
                    <div class="error-message">${error.error}</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    importResults.innerHTML = html;
    modalResultadosImportacion.style.display = 'flex';
}

// Cerrar modal de resultados
function cerrarModalResultados() {
    console.log('📊 Cerrando modal de resultados...');
    modalResultadosImportacion.style.display = 'none';
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    // Colores según tipo
    const colores = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#007bff'
    };
    
    notificacion.style.backgroundColor = colores[tipo] || colores.info;
    
    // Añadir al DOM
    document.body.appendChild(notificacion);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 5000);
}

// Añadir estilos de animación si no existen
if (!document.getElementById('notificacion-styles')) {
    const style = document.createElement('style');
    style.id = 'notificacion-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// ==================== FUNCIONES DE EXPORTACIÓN EXCEL ====================

// Exportar coches a Excel
async function exportarCoches() {
    try {
        console.log('📤 Iniciando exportación de coches...');
        
        // Mostrar estado de carga
        btnExportarExcel.disabled = true;
        btnExportarExcel.classList.add('loading');
        btnExportarExcel.innerHTML = '<span class="excel-icon">⏳</span>';
        
        // Construir URL con filtros actuales
        const params = new URLSearchParams();
        
        if (filtrosActivos.modelo) {
            params.append('modelo', filtrosActivos.modelo);
        }
        
        // Añadir otros filtros si están activos
        const filtroModeloElement = document.getElementById('filtro-modelo');
        if (filtroModeloElement && filtroModeloElement.value) {
            params.append('modelo', filtroModeloElement.value);
        }
        
        const url = `http://localhost:3000/api/exportar/coches?${params.toString()}`;
        
        // Crear enlace temporal para descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = `coches_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarNotificacion('📤 Exportando coches a Excel...', 'info');
        
        // Simular tiempo de procesamiento
        setTimeout(() => {
            mostrarNotificacion('✅ Exportación completada', 'success');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error en exportación:', error);
        mostrarNotificacion('❌ Error al exportar coches', 'error');
    } finally {
        // Restaurar botón
        btnExportarExcel.disabled = false;
        btnExportarExcel.classList.remove('loading');
        btnExportarExcel.innerHTML = '<span class="excel-icon">📤</span>';
    }
}

// Cargar coches separados desde el backend
async function cargarCochesSeparados() {
    try {
        console.log('📋 Cargando coches separados...');
        mostrarEstadoCargaSeparado();
        
        // Cargar coches disponibles y vendidos en paralelo
        const [resultadoDisponibles, resultadoVendidos] = await Promise.all([
            ipcRenderer.invoke('api-obtener-coches-disponibles'),
            ipcRenderer.invoke('api-obtener-coches-vendidos')
        ]);
        
        if (resultadoDisponibles.success && resultadoVendidos.success) {
            cochesDisponibles = resultadoDisponibles.data;
            cochesVendidos = resultadoVendidos.data;
            
            actualizarEstadisticasSeparadas();
            renderizarCochesDisponibles();
            renderizarCochesVendidos();
            
            console.log(`✅ ${cochesDisponibles.length} coches disponibles y ${cochesVendidos.length} coches vendidos cargados`);
            
            // Actualizar opciones de filtros si el panel está abierto
            if (filtrosPanel.style.display === 'block') {
                cargarOpcionesFiltros();
            }
        } else {
            throw new Error(resultadoDisponibles.error || resultadoVendidos.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar coches separados:', error);
        mostrarErrorSeparado('Error al cargar coches: ' + error.message);
        mostrarEstadoErrorSeparado();
    }
}

// Mostrar estado de carga separado
function mostrarEstadoCargaSeparado() {
    cochesDisponiblesList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner-modern"></div>
            <p>Cargando coches disponibles...</p>
        </div>
    `;
    
    cochesVendidosList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner-modern"></div>
            <p>Cargando coches vendidos...</p>
        </div>
    `;
}
        
// Mostrar estado de error separado
function mostrarEstadoErrorSeparado() {
    cochesDisponiblesList.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error al cargar coches disponibles</h3>
            <p>No se pudieron cargar los coches disponibles. Inténtalo de nuevo.</p>
            <button onclick="cargarCochesSeparados()" class="btn-retry">🔄 Reintentar</button>
        </div>
    `;
    
    cochesVendidosList.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error al cargar coches vendidos</h3>
            <p>No se pudieron cargar los coches vendidos. Inténtalo de nuevo.</p>
            <button onclick="cargarCochesSeparados()" class="btn-retry">🔄 Reintentar</button>
        </div>
    `;
}

// Actualizar estadísticas separadas
function actualizarEstadisticasSeparadas() {
    const totalDisponibles = cochesDisponibles.length;
    const totalVendidos = cochesVendidos.length;
    const total = totalDisponibles + totalVendidos;
    
    document.getElementById('total-disponibles').textContent = totalDisponibles;
    document.getElementById('total-vendidos').textContent = totalVendidos;
    document.getElementById('total-coches').textContent = total;
    
    // Actualizar contadores en los headers
    countDisponibles.textContent = `${totalDisponibles} coches`;
    countVendidos.textContent = `${totalVendidos} coches`;
}

// Renderizar coches disponibles
function renderizarCochesDisponibles() {
    if (cochesDisponibles.length === 0) {
        cochesDisponiblesList.innerHTML = `
            <div class="empty-state-modern">
                <div class="empty-icon">🚗</div>
                <h3>No hay coches disponibles</h3>
                <p>Todos los coches han sido vendidos</p>
            </div>
        `;
        return;
    }

    const html = cochesDisponibles.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                        <p class="cliente-subtitle-modern">${coche.modelo}</p>
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
                    <div class="detail-item-modern">
                        <span class="detail-icon">🟢</span>
                        <div class="detail-content">
                            <label>Estado</label>
                            <span class="status-disponible">Disponible</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    cochesDisponiblesList.innerHTML = html;
    agregarEventListenersDisponibles();
}

// Renderizar coches vendidos
function renderizarCochesVendidos() {
    if (cochesVendidos.length === 0) {
        cochesVendidosList.innerHTML = `
            <div class="empty-state-modern">
                <div class="empty-icon">✅</div>
                <h3>No hay coches vendidos</h3>
                <p>Los coches vendidos aparecerán aquí</p>
            </div>
        `;
        return;
    }

    const html = cochesVendidos.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                        <p class="cliente-subtitle-modern">${coche.modelo}</p>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-view-modern" data-coche-id="${coche.id}" title="Ver detalles de venta">
                        👁️
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
                    <div class="detail-item-modern">
                        <span class="detail-icon">🔴</span>
                        <div class="detail-content">
                            <label>Estado</label>
                            <span class="status-vendido">Vendido</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📄</span>
                        <div class="detail-content">
                            <label>Nº Factura</label>
                            <span class="factura-numero">${coche.numero_factura}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📅</span>
                        <div class="detail-content">
                            <label>Fecha Venta</label>
                            <span>${new Date(coche.fecha_venta).toLocaleDateString('es-ES')}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">💰</span>
                        <div class="detail-content">
                            <label>Precio Venta</label>
                            <span class="precio-venta">€${coche.precio_venta.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">👤</span>
                        <div class="detail-content">
                            <label>Cliente</label>
                            <span>${coche.cliente_nombre}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    cochesVendidosList.innerHTML = html;
    agregarEventListenersVendidos();
}

// Función para agregar event listeners a las tarjetas disponibles
function agregarEventListenersDisponibles() {
    console.log('🔗 Agregando event listeners a las tarjetas disponibles...');
    
    // Event listeners para headers (dropdown)
    const headers = cochesDisponiblesList.querySelectorAll('.cliente-card-header');
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            const cocheId = header.getAttribute('data-coche-id');
            console.log('🖱️ Click en header del coche disponible:', cocheId);
            toggleDropdown(parseInt(cocheId));
        });
    });
    
    // Event listeners para botones de editar
    const botonesEditar = cochesDisponiblesList.querySelectorAll('.btn-edit-modern');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const cocheId = boton.getAttribute('data-coche-id');
            console.log('✏️ Click en editar coche disponible:', cocheId);
            editarCoche(parseInt(cocheId));
        });
    });
    
    // Event listeners para botones de eliminar
    const botonesEliminar = cochesDisponiblesList.querySelectorAll('.btn-delete-modern');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const cocheId = boton.getAttribute('data-coche-id');
            console.log('🗑️ Click en eliminar coche disponible:', cocheId);
            eliminarCoche(parseInt(cocheId));
        });
    });
}

// Función para agregar event listeners a las tarjetas vendidas
function agregarEventListenersVendidos() {
    console.log('🔗 Agregando event listeners a las tarjetas vendidas...');
    
    // Event listeners para headers (dropdown)
    const headers = cochesVendidosList.querySelectorAll('.cliente-card-header');
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            const cocheId = header.getAttribute('data-coche-id');
            console.log('🖱️ Click en header del coche vendido:', cocheId);
            toggleDropdown(parseInt(cocheId));
        });
    });
    
    // Event listeners para botones de ver detalles
    const botonesVer = cochesVendidosList.querySelectorAll('.btn-view-modern');
    botonesVer.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.stopPropagation();
            const cocheId = boton.getAttribute('data-coche-id');
            console.log('👁️ Click en ver detalles de coche vendido:', cocheId);
            verDetallesVenta(parseInt(cocheId));
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
// Filtrar coches separados
function filtrarCochesSeparados() {
    const busqueda = buscarCoche.value.toLowerCase().trim();
    
    if (!busqueda) {
        renderizarCochesDisponibles();
        renderizarCochesVendidos();
        return;
    }
    
    const disponiblesFiltrados = cochesDisponibles.filter(coche => 
        coche.matricula.toLowerCase().includes(busqueda) ||
        coche.chasis.toLowerCase().includes(busqueda) ||
        coche.color.toLowerCase().includes(busqueda) ||
        coche.modelo.toLowerCase().includes(busqueda)
    );
    
    const vendidosFiltrados = cochesVendidos.filter(coche => 
        coche.matricula.toLowerCase().includes(busqueda) ||
        coche.chasis.toLowerCase().includes(busqueda) ||
        coche.color.toLowerCase().includes(busqueda) ||
        coche.modelo.toLowerCase().includes(busqueda) ||
        coche.cliente_nombre?.toLowerCase().includes(busqueda) ||
        coche.numero_factura?.toLowerCase().includes(busqueda)
    );
    
    // Renderizar listas filtradas temporalmente
    const htmlDisponibles = disponiblesFiltrados.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                        <p class="cliente-subtitle-modern">${coche.modelo}</p>
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
                    <div class="detail-item-modern">
                        <span class="detail-icon">🟢</span>
                        <div class="detail-content">
                            <label>Estado</label>
                            <span class="status-disponible">Disponible</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    const htmlVendidos = vendidosFiltrados.map(coche => `
        <div class="cliente-card-modern" data-id="${coche.id}">
            <div class="cliente-card-header" data-coche-id="${coche.id}">
                <div class="cliente-card-info">
                    <div class="cliente-avatar">🚗</div>
                    <div class="cliente-details-basic">
                        <h4 class="cliente-nombre-modern">${coche.matricula}</h4>
                        <p class="cliente-subtitle-modern">${coche.modelo}</p>
                    </div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn-action-modern btn-view-modern" data-coche-id="${coche.id}" title="Ver detalles de venta">
                        👁️
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
                    <div class="detail-item-modern">
                        <span class="detail-icon">🔴</span>
                        <div class="detail-content">
                            <label>Estado</label>
                            <span class="status-vendido">Vendido</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📄</span>
                        <div class="detail-content">
                            <label>Nº Factura</label>
                            <span class="factura-numero">${coche.numero_factura}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">📅</span>
                        <div class="detail-content">
                            <label>Fecha Venta</label>
                            <span>${new Date(coche.fecha_venta).toLocaleDateString('es-ES')}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">💰</span>
                        <div class="detail-content">
                            <label>Precio Venta</label>
                            <span class="precio-venta">€${coche.precio_venta.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <span class="detail-icon">👤</span>
                        <div class="detail-content">
                            <label>Cliente</label>
                            <span>${coche.cliente_nombre}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    cochesDisponiblesList.innerHTML = htmlDisponibles;
    cochesVendidosList.innerHTML = htmlVendidos;
    
    agregarEventListenersDisponibles();
    agregarEventListenersVendidos();
}

// Ver detalles de venta
function verDetallesVenta(cocheId) {
    console.log('👁️ Ver detalles de venta para coche:', cocheId);
    
    const coche = cochesVendidos.find(c => c.id === cocheId);
    if (!coche) {
        console.error('❌ Coche no encontrado:', cocheId);
        return;
    }
    
    // Crear modal de detalles de venta
    const modal = document.createElement('div');
    modal.className = 'modal-modern';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content-modern">
            <div class="modal-header-modern">
                <div class="modal-title-section">
                    <span class="modal-icon">📄</span>
                    <h3>Detalles de Venta</h3>
                </div>
                <button class="btn-close-modern" onclick="this.closest('.modal-modern').remove()">✕</button>
            </div>
            <div class="modal-body-modern">
                <div class="venta-details">
                    <h4>🚗 Información del Vehículo</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Matrícula:</label>
                            <span>${coche.matricula}</span>
                        </div>
                        <div class="detail-item">
                            <label>Modelo:</label>
                            <span>${coche.modelo}</span>
                        </div>
                        <div class="detail-item">
                            <label>Chasis:</label>
                            <span>${coche.chasis}</span>
                        </div>
                        <div class="detail-item">
                            <label>Color:</label>
                            <span>${coche.color}</span>
                        </div>
                        <div class="detail-item">
                            <label>Kilómetros:</label>
                            <span>${coche.kms.toLocaleString()} km</span>
                        </div>
                    </div>
                    
                    <h4>💰 Información de Venta</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Número de Factura:</label>
                            <span class="factura-numero">${coche.numero_factura}</span>
                        </div>
                        <div class="detail-item">
                            <label>Fecha de Venta:</label>
                            <span>${new Date(coche.fecha_venta).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div class="detail-item">
                            <label>Precio de Venta:</label>
                            <span class="precio-venta">€${coche.precio_venta.toFixed(2)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Cliente:</label>
                            <span>${coche.cliente_nombre}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer-modern">
                <button class="btn-primary-modern" onclick="this.closest('.modal-modern').remove()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}
