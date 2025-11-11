const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

async function verificarVentasCompletas() {
    try {
        console.log('🔍 Verificando ventas completas después de asociar productos...');
        
        // Verificar la cadena completa: coche -> producto -> detalle -> factura
        const ventasCompletas = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo, p.codigo as producto_codigo, 
                       df.id as detalle_id, f.numero_factura, f.estado, f.total, f.fecha_emision,
                       cl.nombre as cliente_nombre
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                LEFT JOIN facturas f ON df.factura_id = f.id
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE c.activo = 1 AND f.id IS NOT NULL
                ORDER BY f.fecha_emision DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📊 Total coches vendidos: ${ventasCompletas.length}`);
        
        if (ventasCompletas.length > 0) {
            console.log('\n🚗 COCHES VENDIDOS:');
            ventasCompletas.forEach((venta, index) => {
                console.log(`\n${index + 1}. ${venta.matricula} (${venta.modelo})`);
                console.log(`   📄 Factura: ${venta.numero_factura}`);
                console.log(`   📅 Fecha: ${venta.fecha_emision}`);
                console.log(`   💰 Total: €${venta.total}`);
                console.log(`   👤 Cliente: ${venta.cliente_nombre}`);
                console.log(`   📋 Estado: ${venta.estado}`);
            });
        } else {
            console.log('\n⚠️  No hay coches vendidos aún');
            console.log('   Los coches tienen productos, pero no hay facturas que los incluyan');
        }
        
        // Verificar la consulta que usa la aplicación
        console.log('\n🧪 PROBANDO CONSULTA DE LA APLICACIÓN:');
        const consultaApp = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.*,
                       CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                       f.numero_factura,
                       f.fecha_emision as fecha_venta,
                       f.total as precio_venta,
                       cl.nombre as cliente_nombre
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE c.activo = 1 
                ORDER BY c.fecha_creacion DESC
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Total coches en consulta: ${consultaApp.length}`);
        let vendidos = 0;
        consultaApp.forEach(coche => {
            if (coche.vendido) {
                vendidos++;
                console.log(`✅ ${coche.matricula} - VENDIDO - Factura: ${coche.numero_factura}`);
            } else {
                console.log(`⏳ ${coche.matricula} - DISPONIBLE`);
            }
        });
        
        console.log(`\n📈 RESUMEN: ${vendidos} vendidos de ${consultaApp.length} coches`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

verificarVentasCompletas();


