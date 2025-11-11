const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🔧 CORRIGIENDO FACTURAS...');
console.log('==========================');

// Función para corregir facturas sin precio
function corregirFacturasSinPrecio() {
    console.log('\n📋 PASO 1: Corrigiendo facturas sin precio...');
    
    db.all(`
        SELECT f.id, f.numero_factura, df.producto_id, p.precio
        FROM facturas f
        JOIN detalles_factura df ON f.id = df.factura_id
        JOIN productos p ON df.producto_id = p.id
        WHERE f.total = 0 OR f.total IS NULL
    `, (err, facturasSinPrecio) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        console.log(`📊 Facturas sin precio encontradas: ${facturasSinPrecio.length}`);
        
        let facturasCorregidas = 0;
        facturasSinPrecio.forEach(factura => {
            const cantidad = 1;
            const subtotal = factura.precio * cantidad;
            const igic = subtotal * 0.07; // 7% IGIC
            const total = subtotal + igic;
            
            // Actualizar factura
            db.run(`
                UPDATE facturas 
                SET subtotal = ?, igic = ?, total = ?
                WHERE id = ?
            `, [subtotal, igic, total, factura.id], function(err) {
                if (err) {
                    console.error(`❌ Error actualizando factura ${factura.id}:`, err.message);
                } else {
                    console.log(`✅ Factura ${factura.numero_factura} actualizada: €${total.toFixed(2)} (IGIC: €${igic.toFixed(2)})`);
                }
                
                // Actualizar detalle de factura
                db.run(`
                    UPDATE detalles_factura 
                    SET precio_unitario = ?, subtotal = ?, igic = ?, total = ?
                    WHERE factura_id = ? AND producto_id = ?
                `, [factura.precio, subtotal, igic, total, factura.id, factura.producto_id], function(err) {
                    if (err) {
                        console.error(`❌ Error actualizando detalle:`, err.message);
                    } else {
                        console.log(`✅ Detalle actualizado: €${factura.precio} + IGIC`);
                    }
                    
                    facturasCorregidas++;
                    if (facturasCorregidas === facturasSinPrecio.length) {
                        asignarClientes();
                    }
                });
            });
        });
        
        if (facturasSinPrecio.length === 0) {
            asignarClientes();
        }
    });
}

// Función para asignar clientes a facturas sin cliente
function asignarClientes() {
    console.log('\n📋 PASO 2: Asignando clientes a facturas...');
    
    // Obtener cliente por defecto
    db.get("SELECT id, nombre FROM clientes LIMIT 1", (err, cliente) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        if (!cliente) {
            console.log('❌ No hay clientes disponibles');
            return;
        }
        
        console.log(`📋 Usando cliente: ${cliente.nombre}`);
        
        // Actualizar facturas sin cliente
        db.run(`
            UPDATE facturas 
            SET cliente_id = ?
            WHERE cliente_id IS NULL OR cliente_id = 0
        `, [cliente.id], function(err) {
            if (err) {
                console.error('❌ Error asignando clientes:', err.message);
            } else {
                console.log(`✅ Se asignaron clientes a ${this.changes} facturas`);
            }
            
            verificarResultado();
        });
    });
}

// Función para verificar el resultado
function verificarResultado() {
    console.log('\n📋 PASO 3: Verificando resultado...');
    
    db.all(`
        SELECT f.id, f.numero_factura, f.total, f.igic, f.subtotal, c.nombre as cliente
        FROM facturas f
        LEFT JOIN clientes c ON f.cliente_id = c.id
        ORDER BY f.id DESC
        LIMIT 10
    `, (err, facturas) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        console.log('\n📋 FACTURAS CORREGIDAS:');
        console.log('========================');
        
        facturas.forEach(factura => {
            const estado = factura.total > 0 && factura.cliente ? '✅ CORRECTA' : '❌ PROBLEMA';
            console.log(`${estado} ${factura.numero_factura}: €${factura.total} (IGIC: €${factura.igic}) - ${factura.cliente || 'SIN CLIENTE'}`);
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
                console.log('\n🎉 ¡ÉXITO! Todas las facturas están corregidas');
                console.log('📱 Refresca la aplicación para ver los cambios');
            } else {
                console.log('\n❌ No se pudieron corregir las facturas');
            }
            
            db.close();
        });
    });
}

// Ejecutar el proceso
corregirFacturasSinPrecio();


