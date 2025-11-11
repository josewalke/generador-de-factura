// Parche para solucionar el problema del input de búsqueda de cliente
console.log('🔧 Aplicando parche para el input de búsqueda...');

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco más para asegurar que todo esté cargado
    setTimeout(() => {
        const buscarCliente = document.getElementById('buscar-cliente');
        
        if (buscarCliente) {
            console.log('✅ Aplicando parche al input de búsqueda...');
            
            // Forzar estilos que permitan la interacción
            buscarCliente.style.pointerEvents = 'auto';
            buscarCliente.style.userSelect = 'text';
            buscarCliente.style.zIndex = '1000';
            buscarCliente.style.position = 'relative';
            
            // Asegurar que no esté deshabilitado
            buscarCliente.disabled = false;
            buscarCliente.readOnly = false;
            
            // Añadir event listeners adicionales
            buscarCliente.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                console.log('🖱️ Mousedown en input');
            });
            
            buscarCliente.addEventListener('click', (e) => {
                e.stopPropagation();
                buscarCliente.focus();
                console.log('🖱️ Click en input - focus aplicado');
            });
            
            // Asegurar que el input sea focusable
            buscarCliente.tabIndex = 0;
            
            // Añadir un indicador visual de que está funcionando
            buscarCliente.addEventListener('focus', () => {
                buscarCliente.style.border = '2px solid #007bff';
                console.log('🎯 Input enfocado');
            });
            
            buscarCliente.addEventListener('blur', () => {
                buscarCliente.style.border = '';
                console.log('👁️ Input desenfocado');
            });
            
            console.log('✅ Parche aplicado exitosamente');
            
        } else {
            console.log('❌ No se encontró el elemento buscar-cliente');
        }
    }, 1000);
});

console.log('🔧 Parche cargado');


