const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🗑️ Borrando historial de facturas...');

db.serialize(() => {
    // Borrar detalles de factura primero
    db.run("DELETE FROM detalles_factura", function(err) {
        if (err) {
            console.error('Error borrando detalles:', err);
        } else {
            console.log(`✅ ${this.changes} detalles de factura eliminados`);
        }
    });
    
    // Borrar facturas
    db.run("DELETE FROM facturas", function(err) {
        if (err) {
            console.error('Error borrando facturas:', err);
        } else {
            console.log(`✅ ${this.changes} facturas eliminadas`);
        }
    });
    
    // Verificar resultado
    db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log(`📊 Facturas restantes: ${row.total}`);
        }
    });
    
    db.get("SELECT COUNT(*) as total FROM detalles_factura", (err, row) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log(`📊 Detalles restantes: ${row.total}`);
        }
        console.log('\n✅ ¡HISTORIAL BORRADO COMPLETAMENTE!');
        console.log('🎯 Todos los coches están ahora disponibles');
        db.close();
    });
});


