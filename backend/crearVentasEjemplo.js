const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

// Crear ventas de ejemplo
db.serialize(() => {
    console.log('🔗 Creando ventas de ejemplo...');
    
    // Obtener primera factura
    db.get("SELECT id, numero_factura FROM facturas LIMIT 1", (err, factura) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        
        if (!factura) {
            console.log('No hay facturas disponibles');
            return;
        }
        
        console.log(`Factura: ${factura.numero_factura}`);
        
        // Obtener primeros 3 coches con productos
        db.all(`
            SELECT c.matricula, c.modelo, p.id as producto_id
            FROM coches c
            JOIN productos p ON c.matricula = p.codigo
            WHERE c.activo = 1
            LIMIT 3
        `, (err, coches) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            
            console.log(`Coches disponibles: ${coches.length}`);
            
            // Crear detalles de factura para cada coche
            coches.forEach((coche, index) => {
                const precioVenta = 15000 + (index * 5000); // 15000, 20000, 25000
                const cantidad = 1;
                const subtotal = precioVenta * cantidad;
                const igic = subtotal * 0.07;
                const total = subtotal + igic;
                
                db.run(`
                    INSERT INTO detalles_factura (
                        factura_id, producto_id, cantidad, precio_unitario, 
                        subtotal, igic, total, descripcion, tipo_impuesto
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    factura.id,
                    coche.producto_id,
                    cantidad,
                    precioVenta,
                    subtotal,
                    igic,
                    total,
                    `${coche.modelo} - Vendido`,
                    'igic'
                ], function(err) {
                    if (err) {
                        console.log(`Error vendiendo ${coche.matricula}: ${err.message}`);
                    } else {
                        console.log(`✅ ${coche.matricula} vendido por €${precioVenta}`);
                    }
                });
            });
            
            // Verificar resultado
            setTimeout(() => {
                db.all(`
                    SELECT c.matricula, c.modelo, f.numero_factura, df.total as precio_venta
                    FROM coches c
                    JOIN productos p ON c.matricula = p.codigo
                    JOIN detalles_factura df ON p.id = df.producto_id
                    JOIN facturas f ON df.factura_id = f.id
                    WHERE c.activo = 1
                `, (err, ventas) => {
                    if (err) {
                        console.error('Error:', err);
                    } else {
                        console.log(`\n📊 Total coches vendidos: ${ventas.length}`);
                        ventas.forEach(venta => {
                            console.log(`   ${venta.matricula} - ${venta.numero_factura} - €${venta.precio_venta}`);
                        });
                        console.log('\n✅ ¡Ventas creadas! Ahora el Excel mostrará coches vendidos');
                    }
                    db.close();
                });
            }, 1000);
        });
    });
});


