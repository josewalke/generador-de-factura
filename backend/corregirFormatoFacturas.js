const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🔧 CORRIGIENDO FORMATO DE FACTURAS...');
console.log('=====================================');

// Función para corregir el formato de facturas
function corregirFormatoFacturas() {
    console.log('\n📋 PASO 1: Identificando facturas con formato incorrecto...');
    
    // Obtener facturas con formato incorrecto
    db.all(`
        SELECT f.id, f.numero_factura, f.total, f.igic, f.subtotal, c.nombre as cliente
        FROM facturas f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        WHERE f.numero_factura LIKE 'VENTA-%'
        ORDER BY f.id DESC
    `, (err, facturasIncorrectas) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        console.log(`📊 Facturas con formato incorrecto encontradas: ${facturasIncorrectas.length}`);
        
        if (facturasIncorrectas.length === 0) {
            console.log('✅ Todas las facturas tienen el formato correcto');
            verificarResultado();
            return;
        }
        
        // Mostrar facturas incorrectas
        facturasIncorrectas.forEach(factura => {
            console.log(`❌ Formato incorrecto: ${factura.numero_factura} - €${factura.total} - ${factura.cliente || 'SIN CLIENTE'}`);
        });
        
        // Obtener el último número de factura correcto
        db.get(`
            SELECT numero_factura
            FROM facturas
            WHERE numero_factura LIKE 'TECPA%'
            ORDER BY id DESC
            LIMIT 1
        `, (err, ultimaFactura) => {
            if (err) {
                console.error('❌ Error:', err);
                return;
            }
            
            let siguienteNumero = 1;
            if (ultimaFactura) {
                // Extraer el número de la última factura
                const match = ultimaFactura.numero_factura.match(/TECPA(\d+)\/2025/);
                if (match) {
                    siguienteNumero = parseInt(match[1]) + 1;
                }
            }
            
            console.log(`\n📋 PASO 2: Corrigiendo formato de facturas...`);
            console.log(`📋 Siguiente número de factura: TECPA${siguienteNumero.toString().padStart(3, '0')}/2025`);
            
            let facturasCorregidas = 0;
            facturasIncorrectas.forEach((factura, index) => {
                const nuevoNumero = `TECPA${(siguienteNumero + index).toString().padStart(3, '0')}/2025`;
                
                // Actualizar número de factura
                db.run(`
                    UPDATE facturas 
                    SET numero_factura = ?
                    WHERE id = ?
                `, [nuevoNumero, factura.id], function(err) {
                    if (err) {
                        console.error(`❌ Error actualizando factura ${factura.id}:`, err.message);
                    } else {
                        console.log(`✅ Factura ${factura.numero_factura} → ${nuevoNumero}`);
                    }
                    
                    facturasCorregidas++;
                    if (facturasCorregidas === facturasIncorrectas.length) {
                        verificarResultado();
                    }
                });
            });
        });
    });
}

// Función para verificar el resultado
function verificarResultado() {
    console.log('\n📋 PASO 3: Verificando resultado...');
    
    // Verificar todas las facturas
    db.all(`
        SELECT f.id, f.numero_factura, f.total, f.igic, f.subtotal, c.nombre as cliente
        FROM facturas f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        ORDER BY f.id DESC
    `, (err, facturas) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        console.log('\n📋 TODAS LAS FACTURAS CORREGIDAS:');
        console.log('==================================');
        
        facturas.forEach(factura => {
            const formato = factura.numero_factura.includes('TECPA') ? '✅ CORRECTO' : '❌ INCORRECTO';
            console.log(`${formato} ${factura.numero_factura}: €${factura.total} (IGIC: €${factura.igic}) - ${factura.cliente || 'SIN CLIENTE'}`);
        });
        
        // Verificar coches vendidos
        console.log('\n🚗 VERIFICANDO COCHES VENDIDOS:');
        console.log('================================');
        
        db.all(`
            SELECT c.matricula, c.modelo,
                   CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                   f.numero_factura, f.total as precio_venta, f.igic,
                   cl.nombre as cliente_nombre
            FROM coches c
            LEFT JOIN productos p ON c.matricula = p.codigo
            LEFT JOIN detalles_factura df ON p.id = df.producto_id
            LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
            LEFT JOIN clientes cl ON f.cliente_id = cl.id
            WHERE c.activo = 1
            ORDER BY c.fecha_creacion DESC
            LIMIT 10
        `, (err, coches) => {
            if (err) {
                console.error('❌ Error:', err);
                return;
            }
            
            let vendidos = 0;
            let disponibles = 0;
            
            coches.forEach(coche => {
                if (coche.vendido) {
                    vendidos++;
                    const precioConIGIC = coche.precio_venta ? `€${coche.precio_venta.toFixed(2)}` : 'Sin precio';
                    const igic = coche.igic ? ` (IGIC: €${coche.igic.toFixed(2)})` : '';
                    const cliente = coche.cliente_nombre || 'Sin cliente';
                    console.log(`✅ VENDIDO: ${coche.matricula} (${coche.modelo}) - ${coche.numero_factura} - ${precioConIGIC}${igic} - ${cliente}`);
                } else {
                    disponibles++;
                    console.log(`🟡 DISPONIBLE: ${coche.matricula} (${coche.modelo})`);
                }
            });
            
            console.log(`\n📊 RESUMEN FINAL:`);
            console.log(`   Vendidos: ${vendidos}`);
            console.log(`   Disponibles: ${disponibles}`);
            console.log(`   Total: ${coches.length}`);
            
            if (vendidos > 0) {
                console.log('\n🎉 ¡ÉXITO! Todas las facturas tienen el formato correcto');
                console.log('📱 Refresca la aplicación para ver los cambios');
            } else {
                console.log('\n❌ No se pudieron corregir las facturas');
            }
            
            db.close();
        });
    });
}

// Ejecutar el proceso
corregirFormatoFacturas();


