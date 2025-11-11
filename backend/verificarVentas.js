const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🚗 VERIFICANDO COCHES VENDIDOS...');
console.log('==================================');

db.all(`
    SELECT c.matricula, c.modelo, c.color,
           CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
           f.numero_factura, f.total as precio_venta
    FROM coches c
    LEFT JOIN productos p ON c.matricula = p.codigo
    LEFT JOIN detalles_factura df ON p.id = df.producto_id
    LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
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
    
    console.log('\n📋 ESTADO DE LOS COCHES:');
    console.log('========================');
    
    coches.forEach(coche => {
        if (coche.vendido) {
            vendidos++;
            console.log(`✅ VENDIDO: ${coche.matricula} (${coche.modelo}) - ${coche.numero_factura} - €${coche.precio_venta}`);
        } else {
            disponibles++;
            console.log(`🟡 DISPONIBLE: ${coche.matricula} (${coche.modelo}) - ${coche.color}`);
        }
    });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Vendidos: ${vendidos}`);
    console.log(`   Disponibles: ${disponibles}`);
    console.log(`   Total: ${coches.length}`);
    
    if (vendidos > 0) {
        console.log('\n🎉 ¡ÉXITO! Ahora tienes coches vendidos en el sistema');
        console.log('📱 Refresca la aplicación para ver los cambios');
    } else {
        console.log('\n❌ No se encontraron coches vendidos');
    }
    
    db.close();
});


