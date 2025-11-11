const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

async function verificarEstadoVentas() {
    try {
        console.log('🔍 Verificando estado actual de ventas...');
        
        // 1. Verificar facturas existentes
        const facturas = await new Promise((resolve, reject) => {
            db.all(`
                SELECT f.id, f.numero_factura, f.fecha_emision, f.total, f.estado
                FROM facturas f
                ORDER BY f.fecha_emision DESC
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n📋 FACTURAS EXISTENTES: ${facturas.length}`);
        facturas.forEach(f => {
            console.log(`   ${f.numero_factura} - ${f.fecha_emision} - €${f.total} (${f.estado})`);
        });
        
        // 2. Verificar detalles de factura
        const detalles = await new Promise((resolve, reject) => {
            db.all(`
                SELECT df.id, df.factura_id, df.producto_id, df.total, p.codigo, f.numero_factura
                FROM detalles_factura df
                LEFT JOIN productos p ON df.producto_id = p.id
                LEFT JOIN facturas f ON df.factura_id = f.id
                ORDER BY df.id DESC
                LIMIT 10
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n📄 DETALLES DE FACTURA: ${detalles.length}`);
        detalles.forEach(d => {
            console.log(`   Factura: ${d.numero_factura} - Producto: ${d.codigo} - €${d.total}`);
        });
        
        // 3. Verificar coches vendidos
        const cochesVendidos = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo, f.numero_factura, f.fecha_emision, df.total as precio_venta
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                LEFT JOIN facturas f ON df.factura_id = f.id
                WHERE c.activo = 1 AND f.id IS NOT NULL
                ORDER BY f.fecha_emision DESC
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n🚗 COCHES VENDIDOS: ${cochesVendidos.length}`);
        if (cochesVendidos.length > 0) {
            cochesVendidos.forEach(c => {
                console.log(`   ${c.matricula} (${c.modelo}) - Factura: ${c.numero_factura} - €${c.precio_venta}`);
            });
        } else {
            console.log('   ⚠️  No hay coches vendidos');
        }
        
        // 4. Verificar productos de coches
        const productosCoches = await new Promise((resolve, reject) => {
            db.all(`
                SELECT p.id, p.codigo, c.matricula, c.modelo
                FROM productos p
                LEFT JOIN coches c ON p.codigo = c.matricula
                WHERE c.matricula IS NOT NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n🔗 PRODUCTOS DE COCHES: ${productosCoches.length}`);
        productosCoches.forEach(p => {
            console.log(`   Producto ID: ${p.id} - Código: ${p.codigo} - Coche: ${p.matricula} (${p.modelo})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

verificarEstadoVentas();


