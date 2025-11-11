const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

// Crear venta de ejemplo paso a paso
db.serialize(() => {
    console.log('🚗 Creando venta de ejemplo...');
    
    // 1. Verificar empresa
    db.get("SELECT id FROM empresas LIMIT 1", (err, empresa) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        
        const empresaId = empresa ? empresa.id : 1;
        console.log(`📋 Usando empresa ID: ${empresaId}`);
        
        // 2. Obtener primer coche
        db.get(`
            SELECT c.matricula, c.modelo, p.id as producto_id
            FROM coches c
            JOIN productos p ON c.matricula = p.codigo
            WHERE c.activo = 1
            LIMIT 1
        `, (err, coche) => {
            if (err) {
                console.error('Error:', err);
                return;
            }
            
            if (!coche) {
                console.log('❌ No hay coches disponibles');
                return;
            }
            
            console.log(`🚗 Coche: ${coche.matricula} (${coche.modelo})`);
            
            // 3. Crear factura
            const numeroFactura = `VENTA-${Date.now()}`;
            const precioVenta = 15000;
            const subtotal = precioVenta;
            const igic = subtotal * 0.07;
            const total = subtotal + igic;
            
            db.run(`
                INSERT INTO facturas (
                    numero_factura, empresa_id, fecha_emision,
                    subtotal, igic, total, estado
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [numeroFactura, empresaId, new Date().toISOString().split('T')[0], subtotal, igic, total, 'pendiente'], function(err) {
                if (err) {
                    console.error('❌ Error factura:', err.message);
                    return;
                }
                
                const facturaId = this.lastID;
                console.log(`✅ Factura creada: ${numeroFactura} (ID: ${facturaId})`);
                
                // 4. Crear detalle
                db.run(`
                    INSERT INTO detalles_factura (
                        factura_id, producto_id, cantidad, precio_unitario,
                        subtotal, igic, total, descripcion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [facturaId, coche.producto_id, 1, precioVenta, subtotal, igic, total, `${coche.modelo} vendido`], function(err) {
                    if (err) {
                        console.error('❌ Error detalle:', err.message);
                        return;
                    }
                    
                    console.log(`✅ Detalle creado (ID: ${this.lastID})`);
                    console.log(`\n🎉 ¡VENTA COMPLETADA!`);
                    console.log(`   Coche: ${coche.matricula}`);
                    console.log(`   Factura: ${numeroFactura}`);
                    console.log(`   Precio: €${precioVenta}`);
                    console.log(`\n✅ Ahora exporta el Excel para ver el coche vendido`);
                    
                    db.close();
                });
            });
        });
    });
});


