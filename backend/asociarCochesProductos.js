const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🚗 ASOCIANDO COCHES CON PRODUCTOS...');
console.log('=====================================');

// Función para asociar coches con productos
function asociarCochesProductos() {
    console.log('\n📋 PASO 1: Verificando coches sin productos asociados...');
    
    db.all(`
        SELECT c.id, c.matricula, c.modelo, c.color, c.kms
        FROM coches c
        LEFT JOIN productos p ON c.matricula = p.codigo
        WHERE c.activo = 1 AND p.id IS NULL
        ORDER BY c.fecha_creacion DESC
    `, (err, cochesSinProducto) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        console.log(`📊 Coches sin productos asociados: ${cochesSinProducto.length}`);
        
        if (cochesSinProducto.length === 0) {
            console.log('✅ Todos los coches ya tienen productos asociados');
            crearFacturasEjemplo();
            return;
        }
        
        // Crear productos para coches que no los tienen
        console.log('\n📋 PASO 2: Creando productos para coches...');
        
        let productosCreados = 0;
        cochesSinProducto.forEach((coche, index) => {
            const precioBase = 15000 + (index * 2000); // Precios variados
            const descripcion = `${coche.modelo} - ${coche.color} - ${coche.kms}km`;
            
            db.run(`
                INSERT INTO productos (codigo, descripcion, precio, stock, activo)
                VALUES (?, ?, ?, ?, ?)
            `, [coche.matricula, descripcion, precioBase, 1, 1], function(err) {
                if (err) {
                    console.error(`❌ Error creando producto para ${coche.matricula}:`, err.message);
                } else {
                    productosCreados++;
                    console.log(`✅ Producto creado: ${coche.matricula} - €${precioBase}`);
                }
                
                if (productosCreados === cochesSinProducto.length) {
                    console.log(`\n🎉 Se crearon ${productosCreados} productos nuevos`);
                    crearFacturasEjemplo();
                }
            });
        });
    });
}

// Función para crear facturas de ejemplo
function crearFacturasEjemplo() {
    console.log('\n📋 PASO 3: Creando facturas de ejemplo...');
    
    // Obtener empresa
    db.get("SELECT id FROM empresas LIMIT 1", (err, empresa) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        const empresaId = empresa ? empresa.id : 1;
        console.log(`📋 Usando empresa ID: ${empresaId}`);
        
        // Obtener cliente
        db.get("SELECT id FROM clientes LIMIT 1", (err, cliente) => {
            if (err) {
                console.error('❌ Error:', err);
                return;
            }
            
            const clienteId = cliente ? cliente.id : 1;
            console.log(`📋 Usando cliente ID: ${clienteId}`);
            
            // Obtener productos de coches para crear facturas
            db.all(`
                SELECT p.id, p.codigo, p.descripcion, p.precio, c.modelo
                FROM productos p
                JOIN coches c ON p.codigo = c.matricula
                WHERE p.activo = 1
                ORDER BY c.fecha_creacion DESC
                LIMIT 5
            `, (err, productos) => {
                if (err) {
                    console.error('❌ Error:', err);
                    return;
                }
                
                console.log(`📊 Productos disponibles para facturas: ${productos.length}`);
                
                if (productos.length === 0) {
                    console.log('❌ No hay productos disponibles');
                    return;
                }
                
                // Crear facturas de ejemplo
                let facturasCreadas = 0;
                const totalFacturas = Math.min(3, productos.length); // Máximo 3 facturas
                
                for (let i = 0; i < totalFacturas; i++) {
                    const producto = productos[i];
                    const numeroFactura = `VENTA-${Date.now()}-${i + 1}`;
                    const cantidad = 1;
                    const subtotal = producto.precio * cantidad;
                    const igic = subtotal * 0.07; // 7% IGIC
                    const total = subtotal + igic;
                    
                    // Crear factura
                    db.run(`
                        INSERT INTO facturas (
                            numero_factura, fecha_emision, fecha_vencimiento,
                            cliente_id, empresa_id, subtotal, igic, total,
                            estado, metodo_pago, observaciones
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        'transferencia',
                        `Venta de ${producto.modelo}`
                    ], function(err) {
                        if (err) {
                            console.error(`❌ Error creando factura ${numeroFactura}:`, err.message);
                        } else {
                            const facturaId = this.lastID;
                            console.log(`✅ Factura creada: ${numeroFactura} - €${total.toFixed(2)}`);
                            
                            // Crear detalle de factura
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
                                    console.error(`❌ Error creando detalle para factura ${facturaId}:`, err.message);
                                } else {
                                    console.log(`✅ Detalle creado: ${producto.codigo} - €${producto.precio}`);
                                }
                                
                                facturasCreadas++;
                                if (facturasCreadas === totalFacturas) {
                                    console.log(`\n🎉 Se crearon ${facturasCreadas} facturas con productos de coches`);
                                    verificarResultado();
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

// Función para verificar el resultado
function verificarResultado() {
    console.log('\n📋 PASO 4: Verificando resultado...');
    
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
        
        console.log('\n🚗 ESTADO DE LOS COCHES:');
        console.log('========================');
        
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
        
        console.log(`\n📊 RESUMEN:`);
        console.log(`   Vendidos: ${vendidos}`);
        console.log(`   Disponibles: ${disponibles}`);
        console.log(`   Total: ${coches.length}`);
        
        if (vendidos > 0) {
            console.log('\n🎉 ¡ÉXITO! Ahora tienes coches vendidos en el sistema');
            console.log('📱 Refresca la aplicación para ver los cambios');
        } else {
            console.log('\n❌ No se pudieron crear las ventas');
        }
        
        db.close();
    });
}

// Ejecutar el proceso
asociarCochesProductos();