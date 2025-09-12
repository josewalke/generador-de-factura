// Home.js - Lógica para la página de inicio
const { ipcRenderer } = require('electron');

// Elementos del DOM
const connectionStatus = document.getElementById('connection-status');
const totalClientes = document.getElementById('total-clientes');
const totalCoches = document.getElementById('total-coches');
const totalFacturas = document.getElementById('total-facturas');

// Botones de navegación
const btnFacturas = document.getElementById('btn-facturas');
const btnClientes = document.getElementById('btn-clientes');
const btnCoches = document.getElementById('btn-coches');
const btnEmpresas = document.getElementById('btn-empresas');
const btnHistorial = document.getElementById('btn-historial');

// Variables para botones de acciones rápidas (se inicializarán en DOMContentLoaded)
let btnNuevoCliente, btnNuevoCoche, btnNuevaEmpresa;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[HOME] Iniciando página de inicio...');
    
    // Inicializar botones de acciones rápidas
    btnNuevoCliente = document.getElementById('btn-nuevo-cliente');
    btnNuevoCoche = document.getElementById('btn-nuevo-coche');
    btnNuevaEmpresa = document.getElementById('btn-nueva-empresa');
    
    // Verificar que los elementos existen
    console.log('[HOME] Verificando elementos del DOM...');
    console.log('btnNuevoCliente:', btnNuevoCliente);
    console.log('btnNuevoCoche:', btnNuevoCoche);
    console.log('btnNuevaEmpresa:', btnNuevaEmpresa);
    
    // Verificar conexión con el backend
    await verificarConexion();
    
    // Cargar estadísticas
    await cargarEstadisticas();
    
    // Verificar alertas de certificados
    await verificarAlertasCertificados();
    
    // Configurar navegación
    configurarNavegacion();
    
    // Configurar animaciones
    configurarAnimaciones();
    
    // Configurar modo compacto del sidebar
    setTimeout(() => {
        configurarObservadorSidebar();
        verificarModoCompactoSidebar();
    }, 500);
});

// Verificar conexión con el backend
async function verificarConexion() {
    try {
        const resultado = await ipcRenderer.invoke('api-verificar-conexion');
        if (resultado.success) {
            connectionStatus.className = 'status-badge connected';
            connectionStatus.querySelector('.status-text').textContent = 'Conectado';
        } else {
            connectionStatus.className = 'status-badge disconnected';
            connectionStatus.querySelector('.status-text').textContent = 'Sin conexión';
        }
    } catch (error) {
        console.error('[HOME] Error al verificar conexión:', error);
        connectionStatus.className = 'status-badge disconnected';
        connectionStatus.querySelector('.status-text').textContent = 'Error de conexión';
    }
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        // Cargar total de clientes
        const clientesResult = await ipcRenderer.invoke('api-obtener-clientes');
        if (clientesResult.success) {
            totalClientes.textContent = clientesResult.data.length;
            animarNumero(totalClientes, clientesResult.data.length);
        }

        // Cargar total de coches
        const cochesResult = await ipcRenderer.invoke('api-obtener-coches');
        if (cochesResult.success) {
            totalCoches.textContent = cochesResult.data.length;
            animarNumero(totalCoches, cochesResult.data.length);
        }

        // Cargar total de facturas
        const facturasResult = await ipcRenderer.invoke('api-obtener-facturas');
        if (facturasResult.success) {
            totalFacturas.textContent = facturasResult.data.length;
            animarNumero(totalFacturas, facturasResult.data.length);
        }

        console.log('[HOME] Estadísticas cargadas correctamente');
    } catch (error) {
        console.error('[HOME] Error al cargar estadísticas:', error);
    }
}

// Animación de números
function animarNumero(elemento, valorFinal) {
    const valorInicial = 0;
    const duracion = 1000; // 1 segundo
    const incremento = valorFinal / (duracion / 16); // 60 FPS
    let valorActual = valorInicial;
    
    const animacion = setInterval(() => {
        valorActual += incremento;
        if (valorActual >= valorFinal) {
            elemento.textContent = valorFinal;
            clearInterval(animacion);
        } else {
            elemento.textContent = Math.floor(valorActual);
        }
    }, 16);
}

