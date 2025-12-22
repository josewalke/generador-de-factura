// Script para ordenar y relacionar correctamente todos los datos en la base de datos
const { Pool } = require('pg');
const config = require('./config/config');

const pool = new Pool({
    host: config.get('database.host') || 'localhost',
    port: config.get('database.port') || 5432,
    database: config.get('database.database') || 'telwagen',
    user: config.get('database.user') || 'postgres',
    password: config.get('database.password') || '',
});

async function main() {
    console.log('🔧 Ordenando y relacionando datos en la base de datos');
    console.log('='.repeat(70));

    try {
        // 1. Verificar todas las facturas y proformas
        console.log('\n📄 Analizando facturas y proformas...');
        
        const facturas = await pool.query(`
            SELECT f.id, f.numero_factura, f.cliente_id, f.empresa_id, f.fecha_emision, 
                   f.proforma_id, f.estado, f.notas
            FROM facturas f
            ORDER BY f.id
        `);

        const proformas = await pool.query(`
            SELECT p.id, p.numero_proforma, p.cliente_id, p.empresa_id, p.fecha_emision,
                   p.estado, p.notas
            FROM proformas p
            ORDER BY p.id
        `);

        console.log(`\n📊 Facturas encontradas: ${facturas.rows.length}`);
        console.log(`📊 Proformas encontradas: ${proformas.rows.length}`);

        // 2. Relacionar facturas con proformas basándose en:
        //    - Mismo cliente_id y empresa_id
        //    - Coches compartidos
        //    - Notas que mencionen la proforma
        console.log('\n🔗 Relacionando facturas con proformas...');
        console.log('-'.repeat(70));

        let relacionesCreadas = 0;
        let relacionesActualizadas = 0;

        for (const factura of facturas.rows) {
            // Buscar proforma relacionada
            let proformaRelacionada = null;

            // Método 1: Buscar por cliente_id, empresa_id y coches compartidos
            if (factura.cliente_id && factura.empresa_id) {
                // Obtener coches de la factura
                const cochesFactura = await pool.query(`
                    SELECT DISTINCT coche_id 
                    FROM detalles_factura 
                    WHERE factura_id = $1 AND coche_id IS NOT NULL
                `, [factura.id]);

                const cocheIds = cochesFactura.rows.map(r => r.coche_id);

                if (cocheIds.length > 0) {
                    // Buscar proforma con mismo cliente, empresa y coches
                    const proformaMatch = await pool.query(`
                        SELECT DISTINCT p.id, p.numero_proforma, p.estado, p.fecha_emision
                        FROM proformas p
                        INNER JOIN detalles_proforma dp ON dp.proforma_id = p.id
                        WHERE p.cliente_id = $1 
                          AND p.empresa_id = $2
                          AND dp.coche_id = ANY($3::integer[])
                        ORDER BY p.fecha_emision DESC
                        LIMIT 1
                    `, [factura.cliente_id, factura.empresa_id, cocheIds]);

                    if (proformaMatch.rows.length > 0) {
                        proformaRelacionada = proformaMatch.rows[0];
                    }
                }
            }

            // Método 2: Buscar por notas que mencionen el número de proforma
            if (!proformaRelacionada && factura.notas) {
                for (const proforma of proformas.rows) {
                    if (factura.notas.includes(proforma.numero_proforma)) {
                        proformaRelacionada = proforma;
                        break;
                    }
                }
            }

            // Método 3: Buscar por mismo cliente y empresa (más general)
            if (!proformaRelacionada && factura.cliente_id && factura.empresa_id) {
                const proformaMatch = await pool.query(`
                    SELECT id, numero_proforma, estado
                    FROM proformas
                    WHERE cliente_id = $1 
                      AND empresa_id = $2
                      AND estado != 'anulado'
                    ORDER BY fecha_emision DESC
                    LIMIT 1
                `, [factura.cliente_id, factura.empresa_id]);

                if (proformaMatch.rows.length > 0) {
                    proformaRelacionada = proformaMatch.rows[0];
                }
            }

            // Actualizar factura con proforma_id si se encontró relación
            if (proformaRelacionada) {
                if (factura.proforma_id !== proformaRelacionada.id) {
                    await pool.query(
                        'UPDATE facturas SET proforma_id = $1 WHERE id = $2',
                        [proformaRelacionada.id, factura.id]
                    );

                    if (factura.proforma_id) {
                        relacionesActualizadas++;
                        console.log(`   ✅ Actualizada: Factura ${factura.numero_factura} → Proforma ${proformaRelacionada.numero_proforma}`);
                    } else {
                        relacionesCreadas++;
                        console.log(`   ➕ Creada: Factura ${factura.numero_factura} → Proforma ${proformaRelacionada.numero_proforma}`);
                    }
                } else {
                    console.log(`   ✓ Ya relacionada: Factura ${factura.numero_factura} → Proforma ${proformaRelacionada.numero_proforma}`);
                }
            } else {
                console.log(`   ⚠️ Sin relación: Factura ${factura.numero_factura} (Cliente: ${factura.cliente_id}, Empresa: ${factura.empresa_id})`);
            }
        }

        // 3. Actualizar estados de proformas basándose en facturas relacionadas
        console.log('\n📋 Actualizando estados de proformas...');
        console.log('-'.repeat(70));

        for (const proforma of proformas.rows) {
            // Contar facturas relacionadas
            const facturasRelacionadas = await pool.query(`
                SELECT COUNT(*) as count, 
                       STRING_AGG(numero_factura, ', ') as facturas
                FROM facturas
                WHERE proforma_id = $1
            `, [proforma.id]);

            const count = parseInt(facturasRelacionadas.rows[0].count);

            if (count > 0 && proforma.estado !== 'facturada' && proforma.estado !== 'anulado') {
                // Actualizar notas de la proforma
                const facturasList = facturasRelacionadas.rows[0].facturas;
                const nuevaNota = `Proforma generada el ${proforma.fecha_emision} | Facturada en factura(s) ${facturasList}`;
                
                await pool.query(`
                    UPDATE proformas 
                    SET estado = 'facturada',
                        notas = COALESCE(notas || ' | ', '') || $1
                    WHERE id = $2
                `, [nuevaNota, proforma.id]);

                console.log(`   ✅ Proforma ${proforma.numero_proforma} marcada como facturada (${count} factura(s))`);
            }
        }

        // 4. Verificar y corregir inconsistencias en detalles
        console.log('\n🔍 Verificando detalles de facturas y proformas...');
        console.log('-'.repeat(70));

        // Verificar detalles de factura sin factura válida
        const detallesFacturaHuerfanos = await pool.query(`
            SELECT df.id, df.factura_id
            FROM detalles_factura df
            LEFT JOIN facturas f ON df.factura_id = f.id
            WHERE f.id IS NULL
        `);

        if (detallesFacturaHuerfanos.rows.length > 0) {
            console.log(`   ⚠️ Encontrados ${detallesFacturaHuerfanos.rows.length} detalles de factura huérfanos`);
            // Opcional: eliminar detalles huérfanos
            // await pool.query('DELETE FROM detalles_factura WHERE id = ANY($1::integer[])', [detallesFacturaHuerfanos.rows.map(r => r.id)]);
        } else {
            console.log('   ✅ Todos los detalles de factura tienen factura válida');
        }

        // Verificar detalles de proforma sin proforma válida
        const detallesProformaHuerfanos = await pool.query(`
            SELECT dp.id, dp.proforma_id
            FROM detalles_proforma dp
            LEFT JOIN proformas p ON dp.proforma_id = p.id
            WHERE p.id IS NULL
        `);

        if (detallesProformaHuerfanos.rows.length > 0) {
            console.log(`   ⚠️ Encontrados ${detallesProformaHuerfanos.rows.length} detalles de proforma huérfanos`);
        } else {
            console.log('   ✅ Todos los detalles de proforma tienen proforma válida');
        }

        // 5. Verificar integridad referencial
        console.log('\n🔐 Verificando integridad referencial...');
        console.log('-'.repeat(70));

        // Facturas con empresa_id inválido
        const facturasEmpresaInvalida = await pool.query(`
            SELECT f.id, f.numero_factura, f.empresa_id
            FROM facturas f
            LEFT JOIN empresas e ON f.empresa_id = e.id
            WHERE e.id IS NULL
        `);

        if (facturasEmpresaInvalida.rows.length > 0) {
            console.log(`   ⚠️ Facturas con empresa_id inválido: ${facturasEmpresaInvalida.rows.length}`);
            facturasEmpresaInvalida.rows.forEach(f => {
                console.log(`      - Factura ${f.numero_factura} (ID: ${f.id}) tiene empresa_id ${f.empresa_id} inválido`);
            });
        } else {
            console.log('   ✅ Todas las facturas tienen empresa_id válido');
        }

        // Facturas con cliente_id inválido (puede ser NULL, pero si existe debe ser válido)
        const facturasClienteInvalido = await pool.query(`
            SELECT f.id, f.numero_factura, f.cliente_id
            FROM facturas f
            WHERE f.cliente_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM clientes c WHERE c.id = f.cliente_id)
        `);

        if (facturasClienteInvalido.rows.length > 0) {
            console.log(`   ⚠️ Facturas con cliente_id inválido: ${facturasClienteInvalido.rows.length}`);
        } else {
            console.log('   ✅ Todas las facturas tienen cliente_id válido o NULL');
        }

        // Proformas con empresa_id inválido
        const proformasEmpresaInvalida = await pool.query(`
            SELECT p.id, p.numero_proforma, p.empresa_id
            FROM proformas p
            LEFT JOIN empresas e ON p.empresa_id = e.id
            WHERE e.id IS NULL
        `);

        if (proformasEmpresaInvalida.rows.length > 0) {
            console.log(`   ⚠️ Proformas con empresa_id inválido: ${proformasEmpresaInvalida.rows.length}`);
        } else {
            console.log('   ✅ Todas las proformas tienen empresa_id válido');
        }

        // 6. Resumen final
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMEN FINAL:');
        console.log('='.repeat(70));
        console.log(`   ➕ Relaciones creadas: ${relacionesCreadas}`);
        console.log(`   ✅ Relaciones actualizadas: ${relacionesActualizadas}`);
        console.log(`   📄 Total facturas: ${facturas.rows.length}`);
        console.log(`   📋 Total proformas: ${proformas.rows.length}`);

        // Contar facturas relacionadas
        const facturasRelacionadas = await pool.query(`
            SELECT COUNT(*) as count 
            FROM facturas 
            WHERE proforma_id IS NOT NULL
        `);
        console.log(`   🔗 Facturas relacionadas con proformas: ${facturasRelacionadas.rows[0].count}`);

        console.log('\n✅ Proceso completado exitosamente');
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

main();

