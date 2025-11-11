const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

console.log('🔍 Verificando estado actual de la base de datos...');

// Verificar facturas
db.get("SELECT COUNT(*) as total FROM facturas", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`📊 Facturas en base de datos: ${row.total}`);
    }
});

// Verificar detalles
db.get("SELECT COUNT(*) as total FROM detalles_factura", (err, row) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`📊 Detalles en base de datos: ${row.total}`);
    }
});

// Si hay facturas, mostrarlas
db.all("SELECT numero_factura, fecha_emision, total FROM facturas LIMIT 5", (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        if (rows.length > 0) {
            console.log('\n📋 FACTURAS ENCONTRADAS:');
            rows.forEach(factura => {
                console.log(`   ${factura.numero_factura} - ${factura.fecha_emision} - €${factura.total}`);
            });
            console.log('\n⚠️  Hay facturas en la base de datos');
        } else {
            console.log('\n✅ No hay facturas en la base de datos');
        }
    }
    db.close();
});