const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function consultarBD(dbPath, nombre) {
    return new Promise((resolve) => {
        if (!fs.existsSync(dbPath)) {
            console.log(`\n❌ ${nombre}: No existe`);
            resolve({ nombre, existe: false });
            return;
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(`Error abriendo ${nombre}:`, err.message);
                resolve({ nombre, existe: false, error: err.message });
                return;
            }

            // Contar facturas
            db.get('SELECT COUNT(*) as count FROM facturas', (err, row) => {
                const facturas = err ? 0 : row.count;
                
                // Verificar si existe tabla proformas
                db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='proformas'", (err2, rows2) => {
                    if (err2) {
                        resolve({ nombre, existe: true, facturas, proformas: 'Error verificando' });
                        db.close();
                        return;
                    }
                    
                    if (rows2.length > 0) {
                        // Contar proformas
                        db.get('SELECT COUNT(*) as count FROM proformas', (err3, row3) => {
                            const proformas = err3 ? 0 : row3.count;
                            resolve({ nombre, existe: true, facturas, proformas });
                            db.close();
                        });
                    } else {
                        resolve({ nombre, existe: true, facturas, proformas: 'Tabla no existe' });
                        db.close();
                    }
                });
            });
        });
    });
}

async function main() {
    console.log('🔍 Verificando bases de datos...\n');
    
    const db1Path = path.join(__dirname, 'database', 'telwagen.db');
    const db2Path = path.join(__dirname, 'telwagen.db');
    
    const resultados = await Promise.all([
        consultarBD(db1Path, 'database/telwagen.db'),
        consultarBD(db2Path, 'telwagen.db (raíz)')
    ]);
    
    console.log('\n📊 RESULTADOS:');
    console.log('='.repeat(50));
    resultados.forEach(r => {
        if (r.existe) {
            console.log(`\n📁 ${r.nombre}:`);
            console.log(`   📄 Facturas: ${r.facturas}`);
            console.log(`   📋 Proformas: ${r.proformas}`);
        }
    });
    console.log('\n' + '='.repeat(50));
}

main().catch(console.error);

