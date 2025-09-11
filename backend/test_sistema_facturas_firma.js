const http = require('http');

const BASE_URL = 'http://localhost:3000';

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

async function probarSistemaFacturasConFirma() {
    console.log('🧪 Probando sistema completo de facturas con firma digital...');
    
    try {
        // 1. Crear una factura de prueba
        console.log('\n📄 Creando factura de prueba...');
        
        // Calcular totales
        const subtotal = 1300.00; // 1000 + 300
        const impuesto = 273.00;  // 210 + 63
        const total = 1573.00;   // 1210 + 363
        
        const datosFactura = {
            numero_factura: 'FAC-2025-TEST-001',
            empresa_id: 1, // Telwagen
            cliente_id: 1,
            fecha_emision: '2025-09-11',
            fecha_vencimiento: '2025-10-11',
            subtotal: subtotal,
            igic: impuesto,
            total: total,
            productos: [
                {
                    productoId: 1,
                    cantidad: 2,
                    precioUnitario: 500.00,
                    subtotal: 1000.00,
                    impuesto: 210.00,
                    total: 1210.00,
                    descripcion: 'Reparación completa motor',
                    tipoImpuesto: 'igic'
                },
                {
                    productoId: 2,
                    cantidad: 1,
                    precioUnitario: 300.00,
                    subtotal: 300.00,
                    impuesto: 63.00,
                    total: 363.00,
                    descripcion: 'Piezas de recambio',
                    tipoImpuesto: 'igic'
                }
            ]
        };
        
        const respuestaCreacion = await hacerPeticion('POST', '/api/facturas', datosFactura);
        
        if (respuestaCreacion.data.success) {
            const facturaId = respuestaCreacion.data.data.id;
            console.log('✅ Factura creada exitosamente:', facturaId);
            console.log('📋 Número de factura:', respuestaCreacion.data.data.numero_factura);
            
            // 2. Verificar que la factura se firmó automáticamente
            console.log('\n🔐 Verificando firma digital automática...');
            const respuestaFactura = await hacerPeticion('GET', `/api/facturas/${facturaId}`);
            
            if (respuestaFactura.data.success) {
                const factura = respuestaFactura.data.data;
                console.log('📄 Factura obtenida:', factura.numero_factura);
                
                if (factura.respuesta_aeat) {
                    const respuestaAEAT = JSON.parse(factura.respuesta_aeat);
                    if (respuestaAEAT.firma_digital) {
                        console.log('✅ Firma digital encontrada en la factura');
                        console.log('📁 Archivo de firma:', respuestaAEAT.archivo_firma);
                        console.log('🔑 Hash:', respuestaAEAT.firma_digital.hash);
                        console.log('🏢 Empresa firmante:', respuestaAEAT.firma_digital.certificado.empresa);
                        console.log('📅 Timestamp:', respuestaAEAT.firma_digital.timestamp);
                    } else {
                        console.log('⚠️ No se encontró firma digital en la factura');
                    }
                } else {
                    console.log('⚠️ No hay información de respuesta AEAT');
                }
            }
            
            // 3. Probar firma manual adicional
            console.log('\n🔐 Probando firma manual adicional...');
            const respuestaFirmaManual = await hacerPeticion('POST', `/api/facturas/${facturaId}/firmar`);
            
            if (respuestaFirmaManual.data.success) {
                console.log('✅ Firma manual exitosa');
                console.log('📁 Archivo de firma:', respuestaFirmaManual.data.firma.archivo);
                console.log('🏢 Certificado usado:', respuestaFirmaManual.data.firma.certificado.empresa);
            } else {
                console.log('❌ Error en firma manual:', respuestaFirmaManual.data.error);
            }
            
        } else {
            console.log('❌ Error al crear factura:', respuestaCreacion.data.error);
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error.response?.data || error.message);
    }
}

// Verificar que el servidor esté ejecutándose
async function verificarServidor() {
    try {
        await hacerPeticion('GET', '/');
        console.log('✅ Servidor backend ejecutándose');
        return true;
    } catch (error) {
        console.log('❌ Servidor backend no disponible. Ejecuta: npm start');
        return false;
    }
}

async function main() {
    const servidorActivo = await verificarServidor();
    if (servidorActivo) {
        await probarSistemaFacturasConFirma();
    }
}

main().catch(console.error);