// Configurar navegación
function configurarNavegacion() {
    // Navegar a Facturas
    btnFacturas.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // Navegar a Clientes
    btnClientes.addEventListener('click', () => {
        window.location.href = 'clientes.html';
    });

    // Navegar a Coches
    btnCoches.addEventListener('click', () => {
        window.location.href = 'coches.html';
    });

    // Navegar a Empresas
    btnEmpresas.addEventListener('click', () => {
        window.location.href = 'empresas.html';
    });

    // Navegar a Historial
    btnHistorial.addEventListener('click', () => {
        window.location.href = 'facturas.html';
    });

    // Configurar acciones rápidas
    configurarAccionesRapidas();

    console.log('[HOME] Navegación configurada');
}

// Configurar animaciones
function configurarAnimaciones() {
    // Animación de entrada para las tarjetas
    const cards = document.querySelectorAll('.module-card, .main-card, .stat-item');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Animación para el header
    const header = document.querySelector('.home-header');
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        header.style.transition = 'all 0.8s ease';
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 200);
}

// Actualizar estadísticas cada 30 segundos
setInterval(cargarEstadisticas, 30000);

// ===== FUNCIONES PARA MODO COMPACTO DEL SIDEBAR =====

let sidebarObserver = null;

function configurarObservadorSidebar() {
    const sidebar = document.querySelector('.home-sidebar');
    if (!sidebar) return;
    
    // Crear ResizeObserver para detectar cambios en el sidebar
    sidebarObserver = new ResizeObserver(() => {
        verificarModoCompactoSidebar();
    });
    
    sidebarObserver.observe(sidebar);
    
    // También observar cambios en el contenido interno
    const sidebarContent = sidebar.querySelector('.stats-container');
    if (sidebarContent) {
        sidebarObserver.observe(sidebarContent);
    }
}

function verificarModoCompactoSidebar() {
    const sidebar = document.querySelector('.home-sidebar');
    if (!sidebar) return;
    
    // Obtener altura disponible del sidebar
    const availableHeight = sidebar.clientHeight;
    const maxHeight = parseInt(getComputedStyle(sidebar).maxHeight);
    
    // Obtener altura del contenido interno
    const statsContainer = sidebar.querySelector('.stats-container');
    const quickActions = sidebar.querySelector('.quick-actions');
    
    let contentHeight = 0;
    if (statsContainer) contentHeight += statsContainer.scrollHeight;
    if (quickActions) contentHeight += quickActions.scrollHeight;
    
    // Agregar padding y gaps
    const padding = parseInt(getComputedStyle(sidebar).paddingTop) * 2;
    const gaps = parseInt(getComputedStyle(sidebar).gap) * 2;
    contentHeight += padding + gaps;
    
    // Determinar si necesita modo compacto
    const needsCompact = contentHeight > availableHeight || availableHeight < 400;
    
    // Aplicar o quitar clase compact
    if (needsCompact && !sidebar.classList.contains('compact')) {
        sidebar.classList.add('compact');
        console.log('[HOME] Activando modo compacto del sidebar');
    } else if (!needsCompact && sidebar.classList.contains('compact')) {
        sidebar.classList.remove('compact');
        console.log('[HOME] Desactivando modo compacto del sidebar');
    }
}

// Limpiar observer cuando se cierre la página
window.addEventListener('beforeunload', () => {
    if (sidebarObserver) {
        sidebarObserver.disconnect();
    }
});

// Configurar acciones rápidas
function configurarAccionesRapidas() {
    console.log('[HOME] Configurando acciones rápidas...');
    console.log('btnNuevoCliente:', btnNuevoCliente);
    console.log('btnNuevoCoche:', btnNuevoCoche);
    console.log('btnNuevaEmpresa:', btnNuevaEmpresa);
    
    if (!btnNuevoCliente || !btnNuevoCoche || !btnNuevaEmpresa) {
        console.error('[HOME] ERROR: No se encontraron todos los botones de acciones rápidas');
        return;
    }
    
    // Nuevo Cliente
    btnNuevoCliente.addEventListener('click', async () => {
        console.log('[HOME] Click en Nuevo Cliente');
        try {
            // Crear modal de nuevo cliente
            await crearModalNuevoCliente();
        } catch (error) {
            console.error('[HOME] ERROR al crear modal de nuevo cliente:', error);
            mostrarError('Error al abrir el formulario de nuevo cliente');
        }
    });

    // Nuevo Coche
    btnNuevoCoche.addEventListener('click', async () => {
        console.log('[HOME] Click en Nuevo Coche');
        try {
            // Crear modal de nuevo coche
            await crearModalNuevoCoche();
        } catch (error) {
            console.error('[HOME] ERROR al crear modal de nuevo coche:', error);
            mostrarError('Error al abrir el formulario de nuevo coche');
        }
    });

    // Nueva Empresa
    btnNuevaEmpresa.addEventListener('click', async () => {
        console.log('[HOME] Click en Nueva Empresa');
        try {
            // Crear modal de nueva empresa
            await crearModalNuevaEmpresa();
        } catch (error) {
            console.error('[HOME] ERROR al crear modal de nueva empresa:', error);
            mostrarError('Error al abrir el formulario de nueva empresa');
        }
    });

    console.log('[HOME] Acciones rápidas configuradas');
}

