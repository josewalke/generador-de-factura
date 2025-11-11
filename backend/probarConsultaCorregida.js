const sqlite3 = require('sqlite3').verbose();

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

async function probarConsultaCorregida() {
    try {
        console.log('🧪 Probando consulta corregida...');
        
        const consultaCorregida = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.*,
                       CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                       f.numero_factura,
                       f.fecha_emision as fecha_venta,
                       f.total as precio_venta,
                       f.estado as estado_factura,
                       cl.nombre as cliente_nombre
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE c.activo = 1 
                ORDER BY c.fecha_creacion DESC
                LIMIT 10
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n📊 RESULTADO DE LA CONSULTA CORREGIDA:`);
        console.log('=====================================');
        console.log(`Total coches: ${consultaCorregida.length}`);
        
        let cochesVendidos = 0;
        consultaCorregida.forEach((coche, index) => {
            console.log(`\n🚗 Coche ${index + 1}: ${coche.matricula} (${coche.modelo})`);
            console.log(`   Vendido: ${coche.vendido ? 'SÍ' : 'NO'}`);
            
            if (coche.vendido) {
                cochesVendidos++;
                console.log(`   📄 Nº Factura: ${coche.numero_factura}`);
                console.log(`   📅 Fecha Venta: ${coche.fecha_venta}`);
                console.log(`   💰 Precio: €${coche.precio_venta}`);
                console.log(`   👤 Cliente: ${coche.cliente_nombre}`);
                console.log(`   📋 Estado Factura: ${coche.estado_factura}`);
            }
        });
        
        console.log(`\n📈 RESUMEN:`);
        console.log(`   Total coches: ${consultaCorregida.length}`);
        console.log(`   Coches vendidos: ${cochesVendidos}`);
        console.log(`   Coches disponibles: ${consultaCorregida.length - cochesVendidos}`);
        
        if (cochesVendidos > 0) {
            console.log('\n✅ ¡PERFECTO! Ahora se muestran los números de factura');
        } else {
            console.log('\n⚠️  No hay coches vendidos en la base de datos');
            console.log('   Las facturas están en estado "pendiente" pero no hay coches asociados');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

probarConsultaCorregida();


