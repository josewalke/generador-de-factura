const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🚗 Creando venta de ejemplo...');

// Obtener primer coche disponible
db.get(`
    SELECT c.matricula, c.modelo, c.color, c.kms, p.id as producto_id
    FROM coches c
    JOIN productos p ON c.matricula = p.codigo
    WHERE c.activo = 1
    ORDER BY c.fecha_creacion DESC
    LIMIT 1
`, [], (err, coche) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    if (!coche) {
        console.log('❌ No hay coches disponibles');
        return;
    }
    
    console.log(`📋 Coche seleccionado: ${coche.matricula} (${coche.modelo})`);
    console.log(`   Producto ID: ${coche.producto_id}`);
    
    // Crear factura de ejemplo
    const numeroFactura = `VENTA-${Date.now()}`;
    const precioVenta = 15000;
    const cantidad = 1;
    const subtotal = precioVenta * cantidad;
    const igic = subtotal * 0.07; // 7% IGIC
    const total = subtotal + igic;
    
    console.log(`\n💰 Creando factura: ${numeroFactura}`);
    console.log(`   Precio: €${precioVenta}`);
    console.log(`   Total: €${total.toFixed(2)}`);
    
    // Insertar factura
    db.run(`
        INSERT INTO facturas (
            numero_factura, empresa_id, cliente_id, fecha_emision,
            subtotal, igic, total, estado, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        numeroFactura,
        1, // empresa_id (asumiendo que existe)
        null, // cliente_id (sin cliente específico)
        new Date().toISOString().split('T')[0],
        subtotal,
        igic,
        total,
        'pendiente',
        `Venta de ${coche.matricula} (${coche.modelo})`
    ], function(err) {
        if (err) {
            console.error('❌ Error creando factura:', err.message);
            return;
        }
        
        const facturaId = this.lastID;
        console.log(`✅ Factura creada con ID: ${facturaId}`);
        
        // Crear detalle de factura
        db.run(`
            INSERT INTO detalles_factura (
                factura_id, producto_id, cantidad, precio_unitario,
                subtotal, igic, total, descripcion, tipo_impuesto
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            facturaId,
            coche.producto_id,
            cantidad,
            precioVenta,
            subtotal,
            igic,
            total,
            `${coche.modelo} - ${coche.color} (${coche.kms}km)`,
            'igic'
        ], function(err) {
            if (err) {
                console.error('❌ Error creando detalle:', err.message);
                return;
            }
            
            console.log(`✅ Detalle de factura creado con ID: ${this.lastID}`);
            
            // Verificar resultado
            db.get(`
                SELECT c.matricula, c.modelo, f.numero_factura, f.fecha_emision, df.total as precio_venta
                FROM coches c
                JOIN productos p ON c.matricula = p.codigo
                JOIN detalles_factura df ON p.id = df.producto_id
                JOIN facturas f ON df.factura_id = f.id
                WHERE c.matricula = ?
            `, [coche.matricula], (err, resultado) => {
                if (err) {
                    console.error('Error:', err);
                } else if (resultado) {
                    console.log(`\n🎉 ¡COCHE VENDIDO EXITOSAMENTE!`);
                    console.log(`   Coche: ${resultado.matricula} (${resultado.modelo})`);
                    console.log(`   Factura: ${resultado.numero_factura}`);
                    console.log(`   Fecha: ${resultado.fecha_emision}`);
                    console.log(`   Precio: €${resultado.precio_venta}`);
                    console.log(`\n✅ Ahora el coche aparecerá como vendido en el Excel`);
                } else {
                    console.log('❌ Error verificando la venta');
                }
                
                db.close();
            });
        });
    });
});