// Crear modal de nuevo cliente
async function crearModalNuevoCliente() {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay-cliente';
    document.body.appendChild(overlay);

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal-modern';
    modal.id = 'modal-cliente-home';
    modal.innerHTML = `
        <div class="modal-content-modern">
            <div class="modal-header-modern">
                <div class="modal-title-section">
                    <div class="modal-icon">👤</div>
                    <h3>Nuevo Cliente</h3>
                </div>
                <button id="btn-cerrar-modal-cliente" class="btn-close-modern">✕</button>
            </div>
            <div class="modal-body-modern">
                <form id="form-cliente-home" class="form-modern">
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="nombre-cliente">Nombre Completo</label>
                            <input type="text" id="nombre-cliente" name="nombre" required>
                        </div>
                        <div class="form-group-modern">
                            <label for="telefono-cliente">Teléfono</label>
                            <input type="tel" id="telefono-cliente" name="telefono" required>
                        </div>
                    </div>
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="email-cliente">Email</label>
                            <input type="email" id="email-cliente" name="email">
                        </div>
                        <div class="form-group-modern">
                            <label for="direccion-cliente">Dirección</label>
                            <input type="text" id="direccion-cliente" name="direccion">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer-modern">
                <button id="btn-cancelar-cliente" class="btn-cancel-modern">Cancelar</button>
                <button id="btn-guardar-cliente" class="btn-save-modern">Guardar Cliente</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Configurar event listeners
    const btnCerrar = document.getElementById('btn-cerrar-modal-cliente');
    const btnCancelar = document.getElementById('btn-cancelar-cliente');
    const btnGuardar = document.getElementById('btn-guardar-cliente');

    const cerrarModal = () => {
        modal.remove();
        overlay.remove();
    };

    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    overlay.addEventListener('click', cerrarModal);

    btnGuardar.addEventListener('click', async () => {
        const form = document.getElementById('form-cliente-home');
        const formData = new FormData(form);
        const datos = {
            nombre: formData.get('nombre'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            direccion: formData.get('direccion')
        };

        try {
            btnGuardar.innerHTML = 'Guardando...';
            btnGuardar.disabled = true;

            const resultado = await ipcRenderer.invoke('api-crear-cliente', datos);
            
            if (resultado.success) {
                mostrarExito('Cliente creado correctamente');
                cerrarModal();
                await cargarEstadisticas(); // Actualizar estadísticas
            } else {
                throw new Error(resultado.error);
            }
        } catch (error) {
            console.error('[HOME] ERROR al guardar cliente:', error);
            mostrarError('Error al guardar cliente: ' + error.message);
        } finally {
            btnGuardar.innerHTML = 'Guardar Cliente';
            btnGuardar.disabled = false;
        }
    });

    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('nombre-cliente').focus();
    }, 100);
}

// Crear modal de nuevo coche
async function crearModalNuevoCoche() {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay-coche';
    document.body.appendChild(overlay);

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal-modern';
    modal.id = 'modal-coche-home';
    modal.innerHTML = `
        <div class="modal-content-modern">
            <div class="modal-header-modern">
                <div class="modal-title-section">
                    <div class="modal-icon">🚗</div>
                    <h3>Nuevo Coche</h3>
                </div>
                <button id="btn-cerrar-modal-coche" class="btn-close-modern">✕</button>
            </div>
            <div class="modal-body-modern">
                <form id="form-coche-home" class="form-modern">
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="matricula-coche">Matrícula</label>
                            <input type="text" id="matricula-coche" name="matricula" required>
                        </div>
                        <div class="form-group-modern">
                            <label for="chasis-coche">Chasis</label>
                            <input type="text" id="chasis-coche" name="chasis" required>
                        </div>
                    </div>
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="color-coche">Color</label>
                            <input type="text" id="color-coche" name="color" required>
                        </div>
                        <div class="form-group-modern">
                            <label for="kms-coche">Kilómetros</label>
                            <input type="number" id="kms-coche" name="kms" min="0" required>
                        </div>
                    </div>
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="modelo-coche">Modelo</label>
                            <input type="text" id="modelo-coche" name="modelo" required>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer-modern">
                <button id="btn-cancelar-coche" class="btn-cancel-modern">Cancelar</button>
                <button id="btn-guardar-coche" class="btn-save-modern">Guardar Coche</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Configurar event listeners
    const btnCerrar = document.getElementById('btn-cerrar-modal-coche');
    const btnCancelar = document.getElementById('btn-cancelar-coche');
    const btnGuardar = document.getElementById('btn-guardar-coche');

    const cerrarModal = () => {
        modal.remove();
        overlay.remove();
    };

    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    overlay.addEventListener('click', cerrarModal);

    btnGuardar.addEventListener('click', async () => {
        const form = document.getElementById('form-coche-home');
        const formData = new FormData(form);
        const datos = {
            matricula: formData.get('matricula'),
            chasis: formData.get('chasis'),
            color: formData.get('color'),
            kms: parseInt(formData.get('kms')),
            modelo: formData.get('modelo')
        };

        try {
            btnGuardar.innerHTML = 'Guardando...';
            btnGuardar.disabled = true;

            const resultado = await ipcRenderer.invoke('api-crear-coche', datos);
            
            if (resultado.success) {
                mostrarExito('Coche creado correctamente');
                cerrarModal();
                await cargarEstadisticas(); // Actualizar estadísticas
            } else {
                throw new Error(resultado.error);
            }
        } catch (error) {
            console.error('[HOME] ERROR al guardar coche:', error);
            mostrarError('Error al guardar coche: ' + error.message);
        } finally {
            btnGuardar.innerHTML = 'Guardar Coche';
            btnGuardar.disabled = false;
        }
    });

    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('matricula-coche').focus();
    }, 100);
}

