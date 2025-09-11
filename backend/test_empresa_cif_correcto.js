const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

async function probarConEmpresaCorrecta() {
    console.log('🧪 Probando con empresa que tenga CIF coincidente...');
    
    const sistemaFirma = new SistemaFirmaDigital();
    
    try {
        // Crear una empresa temporal con el CIF del certificado
        const empresaTest = {
            id: 999,
            nombre: 'MARZO\'S MOTOR SL',
            cif: 'VATES-B35707512',
            direccion: 'Dirección de prueba',
            telefono: '123456789',
            email: 'test@marzos.com'
        };
        
        console.log('🏢 Empresa de prueba:', empresaTest.nombre);
        console.log('🔑 CIF:', empresaTest.cif);
        
        // Probar detección específica para esta empresa
        console.log('\n🔍 Detectando firmas para empresa con CIF coincidente...');
        const resultadoEmpresa = await sistemaFirma.obtenerFirmasParaAsignar(empresaTest.id);
        
        if (resultadoEmpresa.success) {
            console.log(`✅ Firmas disponibles: ${resultadoEmpresa.total}`);
            
            console.log('\n📋 Firmas con análisis de compatibilidad:');
            resultadoEmpresa.firmas.forEach((firma, index) => {
                console.log(`\n${index + 1}. ${firma.descripcion}`);
                console.log(`   - Compatible: ${firma.compatible.compatible ? 'Sí' : 'No'}`);
                console.log(`   - Motivo: ${firma.compatible.motivo}`);
                console.log(`   - Nivel: ${firma.compatible.nivel}`);
                console.log(`   - Recomendada: ${firma.recomendada ? 'Sí' : 'No'}`);
            });
            
            // Probar asociación de firma recomendada
            const firmaRecomendada = resultadoEmpresa.firmas.find(f => f.recomendada);
            
            if (firmaRecomendada) {
                console.log(`\n✅ Firma recomendada encontrada: ${firmaRecomendada.descripcion}`);
                
                // Simular asociación (sin hacerla realmente)
                console.log('🔗 Simulando asociación de firma recomendada...');
                console.log('   - Thumbprint:', firmaRecomendada.thumbprint);
                console.log('   - Empresa:', firmaRecomendada.empresa);
                console.log('   - CIF:', firmaRecomendada.cif);
                console.log('   - Válido:', firmaRecomendada.isValido ? 'Sí' : 'No');
                
            } else {
                console.log('\n⚠️ No se encontró firma recomendada');
                
                // Mostrar la mejor opción disponible
                const mejorOpcion = resultadoEmpresa.firmas.find(f => f.compatible.compatible);
                if (mejorOpcion) {
                    console.log('💡 Mejor opción disponible:');
                    console.log('   - Descripción:', mejorOpcion.descripcion);
                    console.log('   - Compatible:', mejorOpcion.compatible.compatible ? 'Sí' : 'No');
                    console.log('   - Motivo:', mejorOpcion.compatible.motivo);
                    console.log('   - Nivel:', mejorOpcion.compatible.nivel);
                }
            }
            
        } else {
            console.log('❌ Error al obtener firmas para empresa:', resultadoEmpresa.error);
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

probarConEmpresaCorrecta().catch(console.error);
