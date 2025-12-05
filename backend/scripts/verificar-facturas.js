const path = require('path');
const config = require('../config/config');

const dbType = config.get('database.type') || 'postgresql';

async function verificarFacturas() {
    try {
        if (dbType === 'postgresql') {
            const { Pool } = require('pg');
            const pool = new Pool({
                host: config.get('database.host'),
                port: config.get('database.port'),
                database: config.get('database.database'),
                user: config.get('database.user'),
                password: config.get('database.password'),
            });
            
            console.log('✅ Conectado a PostgreSQL');
            
            // Buscar todas las facturas activas
            const result = await pool.query(`
                SELECT id, numero_factura, fecha_emision, estado, total, 
                       EXTRACT(YEAR FROM fecha_emision)::INT as año, 
                       EXTRACT(MONTH FROM fecha_emision)::INT as mes
                FROM facturas 
                WHERE (activo = true OR activo IS NULL)
                ORDER BY fecha_emision DESC
            `);
            
            console.log(`\n📋 Facturas encontradas: ${result.rows.length}`);
            if (result.rows.length > 0) {
                result.rows.forEach(f => {
                    console.log(`  ID: ${f.id}, Numero: ${f.numero_factura}, Fecha: ${f.fecha_emision}, Año: ${f.año}, Mes: ${f.mes}, Estado: ${f.estado}, Total: €${f.total}`);
                });
                
                // Verificar el mes actual
                const ahora = new Date();
                const mesActual = ahora.getMonth() + 1; // getMonth() devuelve 0-11
                const añoActual = ahora.getFullYear();
                console.log(`\n📅 Filtro actual: Mes ${mesActual} (${ahora.toLocaleString('es-ES', { month: 'long' })}), Año ${añoActual}`);
                
                // Verificar cuántas facturas coinciden con el filtro
                const facturasFiltradas = result.rows.filter(f => f.año === añoActual && f.mes === mesActual);
                console.log(`\n🔍 Facturas que coinciden con el filtro actual: ${facturasFiltradas.length}`);
                if (facturasFiltradas.length === 0 && result.rows.length > 0) {
                    console.log('⚠️  Las facturas están en otro mes/año. Cambia el filtro para verlas.');
                }
            } else {
                console.log('⚠️  No hay facturas en la base de datos');
            }
            
            await pool.end();
        }
        
        console.log('\n✅ Verificación completada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verificarFacturas();

