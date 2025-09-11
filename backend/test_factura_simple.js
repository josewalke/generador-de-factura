const http = require('http');

function hacerPeticion(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ data: response, status: res.statusCode });
                } catch (error) {
                    resolve({ data: body, status: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function probarFacturaSimple() {
    console.log('🧪 Probando creación de factura simple...');
    
    try {
        const datosFactura = {
            numero_factura: 'FAC-2025-SIMPLE-001',
            empresa_id: 1,
            cliente_id: 1,
            fecha_emision: '2025-09-11',
            fecha_vencimiento: '2025-10-11',
            subtotal: 100.00,
            igic: 21.00,
            total: 121.00,
            productos: []
        };
        
        console.log('📄 Datos de factura:', JSON.stringify(datosFactura, null, 2));
        
        const respuesta = await hacerPeticion('POST', '/api/facturas', datosFactura);
        
        console.log('📋 Respuesta:', JSON.stringify(respuesta, null, 2));
        
        if (respuesta.data.success) {
            console.log('✅ Factura creada exitosamente!');
            console.log('🆔 ID:', respuesta.data.data.id);
            console.log('📄 Número:', respuesta.data.data.numero_factura);
            
            // Verificar firma
            const facturaId = respuesta.data.data.id;
            const respuestaFactura = await hacerPeticion('GET', `/api/facturas/${facturaId}`);
            
            if (respuestaFactura.data.success) {
                const factura = respuestaFactura.data.data;
                console.log('\n🔐 Verificando firma digital...');
                
                if (factura.respuesta_aeat) {
                    const respuestaAEAT = JSON.parse(factura.respuesta_aeat);
                    if (respuestaAEAT.firma_digital) {
                        console.log('✅ Firma digital encontrada!');
                        console.log('🏢 Empresa firmante:', respuestaAEAT.firma_digital.certificado.empresa);
                        console.log('🔑 Hash:', respuestaAEAT.firma_digital.hash);
                        console.log('📁 Archivo:', respuestaAEAT.archivo_firma);
                    } else {
                        console.log('⚠️ No hay firma digital');
                    }
                } else {
                    console.log('⚠️ No hay respuesta AEAT');
                }
            }
            
        } else {
            console.log('❌ Error:', respuesta.data.error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

probarFacturaSimple().catch(console.error);
