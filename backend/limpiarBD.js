const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🔍 Verificando y limpiando base de datos...');

// Verificar facturas
db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
        return;
    }
    
    console.log(`📊 Facturas encontradas: ${row.total}`);
    
    if (row.total > 0) {
        console.log('🗑️ Borrando todas las facturas...');
        
        // Borrar detalles de factura
        db.run("DELETE FROM detalles_factura", function(err) {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log(`✅ ${this.changes} detalles eliminados`);
            }
        });
        
        // Borrar facturas
        db.run("DELETE FROM facturas", function(err) {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log(`✅ ${this.changes} facturas eliminadas`);
                
                // Verificar resultado
                db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
                    if (err) {
                        console.error('Error:', err.message);
                    } else {
                        console.log(`📊 Facturas restantes: ${row.total}`);
                        console.log('✅ ¡Base de datos limpia!');
                    }
                    db.close();
                });
            }
        });
    } else {
        console.log('✅ No hay facturas para borrar');
        db.close();
    }
});


