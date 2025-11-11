const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🔍 Verificando estado de la base de datos...');

// Verificar facturas
db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`📊 Facturas: ${row.total}`);
    }
});

// Verificar detalles
db.get("SELECT COUNT(*) as total FROM detalles_factura", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`📊 Detalles: ${row.total}`);
    }
});

// Verificar coches
db.get("SELECT COUNT(*) as total FROM coches WHERE activo = 1", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`📊 Coches activos: ${row.total}`);
    }
    db.close();
});


