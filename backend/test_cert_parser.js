const DetectorCertificadosWindows = require('./modules/detectorCertificadosWindows');

async function testParser() {
    console.log('🧪 Probando parser de certificados...');
    
    const detector = new DetectorCertificadosWindows();
    await detector.inicializar();
    
    const resultado = await detector.obtenerCertificadosDisponibles();
    
    console.log('📋 Resultado del test:');
    console.log(JSON.stringify(resultado, null, 2));
}

testParser().catch(console.error);
