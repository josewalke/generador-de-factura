const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/telwagen.db');

db.all(`
    SELECT c.matricula, c.modelo, f.numero_factura, f.estado
    FROM coches c
    LEFT JOIN productos p ON c.matricula = p.codigo
    LEFT JOIN detalles_factura df ON p.id = df.producto_id
    LEFT JOIN facturas f ON df.factura_id = f.id
    WHERE c.activo = 1 AND f.id IS NOT NULL
    LIMIT 5
`, [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Coches vendidos:', rows.length);
        rows.forEach(row => {
            console.log(`${row.matricula} - ${row.modelo} - Factura: ${row.numero_factura} (${row.estado})`);
        });
    }
    db.close();
});


