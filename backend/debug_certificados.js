const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

async function debugCertificados() {
    console.log('🔍 Debug: Revisando formato de certificados...');
    
    const sistemaFirma = new SistemaFirmaDigital();
    
    try {
        const certificados = await sistemaFirma.detectarCertificadosWindows();
        
        console.log('📋 Resultado completo:', JSON.stringify(certificados, null, 2));
        
        if (certificados.success && certificados.certificados.length > 0) {
            console.log('\n📋 Primer certificado detallado:');
            const cert = certificados.certificados[0];
            console.log('   - Tipo:', typeof cert);
            console.log('   - Keys:', Object.keys(cert));
            console.log('   - thumbprint:', cert.thumbprint);
            console.log('   - empresa:', cert.empresa);
            console.log('   - CommonName:', cert.CommonName);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugCertificados().catch(console.error);
