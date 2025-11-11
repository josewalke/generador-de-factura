const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

// Borrar todo el historial de facturas
db.serialize(() => {
    console.log('🗑️ Borrando historial de facturas...');
    
    // 1. Borrar detalles de factura
    db.run("DELETE FROM detalles_factura", function(err) {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`✅ ${this.changes} detalles eliminados`);
        }
    });
    
    // 2. Borrar facturas
    db.run("DELETE FROM facturas", function(err) {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`✅ ${this.changes} facturas eliminadas`);
        }
    });
    
    // 3. Verificar
    db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`📊 Facturas restantes: ${row.total}`);
        }
    });
    
    db.get("SELECT COUNT(*) as total FROM detalles_factura", (err, row) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`📊 Detalles restantes: ${row.total}`);
            console.log('\n✅ ¡HISTORIAL BORRADO!');
            console.log('🎯 Todos los coches están disponibles');
            db.close();
        }
    });
});


