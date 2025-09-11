const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

async function probarDeteccionFirmas() {
    console.log('🧪 Probando detección de todas las firmas digitales...');
    
    const sistemaFirma = new SistemaFirmaDigital();
    
    try {
        // 1. Detectar todas las firmas disponibles
        console.log('\n🔍 Detectando todas las firmas digitales disponibles...');
        const resultadoGeneral = await sistemaFirma.detectarTodasLasFirmasDisponibles();
        
        if (resultadoGeneral.success) {
            console.log(`✅ Detectadas ${resultadoGeneral.total} firmas digitales`);
            console.log(`📊 Certificados Windows: ${resultadoGeneral.certificadosWindows}`);
            console.log(`📁 Firmas existentes: ${resultadoGeneral.firmasExistentes}`);
            
            console.log('\n📋 Lista de firmas disponibles:');
            resultadoGeneral.firmas.forEach((firma, index) => {
                console.log(`\n${index + 1}. ${firma.descripcion}`);
                console.log(`   - Tipo: ${firma.tipo}`);
                console.log(`   - Fuente: ${firma.fuente}`);
                console.log(`   - Empresa: ${firma.empresa}`);
                console.log(`   - CIF: ${firma.cif}`);
                console.log(`   - Válido: ${firma.isValido ? 'Sí' : 'No'}`);
                console.log(`   - Thumbprint: ${firma.thumbprint}`);
                console.log(`   - Prioridad: ${firma.prioridad}`);
                
                if (firma.validoDesde && firma.validoHasta) {
                    console.log(`   - Válido desde: ${firma.validoDesde}`);
                    console.log(`   - Válido hasta: ${firma.validoHasta}`);
                }
                
                if (firma.diasRestantes !== undefined) {
                    console.log(`   - Días restantes: ${firma.diasRestantes}`);
                }
            });
            
        } else {
            console.log('❌ Error al detectar firmas:', resultadoGeneral.error);
            return;
        }
        
        // 2. Probar detección específica para empresa ID 1
        console.log('\n🏢 Probando detección para empresa Telwagen (ID: 1)...');
        const resultadoEmpresa = await sistemaFirma.obtenerFirmasParaAsignar(1);
        
        if (resultadoEmpresa.success) {
            console.log(`✅ Firmas disponibles para empresa: ${resultadoEmpresa.total}`);
            
            console.log('\n📋 Firmas con análisis de compatibilidad:');
            resultadoEmpresa.firmas.forEach((firma, index) => {
                console.log(`\n${index + 1}. ${firma.descripcion}`);
                console.log(`   - Compatible: ${firma.compatible.compatible ? 'Sí' : 'No'}`);
                console.log(`   - Motivo: ${firma.compatible.motivo}`);
                console.log(`   - Nivel: ${firma.compatible.nivel}`);
                console.log(`   - Recomendada: ${firma.recomendada ? 'Sí' : 'No'}`);
            });
            
        } else {
            console.log('❌ Error al obtener firmas para empresa:', resultadoEmpresa.error);
        }
        
        // 3. Probar asociación de firma recomendada
        console.log('\n🔗 Probando asociación de firma recomendada...');
        const firmaRecomendada = resultadoEmpresa.firmas.find(f => f.recomendada);
        
        if (firmaRecomendada) {
            console.log(`✅ Firma recomendada encontrada: ${firmaRecomendada.descripcion}`);
            
            const resultadoAsociacion = await sistemaFirma.asociarCertificadoConEmpresa(1, firmaRecomendada.thumbprint);
            
            if (resultadoAsociacion.success) {
                console.log('✅ Firma asociada exitosamente');
                console.log('🏢 Empresa:', resultadoAsociacion.empresa.nombre);
                console.log('🔐 Certificado:', resultadoAsociacion.certificado.empresa);
            } else {
                console.log('❌ Error al asociar firma:', resultadoAsociacion.error);
            }
        } else {
            console.log('⚠️ No se encontró firma recomendada para esta empresa');
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

probarDeteccionFirmas().catch(console.error);
