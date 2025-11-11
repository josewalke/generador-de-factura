const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🗑️ Limpiando completamente la base de datos...');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/telwagen.db');

// Función para limpiar completamente
async function limpiarCompletamente() {
    try {
        console.log('🔍 Verificando estado actual...');
        
        // Verificar facturas
        const facturas = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM facturas", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        console.log(`📊 Facturas encontradas: ${facturas}`);
        
        if (facturas > 0) {
            console.log('🗑️ Borrando todas las facturas...');
            
            // Borrar detalles de factura
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM detalles_factura", [], function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ ${this.changes} detalles eliminados`);
                        resolve();
                    }
                });
            });
            
            // Borrar facturas
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM facturas", [], function(err) {
                    if (err) reject(err);
                    else {
                        console.log(`✅ ${this.changes} facturas eliminadas`);
                        resolve();
                    }
                });
            });
        }
        
        // Verificar resultado final
        const facturasFinal = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as total FROM facturas", [], (err, row) => {
                if (err) reject(err);
                else resolve(row.total);
            });
        });
        
        console.log(`📊 Facturas restantes: ${facturasFinal}`);
        
        if (facturasFinal === 0) {
            console.log('✅ ¡BASE DE DATOS COMPLETAMENTE LIMPIA!');
            console.log('🎯 Todas las facturas han sido eliminadas');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

limpiarCompletamente();


