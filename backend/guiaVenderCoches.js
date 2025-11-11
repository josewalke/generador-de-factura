const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('📋 GUÍA PARA VENDER COCHES');
console.log('==========================');

// Mostrar coches disponibles
db.all(`
    SELECT c.matricula, c.modelo, c.color, c.kms, p.id as producto_id
    FROM coches c
    JOIN productos p ON c.matricula = p.codigo
    WHERE c.activo = 1
    ORDER BY c.fecha_creacion DESC
    LIMIT 5
`, [], (err, coches) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log(`\n🚗 COCHES DISPONIBLES PARA VENTA:`);
    coches.forEach((coche, index) => {
        console.log(`   ${index + 1}. ${coche.matricula} (${coche.modelo}) - ${coche.color} - ${coche.kms}km`);
        console.log(`      Producto ID: ${coche.producto_id}`);
    });
    
    // Mostrar facturas existentes
    db.all(`
        SELECT f.id, f.numero_factura, f.fecha_emision, f.total
        FROM facturas f
        ORDER BY f.fecha_emision DESC
        LIMIT 3
    `, [], (err, facturas) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        
        console.log(`\n📄 FACTURAS EXISTENTES:`);
        facturas.forEach((factura, index) => {
            console.log(`   ${index + 1}. ${factura.numero_factura} - ${factura.fecha_emision} - €${factura.total}`);
        });
        
        console.log(`\n💡 CÓMO VENDER UN COCHE:`);
        console.log(`========================`);
        console.log(`1. Ve a la sección "Facturas"`);
        console.log(`2. Crea una nueva factura`);
        console.log(`3. Añade el producto del coche que quieres vender:`);
        console.log(`   - Busca por código: ${coches[0].matricula}`);
        console.log(`   - O selecciona el producto ID: ${coches[0].producto_id}`);
        console.log(`4. Establece el precio de venta`);
        console.log(`5. Guarda la factura`);
        console.log(`6. El coche aparecerá como vendido en la lista`);
        
        console.log(`\n🎯 EJEMPLO PRÁCTICO:`);
        console.log(`===================`);
        console.log(`Para vender el coche ${coches[0].matricula}:`);
        console.log(`- Producto a añadir: ${coches[0].matricula}`);
        console.log(`- Precio sugerido: €15,000`);
        console.log(`- El coche aparecerá como vendido`);
        
        db.close();
    });
});


