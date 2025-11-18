#!/usr/bin/env node
/**
 * Genera facturas para los coches marcados como vendidos que no tienen factura asociada.
 * Úsalo para cuadrar el histórico sin tener que recrear todo el dataset.
 *
 * Ejecutar desde la raíz del proyecto:
 *   node backend/scripts/facturas-coches-sin-factura.js
 */

const SistemaIntegridad = require('../modules/sistemaIntegridad');
const database = require('../modules/database');
const config = require('../config/config');

const integridad = new SistemaIntegridad();

async function main() {
  try {
    await database.connect();

    const empresa = await getSingleRow('SELECT * FROM empresas ORDER BY id LIMIT 1');
    if (!empresa) {
      throw new Error('No existe ninguna empresa en la base de datos');
    }

    const clientes = await getRows('SELECT id FROM clientes ORDER BY id');
    if (clientes.length === 0) {
      throw new Error('No hay clientes disponibles para asignar a las facturas');
    }

    const cochesSinFactura = await getRows(`
      SELECT c.*
      FROM coches c
      LEFT JOIN productos p ON p.codigo = c.matricula
      LEFT JOIN detalles_factura df ON df.producto_id = p.id
      LEFT JOIN facturas f ON df.factura_id = f.id
      WHERE (c.activo = false OR c.activo IS NULL)
        AND (f.id IS NULL)
      ORDER BY c.id
    `);

    if (cochesSinFactura.length === 0) {
      console.log('✅ No hay coches vendidos sin factura.');
      return;
    }

    console.log(`🚗 Coches vendidos sin factura: ${cochesSinFactura.length}`);

    const next = await obtenerSiguienteNumero(empresa.id);
    let correlativo = next;

    for (let i = 0; i < cochesSinFactura.length; i++) {
      const coche = cochesSinFactura[i];
      const cliente = clientes[i % clientes.length];
      const numeroFactura = formatNumeroFactura(correlativo++, coche.fecha_creacion);
      const fechaEmision = coche.fecha_creacion ? new Date(coche.fecha_creacion) : new Date();
      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

      const subtotal = randomBetween(18000, 38000);
      const igic = round2(subtotal * 0.095);
      const total = round2(subtotal + igic);

      const descripcion = `${coche.modelo || 'Vehículo'} - ${coche.matricula} - ${coche.color || ''}`.trim();

      const hashData = {
        numero_factura: numeroFactura,
        empresa_id: empresa.id,
        cliente_id: cliente.id,
        fecha_emision: fechaEmision.toISOString().split('T')[0],
        subtotal,
        igic,
        total,
        productos: [{
          descripcion,
          cantidad: 1,
          precio_unitario: subtotal,
          subtotal,
          igic,
          total
        }]
      };

      const hashDocumento = integridad.generarHashIntegridad(hashData);
      const selladoTemporal = integridad.generarSelladoTemporal(hashData);
      const numeroSerie = integridad.generarNumeroSerie(empresa.id, numeroFactura);

      const producto = await insert(`
        INSERT INTO productos (codigo, descripcion, precio, stock, categoria, activo, fecha_creacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [coche.matricula, descripcion, total, 0, 'vehiculo', false, fechaEmision.toISOString()]);

      const factura = await insert(`
        INSERT INTO facturas (
          numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
          subtotal, igic, total, notas, numero_serie, fecha_operacion,
          tipo_documento, metodo_pago, referencia_operacion, hash_documento,
          sellado_temporal, estado_fiscal, activo, estado
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING id
      `, [
        numeroFactura,
        empresa.id,
        cliente.id,
        fechaEmision.toISOString().split('T')[0],
        fechaVencimiento.toISOString().split('T')[0],
        subtotal,
        igic,
        total,
        `Factura generada automáticamente para ${coche.matricula}`,
        numeroSerie,
        fechaEmision.toISOString().split('T')[0],
        'factura',
        'transferencia',
        `AUTO-${numeroFactura}`,
        hashDocumento,
        selladoTemporal.timestamp,
        'pendiente',
        true,
        'pagada'
      ]);

      await database.query(`
        INSERT INTO detalles_factura (factura_id, producto_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [factura.id, producto.id, 1, subtotal, subtotal, igic, total, descripcion, 'igic']);

      await database.query('UPDATE coches SET activo = false WHERE id = $1', [coche.id]);

      console.log(`✅ Factura ${numeroFactura} creada para el coche ${coche.matricula}`);
    }

    console.log('🎉 Proceso completado.');
  } catch (error) {
    console.error('❌ Error generando facturas pendientes:', error.message);
  } finally {
    await database.close();
  }
}

function randomBetween(min, max) {
  return round2(Math.random() * (max - min) + min);
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

async function obtenerSiguienteNumero(empresaId) {
  const rows = await getRows('SELECT numero_factura FROM facturas WHERE empresa_id = $1 ORDER BY id DESC LIMIT 1', [empresaId]);
  if (rows.length === 0) return 1;
  const match = rows[0].numero_factura.match(/(\d+)\//);
  return match ? parseInt(match[1], 10) + 1 : rows.length + 1;
}

function formatNumeroFactura(correlativo, fechaReferencia) {
  const fecha = fechaReferencia ? new Date(fechaReferencia) : new Date();
  const year = fecha.getFullYear();
  return `TEC${String(correlativo).padStart(3, '0')}/${year}`;
}

async function getRows(query, params = []) {
  const result = await database.query(query, params);
  return result.rows || [];
}

async function getSingleRow(query, params = []) {
  const rows = await getRows(query, params);
  return rows[0] || null;
}

async function insert(query, params) {
  const result = await database.query(query, params);
  return result.rows[0];
}

main();

