const SistemaFirmaDigital = require('./modules/sistemaFirmaDigital');

async function probarFirmaDocumento() {
    console.log('🧪 Probando firma de documento con certificado de empresa...');
    
    const sistemaFirma = new SistemaFirmaDigital();
    
    try {
        // Datos de ejemplo de una factura
        const datosFactura = {
            numeroFactura: 'FAC-2025-001',
            fecha: '2025-09-11',
            empresa: {
                nombre: 'Telwagen Car Ibérica, S.L.',
                cif: 'B12345678',
                direccion: 'Calle Principal 123, Madrid'
            },
            cliente: {
                nombre: 'Cliente Ejemplo S.L.',
                cif: 'A87654321',
                direccion: 'Calle Secundaria 456, Barcelona'
            },
            productos: [
                {
                    descripcion: 'Reparación motor',
                    cantidad: 1,
                    precio: 1500.00,
                    total: 1500.00
                },
                {
                    descripcion: 'Piezas de recambio',
                    cantidad: 3,
                    precio: 200.00,
                    total: 600.00
                }
            ],
            subtotal: 2100.00,
            iva: 441.00,
            total: 2541.00
        };
        
        console.log('📄 Datos de la factura:', JSON.stringify(datosFactura, null, 2));
        
        // Firmar documento con certificado de empresa ID 1
        console.log('\n🔐 Firmando documento con certificado de empresa Telwagen...');
        const resultadoFirma = await sistemaFirma.firmarDocumentoConEmpresa(1, datosFactura);
        
        if (resultadoFirma.success) {
            console.log('✅ Documento firmado exitosamente!');
            console.log('📁 Archivo de firma:', resultadoFirma.firma.archivo);
            console.log('🔑 Hash del documento:', resultadoFirma.firma.hash);
            console.log('🏢 Empresa firmante:', resultadoFirma.firma.certificado.empresa);
            console.log('📅 Timestamp:', resultadoFirma.firma.timestamp);
            console.log('📝 Mensaje:', resultadoFirma.mensaje);
            
            // Mostrar información del certificado usado
            console.log('\n🔐 Información del certificado usado:');
            console.log('   - Empresa:', resultadoFirma.firma.certificado.empresa);
            console.log('   - CIF:', resultadoFirma.firma.certificado.cif);
            console.log('   - Thumbprint:', resultadoFirma.firma.certificado.thumbprint);
            console.log('   - Válido desde:', resultadoFirma.firma.certificado.validoDesde);
            console.log('   - Válido hasta:', resultadoFirma.firma.certificado.validoHasta);
            console.log('   - Emisor:', resultadoFirma.firma.certificado.emisor);
            
        } else {
            console.log('❌ Error al firmar documento:', resultadoFirma.error);
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

probarFirmaDocumento().catch(console.error);
