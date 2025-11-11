const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

async function borrarHistorialFacturas() {
    try {
        console.log('🗑️ Borrando historial de facturas...');
        
        // 1. Verificar qué hay antes de borrar
        console.log('\n📊 ESTADO ACTUAL:');
        
        const facturasAntes = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM facturas", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        const detallesAntes = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM detalles_factura", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        console.log(`   Facturas: ${facturasAntes}`);
        console.log(`   Detalles de factura: ${detallesAntes}`);
        
        if (facturasAntes === 0) {
            console.log('\n✅ No hay facturas para borrar');
            return;
        }
        
        // 2. Borrar detalles de factura primero (por las foreign keys)
        console.log('\n🗑️ Borrando detalles de factura...');
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM detalles_factura", [], function(err) {
                if (err) reject(err);
                else {
                    console.log(`   ✅ ${this.changes} detalles eliminados`);
                    resolve();
                }
            });
        });
        
        // 3. Borrar facturas
        console.log('\n🗑️ Borrando facturas...');
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM facturas", [], function(err) {
                if (err) reject(err);
                else {
                    console.log(`   ✅ ${this.changes} facturas eliminadas`);
                    resolve();
                }
            });
        });
        
        // 4. Verificar resultado
        console.log('\n📊 ESTADO DESPUÉS:');
        
        const facturasDespues = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM facturas", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        const detallesDespues = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM detalles_factura", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        console.log(`   Facturas: ${facturasDespues}`);
        console.log(`   Detalles de factura: ${detallesDespues}`);
        
        // 5. Verificar coches (deben estar todos disponibles ahora)
        console.log('\n🚗 ESTADO DE COCHES:');
        
        const cochesDisponibles = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.matricula, c.modelo
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                WHERE c.activo = 1 AND df.id IS NULL
                LIMIT 5
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const totalCoches = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM coches WHERE activo = 1", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        console.log(`   Total coches: ${totalCoches}`);
        console.log(`   Coches disponibles: ${cochesDisponibles.length}`);
        
        if (cochesDisponibles.length > 0) {
            console.log('\n   Primeros coches disponibles:');
            cochesDisponibles.forEach(coche => {
                console.log(`     ${coche.matricula} (${coche.modelo})`);
            });
        }
        
        console.log('\n✅ ¡HISTORIAL BORRADO COMPLETAMENTE!');
        console.log('🎯 Todos los coches están ahora disponibles para venta');
        console.log('📊 El Excel mostrará todos los coches como "No vendidos"');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

borrarHistorialFacturas();


