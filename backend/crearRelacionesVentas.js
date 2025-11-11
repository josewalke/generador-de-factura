const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

async function crearRelacionesVentas() {
    try {
        console.log('🔗 Creando relaciones entre facturas y coches vendidos...');
        
        // 1. Obtener facturas existentes
        const facturas = await new Promise((resolve, reject) => {
            db.all(`
                SELECT f.id, f.numero_factura, f.estado, f.total, f.fecha_emision, c.nombre as cliente_nombre
                FROM facturas f
                LEFT JOIN clientes c ON f.cliente_id = c.id
                ORDER BY f.fecha_emision DESC
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📋 Facturas disponibles: ${facturas.length}`);
        facturas.forEach((f, index) => {
            console.log(`   ${index + 1}. ${f.numero_factura} (${f.estado}) - €${f.total} - ${f.cliente_nombre || 'Sin cliente'}`);
        });
        
        // 2. Obtener coches con productos
        const cochesConProductos = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo, c.color, c.kms, p.id as producto_id, p.precio
                FROM coches c
                JOIN productos p ON c.matricula = p.codigo
                WHERE c.activo = 1
                ORDER BY c.fecha_creacion DESC
                LIMIT 10
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n🚗 Coches disponibles: ${cochesConProductos.length}`);
        cochesConProductos.forEach((c, index) => {
            console.log(`   ${index + 1}. ${c.matricula} (${c.modelo}) - ${c.color} - ${c.kms}km`);
        });
        
        // 3. Crear relaciones de venta
        console.log('\n💰 CREANDO VENTAS...');
        console.log('====================');
        
        let ventasCreadas = 0;
        const preciosVenta = [15000, 18000, 22000, 25000, 30000]; // Precios de ejemplo
        
        for (let i = 0; i < Math.min(facturas.length, cochesConProductos.length, 3); i++) {
            const factura = facturas[i];
            const coche = cochesConProductos[i];
            const precioVenta = preciosVenta[i % preciosVenta.length];
            
            try {
                // Calcular impuestos
                const cantidad = 1;
                const subtotal = precioVenta * cantidad;
                const igic = subtotal * 0.07; // 7% IGIC
                const total = subtotal + igic;
                
                // Crear detalle de factura
                await new Promise((resolve, reject) => {
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
                        `${coche.modelo} - ${coche.color} (${coche.kms}km)`,
                        'igic'
                    ], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });
                
                // Actualizar total de la factura
                const nuevoTotal = factura.total + total;
                await new Promise((resolve, reject) => {
                    db.run(`
                        UPDATE facturas 
                        SET total = ?, subtotal = subtotal + ?, igic = igic + ?
                        WHERE id = ?
                    `, [nuevoTotal, subtotal, igic, factura.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                ventasCreadas++;
                console.log(`✅ Venta ${ventasCreadas}: ${coche.matricula} vendido en ${factura.numero_factura}`);
                console.log(`   Precio: €${precioVenta} - Total factura: €${nuevoTotal.toFixed(2)}`);
                
            } catch (error) {
                console.log(`❌ Error vendiendo ${coche.matricula}: ${error.message}`);
            }
        }
        
        // 4. Verificar resultado
        console.log('\n🔍 VERIFICANDO RESULTADO...');
        console.log('===========================');
        
        const ventasVerificadas = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo, f.numero_factura, f.estado, f.total, f.fecha_emision,
                       cl.nombre as cliente_nombre, df.total as precio_venta
                FROM coches c
                JOIN productos p ON c.matricula = p.codigo
                JOIN detalles_factura df ON p.id = df.producto_id
                JOIN facturas f ON df.factura_id = f.id
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE c.activo = 1
                ORDER BY f.fecha_emision DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📊 Total coches vendidos: ${ventasVerificadas.length}`);
        
        if (ventasVerificadas.length > 0) {
            console.log('\n🚗 COCHES VENDIDOS:');
            ventasVerificadas.forEach((venta, index) => {
                console.log(`\n${index + 1}. ${venta.matricula} (${venta.modelo})`);
                console.log(`   📄 Factura: ${venta.numero_factura}`);
                console.log(`   📅 Fecha: ${venta.fecha_emision}`);
                console.log(`   💰 Precio: €${venta.precio_venta}`);
                console.log(`   👤 Cliente: ${venta.cliente_nombre || 'Sin cliente'}`);
                console.log(`   📋 Estado: ${venta.estado}`);
            });
        }
        
        console.log(`\n📈 RESUMEN:`);
        console.log(`   Ventas creadas: ${ventasCreadas}`);
        console.log(`   Coches vendidos: ${ventasVerificadas.length}`);
        console.log(`   ✅ ¡Ahora el Excel mostrará coches vendidos!`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

crearRelacionesVentas();


