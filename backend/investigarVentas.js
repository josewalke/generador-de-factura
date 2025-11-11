const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

async function investigarVentas() {
    try {
        console.log('🔍 Investigando por qué no se muestran las ventas...');
        
        // 1. Verificar si hay productos asociados a coches
        console.log('\n1️⃣ PRODUCTOS ASOCIADOS A COCHES:');
        const productosCoches = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.id, p.codigo, p.descripcion, c.matricula, c.modelo
                FROM productos p
                LEFT JOIN coches c ON p.codigo = c.matricula
                WHERE c.matricula IS NOT NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Total productos asociados a coches: ${productosCoches.length}`);
        productosCoches.forEach(p => {
            console.log(`   Producto ID: ${p.id} - Código: ${p.codigo} - Coche: ${p.matricula} (${p.modelo})`);
        });
        
        // 2. Verificar detalles de factura con productos
        console.log('\n2️⃣ DETALLES DE FACTURA CON PRODUCTOS:');
        const detallesConProductos = await new Promise((resolve, reject) => {
            db.all(`
                SELECT df.id, df.producto_id, df.factura_id, p.codigo, f.numero_factura
                FROM detalles_factura df
                LEFT JOIN productos p ON df.producto_id = p.id
                LEFT JOIN facturas f ON df.factura_id = f.id
                WHERE p.id IS NOT NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Total detalles con productos: ${detallesConProductos.length}`);
        detallesConProductos.forEach(d => {
            console.log(`   Detalle ID: ${d.id} - Producto: ${d.codigo} - Factura: ${d.numero_factura}`);
        });
        
        // 3. Verificar la cadena completa: coche -> producto -> detalle -> factura
        console.log('\n3️⃣ CADENA COMPLETA DE VENTA:');
        const cadenaCompleta = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo, p.codigo as producto_codigo, 
                       df.id as detalle_id, f.numero_factura, f.estado, f.total
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                LEFT JOIN facturas f ON df.factura_id = f.id
                WHERE c.activo = 1 AND f.id IS NOT NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Total coches con ventas completas: ${cadenaCompleta.length}`);
        cadenaCompleta.forEach(c => {
            console.log(`   Coche: ${c.matricula} (${c.modelo})`);
            console.log(`   Producto: ${c.producto_codigo}`);
            console.log(`   Factura: ${c.numero_factura} (${c.estado}) - €${c.total}`);
        });
        
        // 4. Verificar si hay coches sin productos asociados
        console.log('\n4️⃣ COCHES SIN PRODUCTOS:');
        const cochesSinProductos = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                WHERE c.activo = 1 AND p.id IS NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Total coches sin productos: ${cochesSinProductos.length}`);
        cochesSinProductos.forEach(c => {
            console.log(`   ${c.matricula} (${c.modelo})`);
        });
        
        // 5. Verificar si hay productos sin coches asociados
        console.log('\n5️⃣ PRODUCTOS SIN COCHES:');
        const productosSinCoches = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.codigo, p.descripcion
                FROM productos p
                LEFT JOIN coches c ON p.codigo = c.matricula
                WHERE c.matricula IS NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`Total productos sin coches: ${productosSinCoches.length}`);
        productosSinCoches.forEach(p => {
            console.log(`   ${p.codigo} - ${p.descripcion}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

investigarVentas();


