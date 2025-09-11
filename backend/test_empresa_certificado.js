const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

async function probarAsociacionEmpresaCertificado() {
    console.log('🧪 Probando asociación empresa-certificado...');
    
    const sistemaFirma = new SistemaFirmaDigital();
    
    try {
        // Obtener certificados disponibles
        console.log('🔍 Obteniendo certificados disponibles...');
        const certificados = await sistemaFirma.obtenerCertificadosWindows();
        
        if (!certificados.success || certificados.certificados.length === 0) {
            console.log('❌ No hay certificados disponibles');
            return;
        }
        
        const certificado = certificados.certificados[0];
        console.log('📋 Certificado completo:', JSON.stringify(certificado, null, 2));
        console.log('📋 Certificado encontrado:', certificado.empresa);
        console.log('🔑 Thumbprint:', certificado.thumbprint);
        
        if (!certificado.thumbprint) {
            console.log('❌ El certificado no tiene thumbprint válido');
            return;
        }
        
        // Asociar con empresa ID 1 (Telwagen)
        console.log('🔗 Asociando certificado con empresa Telwagen (ID: 1)...');
        const resultado = await sistemaFirma.asociarCertificadoConEmpresa(1, certificado.thumbprint);
        
        if (resultado.success) {
            console.log('✅ Asociación exitosa!');
            console.log('🏢 Empresa:', resultado.empresa.nombre);
            console.log('🔐 Certificado:', resultado.certificado.CommonName);
            console.log('📝 Mensaje:', resultado.mensaje);
            
            // Probar obtención del certificado
            console.log('\n🔍 Probando obtención del certificado asociado...');
            const certificadoEmpresa = await sistemaFirma.obtenerCertificadoEmpresa(1);
            
            if (certificadoEmpresa.success) {
                console.log('✅ Certificado obtenido correctamente');
                console.log('🏢 Empresa ID:', 1);
                console.log('🔐 Certificado:', certificadoEmpresa.certificado.CommonName);
                console.log('📅 Fecha asociación:', certificadoEmpresa.fechaAsociacion);
            } else {
                console.log('❌ Error al obtener certificado:', certificadoEmpresa.error);
            }
            
        } else {
            console.log('❌ Error en asociación:', resultado.error);
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

probarAsociacionEmpresaCertificado().catch(console.error);
