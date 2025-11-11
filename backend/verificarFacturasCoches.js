const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

// Verificar si hay facturas que incluyan productos de coches
db.all(`
    SELECT f.numero_factura, f.estado, f.total, p.codigo, c.matricula, c.modelo
    FROM facturas f
    JOIN detalles_factura df ON f.id = df.factura_id
    JOIN productos p ON df.producto_id = p.id
    JOIN coches c ON p.codigo = c.matricula
    LIMIT 5
`, [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Facturas con coches vendidos:', rows.length);
        rows.forEach(row => {
            console.log(`${row.numero_factura} (${row.estado}) - ${row.matricula} (${row.modelo}) - €${row.total}`);
        });
    }
    db.close();
});