// Crear modal de nueva empresa
async function crearModalNuevaEmpresa() {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay-empresa';
    document.body.appendChild(overlay);

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal-modern';
    modal.id = 'modal-empresa-home';
    modal.innerHTML = `
        <div class="modal-content-modern">
            <div class="modal-header-modern">
                <div class="modal-title-section">
                    <div class="modal-icon">🏢</div>
                    <h3>Nueva Empresa</h3>
                </div>
                <button id="btn-cerrar-modal-empresa" class="btn-close-modern">✕</button>
            </div>
            <div class="modal-body-modern">
                <form id="form-empresa-home" class="form-modern">
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="nombre-empresa">Nombre de la Empresa</label>
                            <input type="text" id="nombre-empresa" name="nombre" required>
                        </div>
                        <div class="form-group-modern">
                            <label for="cif-empresa">CIF</label>
                            <input type="text" id="cif-empresa" name="cif" required>
                        </div>
                    </div>
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="direccion-empresa">Dirección</label>
                            <input type="text" id="direccion-empresa" name="direccion">
                        </div>
                        <div class="form-group-modern">
                            <label for="telefono-empresa">Teléfono</label>
                            <input type="tel" id="telefono-empresa" name="telefono">
                        </div>
                    </div>
                    <div class="form-row-modern">
                        <div class="form-group-modern">
                            <label for="email-empresa">Email</label>
                            <input type="email" id="email-empresa" name="email">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer-modern">
                <button id="btn-cancelar-empresa" class="btn-cancel-modern">Cancelar</button>
                <button id="btn-guardar-empresa" class="btn-save-modern">Guardar Empresa</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Configurar event listeners
    const btnCerrar = document.getElementById('btn-cerrar-modal-empresa');
    const btnCancelar = document.getElementById('btn-cancelar-empresa');
    const btnGuardar = document.getElementById('btn-guardar-empresa');

    const cerrarModal = () => {
        modal.remove();
        overlay.remove();
    };

    btnCerrar.addEventListener('click', cerrarModal);
    btnCancelar.addEventListener('click', cerrarModal);
    overlay.addEventListener('click', cerrarModal);

    btnGuardar.addEventListener('click', async () => {
        const form = document.getElementById('form-empresa-home');
        const formData = new FormData(form);
        const datos = {
            nombre: formData.get('nombre'),
            cif: formData.get('cif'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email')
        };

        try {
            btnGuardar.innerHTML = 'Guardando...';
            btnGuardar.disabled = true;

            const resultado = await ipcRenderer.invoke('api-crear-empresa', datos);
            
            if (resultado.success) {
                mostrarExito('Empresa creada correctamente');
                cerrarModal();
                await cargarEstadisticas(); // Actualizar estadísticas
            } else {
                throw new Error(resultado.error);
            }
        } catch (error) {
            console.error('[HOME] ERROR al guardar empresa:', error);
            mostrarError('Error al guardar empresa: ' + error.message);
        } finally {
            btnGuardar.innerHTML = 'Guardar Empresa';
            btnGuardar.disabled = false;
        }
    });

    // Auto-focus en el primer campo
    setTimeout(() => {
        document.getElementById('nombre-empresa').focus();
    }, 100);
}

// Funciones de notificación
function mostrarExito(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-exito';
    notificacion.innerHTML = `
        <div class="notificacion-icon">OK</div>
        <span>${mensaje}</span>
    `;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

function mostrarError(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-error';
    notificacion.innerHTML = `
        <div class="notificacion-icon">ERROR</div>
        <span>${mensaje}</span>
    `;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// Verificar alertas de certificados próximos a caducar
async function verificarAlertasCertificados() {
    try {
        console.log('[HOME] Verificando alertas de certificados...');
        
        const resultado = await ipcRenderer.invoke('api-verificar-alertas-certificados');
        
        if (resultado.success && resultado.data.tieneAlertas) {
            console.log(`[HOME] OK: ${resultado.data.total} alertas encontradas`);
            mostrarAlertasCertificados(resultado.data.alertas);
        } else {
            console.log('[HOME] OK: No hay alertas de certificados');
        }
    } catch (error) {
        console.error('[HOME] ERROR: Error al verificar alertas:', error);
    }
}

// Mostrar las alertas de certificados en la interfaz
function mostrarAlertasCertificados(alertas) {
    const contenedorAlertas = document.getElementById('alertas-certificados');
    const listaAlertas = document.getElementById('alertas-lista');
    
    if (!contenedorAlertas || !listaAlertas) {
        console.error('[HOME] ERROR: Elementos de alertas no encontrados');
        return;
    }
    
    // Limpiar alertas anteriores
    listaAlertas.innerHTML = '';
    
    // Crear elementos para cada alerta
    alertas.forEach(alerta => {
        const elementoAlerta = crearElementoAlerta(alerta);
        listaAlertas.appendChild(elementoAlerta);
    });
    
    // Mostrar el contenedor de alertas
    contenedorAlertas.style.display = 'block';
    
    // Configurar botón de cerrar
    const btnCerrar = document.getElementById('btn-cerrar-alertas');
    if (btnCerrar) {
        btnCerrar.onclick = () => {
            contenedorAlertas.style.display = 'none';
        };
    }
}

// Crear elemento HTML para una alerta
function crearElementoAlerta(alerta) {
    const div = document.createElement('div');
    div.className = `alerta-item ${alerta.estado}`;
    
    const icono = obtenerIconoAlerta(alerta.estado);
    const fechaFormateada = formatearFecha(alerta.fechaExpiracion);
    
    div.innerHTML = `
        <span class="alerta-icon-item">${icono}</span>
        <div class="alerta-content">
            <div class="alerta-empresa">${alerta.empresaNombre}</div>
            <div class="alerta-mensaje">${alerta.mensaje}</div>
            <div class="alerta-detalles">
                <span class="alerta-dias">${alerta.diasRestantes} días restantes</span>
                <span class="alerta-fecha">Expira: ${fechaFormateada}</span>
            </div>
        </div>
    `;
    
    return div;
}

// Obtener icono según el estado de la alerta
function obtenerIconoAlerta(estado) {
    switch (estado) {
        case 'expirado':
            return '🚫';
        case 'critico':
            return '🔥';
        case 'advertencia':
            return '⚠️';
        default:
            return 'ℹ️';
    }
}

// Formatear fecha para mostrar
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return fecha;
    }
}
