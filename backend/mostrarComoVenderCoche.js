const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

async function mostrarComoVenderCoche() {
    try {
        console.log('📋 CÓMO VENDER UN COCHE - GUÍA PASO A PASO');
        console.log('==========================================');
        
        // 1. Mostrar facturas disponibles
        console.log('\n1️⃣ FACTURAS DISPONIBLES:');
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
        
        facturas.forEach((f, index) => {
            console.log(`   ${index + 1}. ${f.numero_factura} (${f.estado}) - €${f.total} - ${f.cliente_nombre || 'Sin cliente'}`);
        });
        
        // 2. Mostrar coches disponibles
        console.log('\n2️⃣ COCHES DISPONIBLES:');
        const coches = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo, c.color, c.kms, p.id as producto_id, p.precio
                FROM coches c
                JOIN productos p ON c.matricula = p.codigo
                WHERE c.activo = 1
                ORDER BY c.fecha_creacion DESC
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        coches.forEach((c, index) => {
            console.log(`   ${index + 1}. ${c.matricula} (${c.modelo}) - ${c.color} - ${c.kms}km - Producto ID: ${c.producto_id}`);
        });
        
        // 3. Ejemplo de cómo vender un coche
        if (facturas.length > 0 && coches.length > 0) {
            console.log('\n3️⃣ EJEMPLO: VENDER UN COCHE');
            console.log('============================');
            
            const facturaEjemplo = facturas[0];
            const cocheEjemplo = coches[0];
            
            console.log(`Vamos a vender: ${cocheEjemplo.matricula} (${cocheEjemplo.modelo})`);
            console.log(`En la factura: ${facturaEjemplo.numero_factura}`);
            
            // Crear detalle de factura
            const precioVenta = 15000; // Precio de ejemplo
            const cantidad = 1;
            const subtotal = precioVenta * cantidad;
            const igic = subtotal * 0.07; // 7% IGIC
            const total = subtotal + igic;
            
            console.log(`\n📊 DETALLES DE LA VENTA:`);
            console.log(`   Precio: €${precioVenta}`);
            console.log(`   Cantidad: ${cantidad}`);
            console.log(`   Subtotal: €${subtotal}`);
            console.log(`   IGIC (7%): €${igic.toFixed(2)}`);
            console.log(`   Total: €${total.toFixed(2)}`);
            
            // Insertar detalle de factura
            try {
                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO detalles_factura (
                            factura_id, producto_id, cantidad, precio_unitario, 
                            subtotal, igic, total, descripcion, tipo_impuesto
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        facturaEjemplo.id,
                        cocheEjemplo.producto_id,
                        cantidad,
                        precioVenta,
                        subtotal,
                        igic,
                        total,
                        `${cocheEjemplo.modelo} - ${cocheEjemplo.color}`,
                        'igic'
                    ], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });
                
                console.log(`\n✅ ¡COCHE VENDIDO!`);
                console.log(`   Detalle de factura creado exitosamente`);
                console.log(`   ${cocheEjemplo.matricula} ahora aparece como vendido`);
                
            } catch (error) {
                console.log(`\n❌ Error: ${error.message}`);
            }
        }
        
        console.log('\n📝 INSTRUCCIONES:');
        console.log('==================');
        console.log('Para vender un coche:');
        console.log('1. Ve a la sección de Facturas');
        console.log('2. Crea una nueva factura o edita una existente');
        console.log('3. Añade el producto del coche (código = matrícula)');
        console.log('4. Establece el precio de venta');
        console.log('5. Guarda la factura');
        console.log('6. El coche aparecerá como vendido en la lista');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

mostrarComoVenderCoche();


