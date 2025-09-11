// Home.js - Lógica para la página de inicio
const { ipcRenderer } = require('electron');

// Elementos del DOM
const connectionStatus = document.getElementById('connection-status');
const totalClientes = document.getElementById('total-clientes');
const totalCoches = document.getElementById('total-coches');
const totalFacturas = document.getElementById('total-facturas');

// Elementos del certificado
const certificadoEmpresa = document.getElementById('certificado-empresa');
const certificadoCif = document.getElementById('certificado-cif');
const certificadoSerial = document.getElementById('certificado-serial');
const certificadoEstado = document.getElementById('certificado-estado');

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
    console.log('🏠 Iniciando página de inicio...');
    
    // Inicializar botones de acciones rápidas
    btnNuevoCliente = document.getElementById('btn-nuevo-cliente');
    btnNuevoCoche = document.getElementById('btn-nuevo-coche');
    btnNuevaEmpresa = document.getElementById('btn-nueva-empresa');
    
    // Verificar que los elementos existen
    console.log('🔍 Verificando elementos del DOM...');
    console.log('btnNuevoCliente:', btnNuevoCliente);
    console.log('btnNuevoCoche:', btnNuevoCoche);
    console.log('btnNuevaEmpresa:', btnNuevaEmpresa);
    
    // Verificar conexión con el backend
    await verificarConexion();
    
    // Cargar información del certificado
    await cargarInformacionCertificado();
    
    // Cargar estadísticas
    await cargarEstadisticas();
    
    // Configurar navegación
    configurarNavegacion();
    
    // Configurar animaciones
    configurarAnimaciones();
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
        console.error('❌ Error al verificar conexión:', error);
        connectionStatus.className = 'status-badge disconnected';
        connectionStatus.querySelector('.status-text').textContent = 'Error de conexión';
    }
}

// Cargar información del certificado digital
async function cargarInformacionCertificado() {
    try {
        console.log('🔐 Cargando información del certificado...');
        const resultado = await ipcRenderer.invoke('api-obtener-certificado');
        
        if (resultado.success && resultado.data) {
            const certificado = resultado.data.certificado;
            
            // Mostrar información del certificado
            certificadoEmpresa.textContent = certificado.empresa || 'No disponible';
            certificadoCif.textContent = certificado.cif || 'No disponible';
            certificadoSerial.textContent = certificado.serial || 'No disponible';
            
            // Determinar estado del certificado
            const ahora = new Date();
            const validoDesde = new Date(certificado.validoDesde);
            const validoHasta = new Date(certificado.validoHasta);
            
            let estado = 'Desconocido';
            let claseEstado = 'error';
            
            if (ahora >= validoDesde && ahora <= validoHasta) {
                estado = 'Válido';
                claseEstado = 'valido';
            } else if (ahora < validoDesde) {
                estado = 'No válido aún';
                claseEstado = 'error';
            } else if (ahora > validoHasta) {
                estado = 'Expirado';
                claseEstado = 'expirado';
            }
            
            certificadoEstado.textContent = estado;
            certificadoEstado.className = `certificado-value ${claseEstado}`;
            
            // Remover clase de cargando
            certificadoEmpresa.classList.remove('cargando');
            
            console.log('✅ Información del certificado cargada:', {
                empresa: certificado.empresa,
                cif: certificado.cif,
                serial: certificado.serial,
                estado: estado
            });
        } else {
            throw new Error(resultado.error || 'No se pudo obtener la información del certificado');
        }
    } catch (error) {
        console.error('❌ Error al cargar información del certificado:', error);
        
        // Mostrar estado de error
        certificadoEmpresa.textContent = 'Error al cargar';
        certificadoEmpresa.className = 'certificado-value error';
        certificadoCif.textContent = 'Error';
        certificadoSerial.textContent = 'Error';
        certificadoEstado.textContent = 'Error';
        certificadoEstado.className = 'certificado-value error';
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

        console.log('✅ Estadísticas cargadas correctamente');
    } catch (error) {
        console.error('❌ Error al cargar estadísticas:', error);
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

    console.log('✅ Navegación configurada');
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

// Configurar acciones rápidas
function configurarAccionesRapidas() {
    console.log('🔧 Configurando acciones rápidas...');
    console.log('btnNuevoCliente:', btnNuevoCliente);
    console.log('btnNuevoCoche:', btnNuevoCoche);
    console.log('btnNuevaEmpresa:', btnNuevaEmpresa);
    
    if (!btnNuevoCliente || !btnNuevoCoche || !btnNuevaEmpresa) {
        console.error('❌ No se encontraron todos los botones de acciones rápidas');
        return;
    }
    
    // Nuevo Cliente
    btnNuevoCliente.addEventListener('click', async () => {
        console.log('🖱️ Click en Nuevo Cliente');
        try {
            // Crear modal de nuevo cliente
            await crearModalNuevoCliente();
        } catch (error) {
            console.error('❌ Error al crear modal de nuevo cliente:', error);
            mostrarError('Error al abrir el formulario de nuevo cliente');
        }
    });

    // Nuevo Coche
    btnNuevoCoche.addEventListener('click', async () => {
        console.log('🖱️ Click en Nuevo Coche');
        try {
            // Crear modal de nuevo coche
            await crearModalNuevoCoche();
        } catch (error) {
            console.error('❌ Error al crear modal de nuevo coche:', error);
            mostrarError('Error al abrir el formulario de nuevo coche');
        }
    });

    // Nueva Empresa
    btnNuevaEmpresa.addEventListener('click', async () => {
        console.log('🖱️ Click en Nueva Empresa');
        try {
            // Crear modal de nueva empresa
            await crearModalNuevaEmpresa();
        } catch (error) {
            console.error('❌ Error al crear modal de nueva empresa:', error);
            mostrarError('Error al abrir el formulario de nueva empresa');
        }
    });

    console.log('✅ Acciones rápidas configuradas');
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
            btnGuardar.innerHTML = '💾 Guardando...';
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
            console.error('❌ Error al guardar cliente:', error);
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
            btnGuardar.innerHTML = '💾 Guardando...';
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
            console.error('❌ Error al guardar coche:', error);
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
            btnGuardar.innerHTML = '💾 Guardando...';
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
            console.error('❌ Error al guardar empresa:', error);
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
        <div class="notificacion-icon">✅</div>
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
        <div class="notificacion-icon">❌</div>
        <span>${mensaje}</span>
    `;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}
