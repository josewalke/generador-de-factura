const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🚗 SOLUCIONANDO PROBLEMA DE VENTAS...');
console.log('=====================================');

// Paso 1: Verificar coches disponibles
db.all(`
    SELECT c.id, c.matricula, c.modelo, c.color, c.kms
    FROM coches c
    WHERE c.activo = 1
    ORDER BY c.fecha_creacion DESC
    LIMIT 5
`, (err, coches) => {
    if (err) {
        console.error('❌ Error:', err);
        return;
    }
    
    console.log(`\n📊 Coches disponibles: ${coches.length}`);
    coches.forEach((coche, index) => {
        console.log(`   ${index + 1}. ${coche.matricula} (${coche.modelo}) - ${coche.color}`);
    });
    
    // Paso 2: Crear productos para estos coches
    console.log('\n📋 Creando productos para coches...');
    
    let productosCreados = 0;
    coches.forEach((coche, index) => {
        const precio = 15000 + (index * 2000);
        const descripcion = `${coche.modelo} - ${coche.color} - ${coche.kms}km`;
        
        db.run(`
            INSERT OR IGNORE INTO productos (codigo, descripcion, precio, stock, activo)
            VALUES (?, ?, ?, ?, ?)
        `, [coche.matricula, descripcion, precio, 1, 1], function(err) {
            if (err) {
                console.error(`❌ Error:`, err.message);
            } else {
                productosCreados++;
                console.log(`✅ Producto: ${coche.matricula} - €${precio}`);
            }
            
            if (productosCreados === coches.length) {
                crearFacturas();
            }
        });
    });
});

function crearFacturas() {
    console.log('\n📋 Creando facturas de ejemplo...');
    
    // Obtener empresa y cliente
    db.get("SELECT id FROM empresas LIMIT 1", (err, empresa) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        db.get("SELECT id FROM clientes LIMIT 1", (err, cliente) => {
            if (err) {
                console.error('❌ Error:', err);
                return;
            }
            
            const empresaId = empresa ? empresa.id : 1;
            const clienteId = cliente ? cliente.id : 1;
            
            // Obtener productos recién creados
            db.all(`
                SELECT p.id, p.codigo, p.descripcion, p.precio
                FROM productos p
                WHERE p.activo = 1
                ORDER BY p.id DESC
                LIMIT 3
            `, (err, productos) => {
                if (err) {
                    console.error('❌ Error:', err);
                    return;
                }
                
                console.log(`📊 Productos para facturas: ${productos.length}`);
                
                let facturasCreadas = 0;
                productos.forEach((producto, index) => {
                    const numeroFactura = `VENTA-${Date.now()}-${index + 1}`;
                    const cantidad = 1;
                    const subtotal = producto.precio * cantidad;
                    const igic = subtotal * 0.07;
                    const total = subtotal + igic;
                    
                    // Crear factura
                    db.run(`
                        INSERT INTO facturas (
                            numero_factura, fecha_emision, fecha_vencimiento,
                            cliente_id, empresa_id, subtotal, igic, total,
                            estado, metodo_pago
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        numeroFactura,
                        new Date().toISOString().split('T')[0],
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        clienteId,
                        empresaId,
                        subtotal,
                        igic,
                        total,
                        'pagada',
                        'transferencia'
                    ], function(err) {
                        if (err) {
                            console.error(`❌ Error factura:`, err.message);
                        } else {
                            const facturaId = this.lastID;
                            console.log(`✅ Factura: ${numeroFactura} - €${total.toFixed(2)}`);
                            
                            // Crear detalle
                            db.run(`
                                INSERT INTO detalles_factura (
                                    factura_id, producto_id, cantidad, precio_unitario,
                                    subtotal, igic, total
                                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                            `, [
                                facturaId,
                                producto.id,
                                cantidad,
                                producto.precio,
                                subtotal,
                                igic,
                                total
                            ], function(err) {
                                if (err) {
                                    console.error(`❌ Error detalle:`, err.message);
                                } else {
                                    console.log(`✅ Detalle: ${producto.codigo} - €${producto.precio}`);
                                }
                                
                                facturasCreadas++;
                                if (facturasCreadas === productos.length) {
                                    verificarResultado();
                                }
                            });
                        }
                    });
                });
            });
        });
    });
}

function verificarResultado() {
    console.log('\n📋 Verificando resultado final...');
    
    db.all(`
        SELECT c.matricula, c.modelo,
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
        
        console.log('\n🚗 ESTADO FINAL DE LOS COCHES:');
        console.log('==============================');
        
        let vendidos = 0;
        let disponibles = 0;
        
        coches.forEach(coche => {
            if (coche.vendido) {
                vendidos++;
                console.log(`✅ VENDIDO: ${coche.matricula} (${coche.modelo}) - ${coche.numero_factura} - €${coche.precio_venta}`);
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
            console.log('\n🎉 ¡ÉXITO! Ahora tienes coches vendidos');
            console.log('📱 Refresca la aplicación para ver los cambios');
        } else {
            console.log('\n❌ No se pudieron crear las ventas');
        }
        
        db.close();
    });
}
