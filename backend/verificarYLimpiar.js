const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🔍 Verificando estado real de la base de datos...');

// Verificar facturas
db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`📊 Facturas en BD: ${row.total}`);
        
        if (row.total > 0) {
            console.log('⚠️  HAY FACTURAS EN LA BASE DE DATOS');
            
            // Mostrar las facturas
            db.all("SELECT numero_factura, fecha_emision, total FROM facturas", (err, rows) => {
                if (err) {
                    console.error('Error:', err.message);
                } else {
                    console.log('\n📋 FACTURAS ENCONTRADAS:');
                    rows.forEach(factura => {
                        console.log(`   ${factura.numero_factura} - ${factura.fecha_emision} - €${factura.total}`);
                    });
                    
                    console.log('\n🗑️ BORRANDO TODAS LAS FACTURAS...');
                    
                    // Borrar detalles primero
                    db.run("DELETE FROM detalles_factura", function(err) {
                        if (err) {
                            console.error('Error borrando detalles:', err.message);
                        } else {
                            console.log(`✅ ${this.changes} detalles eliminados`);
                        }
                    });
                    
                    // Borrar facturas
                    db.run("DELETE FROM facturas", function(err) {
                        if (err) {
                            console.error('Error borrando facturas:', err.message);
                        } else {
                            console.log(`✅ ${this.changes} facturas eliminadas`);
                            
                            // Verificar resultado final
                            db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
                                if (err) {
                                    console.error('Error:', err.message);
                                } else {
                                    console.log(`\n📊 Facturas restantes: ${row.total}`);
                                    if (row.total === 0) {
                                        console.log('✅ ¡BASE DE DATOS COMPLETAMENTE LIMPIA!');
                                    }
                                }
                                db.close();
                            });
                        }
                    });
                }
            });
        } else {
            console.log('✅ No hay facturas en la base de datos');
            db.close();
        }
    }
});


