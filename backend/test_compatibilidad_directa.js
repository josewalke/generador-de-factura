const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

async function probarCompatibilidadDirecta() {
    console.log('🧪 Probando verificación de compatibilidad directa...');
    
    const sistemaFirma = new SistemaFirmaDigital();
    
    try {
        // Obtener todas las firmas disponibles
        const resultado = await sistemaFirma.detectarTodasLasFirmasDisponibles();
        
        if (!resultado.success) {
            console.log('❌ Error al detectar firmas:', resultado.error);
            return;
        }
        
        console.log(`✅ Detectadas ${resultado.total} firmas digitales`);
        
        // Empresa de prueba con CIF coincidente
        const empresaTest = {
            id: 999,
            nombre: 'MARZO\'S MOTOR SL',
            cif: 'VATES-B35707512',
            direccion: 'Dirección de prueba',
            telefono: '123456789',
            email: 'test@marzos.com'
        };
        
        console.log('\n🏢 Empresa de prueba:');
        console.log('   - Nombre:', empresaTest.nombre);
        console.log('   - CIF:', empresaTest.cif);
        
        console.log('\n📋 Análisis de compatibilidad:');
        
        resultado.firmas.forEach((firma, index) => {
            console.log(`\n${index + 1}. ${firma.descripcion}`);
            console.log('   - Empresa certificado:', firma.empresa);
            console.log('   - CIF certificado:', firma.cif);
            console.log('   - Válido:', firma.isValido ? 'Sí' : 'No');
            
            // Verificar compatibilidad manualmente
            const compatibilidad = sistemaFirma.verificarCompatibilidadFirmaEmpresa(firma, empresaTest);
            console.log('   - Compatible:', compatibilidad.compatible ? 'Sí' : 'No');
            console.log('   - Motivo:', compatibilidad.motivo);
            console.log('   - Nivel:', compatibilidad.nivel);
            
            // Verificar si es recomendada
            const recomendada = sistemaFirma.esFirmaRecomendada(firma, empresaTest);
            console.log('   - Recomendada:', recomendada ? 'Sí' : 'No');
            
            if (compatibilidad.compatible && compatibilidad.nivel === 'alto') {
                console.log('   ✅ ¡Firma altamente compatible!');
            } else if (compatibilidad.compatible) {
                console.log('   ⚠️ Firma compatible pero requiere verificación');
            } else {
                console.log('   ❌ Firma no compatible');
            }
        });
        
        // Mostrar resumen
        const firmasCompatibles = resultado.firmas.filter(f => 
            sistemaFirma.verificarCompatibilidadFirmaEmpresa(f, empresaTest).compatible
        );
        
        const firmasRecomendadas = resultado.firmas.filter(f => 
            sistemaFirma.esFirmaRecomendada(f, empresaTest)
        );
        
        console.log('\n📊 Resumen:');
        console.log(`   - Total firmas: ${resultado.total}`);
        console.log(`   - Firmas compatibles: ${firmasCompatibles.length}`);
        console.log(`   - Firmas recomendadas: ${firmasRecomendadas.length}`);
        
        if (firmasRecomendadas.length > 0) {
            console.log('\n🎯 Firmas recomendadas:');
            firmasRecomendadas.forEach((firma, index) => {
                console.log(`   ${index + 1}. ${firma.descripcion}`);
                console.log(`      - Thumbprint: ${firma.thumbprint}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

probarCompatibilidadDirecta().catch(console.error);
