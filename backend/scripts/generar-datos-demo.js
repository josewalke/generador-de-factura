#!/usr/bin/env node
/**
 * Genera datos ficticios de un año de operaciones:
 * - 100 coches vendidos (marcados como inactivos)
 * - Facturas y detalles asociados distribuidos a lo largo del año
 *
 * Ejecutar:
 *    node backend/scripts/generar-datos-demo.js
 *
 * Requiere que la configuración de la BD esté correcta (PostgreSQL o SQLite).
 */

const path = require('path');
const config = require('../config/config');
const database = require('../modules/database');
const SistemaIntegridad = require('../modules/sistemaIntegridad');
const sqlite3 = require('sqlite3').verbose();

const TOTAL_VENTAS = 100;
const CLIENTES_OBJETIVO = 35;
const YEAR = new Date().getFullYear();

const colores = [
  'Blanco Nieve', 'Negro Metalizado', 'Gris Plata', 'Rojo Fuego',
  'Azul Marino', 'Verde Bosque', 'Naranja Cobre', 'Amarillo Sol',
  'Beige Arena', 'Azul Eléctrico'
];

const metodosPago = ['transferencia', 'contado', 'financiado'];
const estadosFactura = ['pagada', 'pagada', 'pagada', 'pendiente', 'pendiente', 'vencida'];
const monthLabels = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const marcasModelos = [
  { marca: 'Audi', modelos: ['A3', 'A4', 'Q3', 'Q5', 'A6', 'Q7'] },
  { marca: 'BMW', modelos: ['Serie 1', 'Serie 3', 'Serie 5', 'X1', 'X3', 'X5'] },
  { marca: 'Mercedes-Benz', modelos: ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLC', 'GLE'] },
  { marca: 'Volkswagen', modelos: ['Golf', 'Passat', 'Tiguan', 'T-Cross', 'Polo', 'Arteon'] },
  { marca: 'Toyota', modelos: ['Corolla', 'Yaris', 'RAV4', 'C-HR', 'Camry', 'Hilux'] },
  { marca: 'Kia', modelos: ['Sportage', 'Ceed', 'Sorento', 'Stonic', 'Niro', 'Rio'] },
  { marca: 'Hyundai', modelos: ['Tucson', 'i30', 'Kona', 'Santa Fe', 'Bayon', 'Elantra'] },
  { marca: 'Peugeot', modelos: ['208', '308', '3008', '5008', '2008', '508'] },
  { marca: 'Seat', modelos: ['Ibiza', 'León', 'Ateca', 'Arona', 'Tarraco', 'Toledo'] },
  { marca: 'Nissan', modelos: ['Qashqai', 'Juke', 'X-Trail', 'Micra', 'Leaf', 'Navara'] }
];

const calles = [
  'Avenida Marítima', 'Calle Triana', 'Avenida de Canarias', 'Calle León y Castillo',
  'Calle Mayor', 'Gran Vía', 'Paseo de Las Canteras', 'Calle Real', 'Calle Castillo',
  'Paseo Marítimo', 'Calle Mayorazgo', 'Rambla de Santa Cruz'
];

const dominiosEmail = ['telwagen.com', 'clienteauto.es', 'topcar.es', 'fleetdemo.com'];

const integridad = new SistemaIntegridad();

async function main() {
  const dbType = config.get('database.type') || 'postgresql';
  const isPostgres = dbType === 'postgresql';
  let sqliteDb = null;

  if (isPostgres) {
    console.log('🔌 Conectando a PostgreSQL...');
    await database.connect();
  } else {
    console.log('🔌 Conectando a SQLite...');
    const dbPath = path.resolve(config.get('database.path'));
    sqliteDb = new sqlite3.Database(dbPath);
  }

  const helpers = buildDbHelpers({ isPostgres, sqliteDb });

  try {
    const empresa = await helpers.get('SELECT * FROM empresas ORDER BY id LIMIT 1');
    if (!empresa) {
      throw new Error('No existe ninguna empresa en la base de datos. Crea al menos una antes de ejecutar este script.');
    }

    console.log(`🏢 Usando empresa: ${empresa.nombre} (ID: ${empresa.id})`);

    const clientes = await asegurarClientes(helpers, CLIENTES_OBJETIVO);
    console.log(`👥 Clientes disponibles: ${clientes.length}`);

    const nextNumber = await obtenerSiguienteNumeroFactura(helpers, empresa.id, YEAR);
    console.log(`🧾 Próximo número de factura para ${YEAR}: ${formatInvoiceNumber(nextNumber, YEAR)}`);

    const ventas = generarCalendarioVentas(TOTAL_VENTAS, YEAR);
    const matriculasExistentes = new Set(
      (await helpers.all('SELECT matricula FROM coches')).map(row => row.matricula)
    );

    const resumenMensual = Array.from({ length: 12 }, () => ({ ventas: 0, total: 0 }));

    let secuencia = nextNumber;
    for (let i = 0; i < ventas.length; i++) {
      const venta = ventas[i];
      const coche = generarCoche(matriculasExistentes);
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const precioBase = randomNumber(12000, 45000);
      const subtotal = toMoney(precioBase);
      const igic = toMoney(subtotal * 0.095);
      const total = toMoney(subtotal + igic);
      const numeroFactura = formatInvoiceNumber(secuencia++, YEAR);
      const descripcionProducto = `${coche.marca} ${coche.modelo} - ${coche.matricula} - ${coche.color}`;

      const cocheId = await helpers.insert(
        'INSERT INTO coches (matricula, chasis, color, kms, modelo, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [coche.matricula, coche.chasis, coche.color, coche.kms, `${coche.marca} ${coche.modelo}`, false, venta.fechaISO]
      );

      const productoId = await helpers.insert(
        'INSERT INTO productos (codigo, descripcion, precio, stock, categoria, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [coche.matricula, descripcionProducto, total, 0, 'vehiculo', false, venta.fechaISO]
      );

      const datosFactura = {
        numero_factura: numeroFactura,
        empresa_id: empresa.id,
        cliente_id: cliente.id,
        fecha_emision: venta.fechaISO,
        fecha_operacion: venta.fechaISO,
        subtotal,
        igic,
        total,
        productos: [{
          descripcion: descripcionProducto,
          cantidad: 1,
          precio_unitario: subtotal,
          subtotal,
          igic,
          total
        }]
      };

      const hashDocumento = integridad.generarHashIntegridad(datosFactura);
      const selladoTemporal = integridad.generarSelladoTemporal(datosFactura);
      const numeroSerie = integridad.generarNumeroSerie(empresa.id, numeroFactura);
      const metodoPago = metodosPago[Math.floor(Math.random() * metodosPago.length)];
      const estadoFactura = estadosFactura[Math.floor(Math.random() * estadosFactura.length)];

      const facturaId = await helpers.insert(
        `INSERT INTO facturas (
          numero_factura, empresa_id, cliente_id, fecha_emision, fecha_vencimiento,
          subtotal, igic, total, notas, numero_serie, fecha_operacion,
          tipo_documento, metodo_pago, referencia_operacion, hash_documento,
          sellado_temporal, estado_fiscal, activo, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numeroFactura,
          empresa.id,
          cliente.id,
          venta.fechaISO,
          venta.fechaVencimientoISO,
          subtotal,
          igic,
          total,
          `Venta demo ${coche.marca} ${coche.modelo}`,
          numeroSerie,
          venta.fechaISO,
          'factura',
          metodoPago,
          `OP-${YEAR}-${String(i + 1).padStart(4, '0')}`,
          hashDocumento,
          selladoTemporal.timestamp,
          'pendiente',
          true,
          estadoFactura
        ]
      );

      await helpers.run(
        `INSERT INTO detalles_factura (factura_id, producto_id, cantidad, precio_unitario, subtotal, igic, total, descripcion, tipo_impuesto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [facturaId, productoId, 1, subtotal, subtotal, igic, total, descripcionProducto, 'igic']
      );

      resumenMensual[venta.fecha.getMonth()].ventas += 1;
      resumenMensual[venta.fecha.getMonth()].total += total;

      if ((i + 1) % 10 === 0) {
        console.log(`🚗 Generadas ${i + 1} ventas / ${TOTAL_VENTAS}`);
      }
    }

    console.log('\n✅ Datos demo generados correctamente');
    console.log('Resumen mensual:');
    resumenMensual.forEach((mes, index) => {
      if (mes.ventas > 0) {
        console.log(`  - ${monthLabels[index] || 'Mes'}: ${mes.ventas} ventas · €${mes.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`);
      }
    });
  } catch (error) {
    console.error('❌ Error generando datos demo:', error.message);
    console.error(error);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    } else {
      await database.close();
    }
  }
}

function buildDbHelpers({ isPostgres, sqliteDb }) {
  const all = (sql, params = []) => {
    if (isPostgres) {
      return database.query(sql, params).then(result => result.rows);
    }
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const get = async (sql, params = []) => {
    const rows = await all(sql, params);
    return rows[0] || null;
  };

  const run = (sql, params = []) => {
    if (isPostgres) {
      return database.query(sql, params).then(result => ({
        changes: result.rowCount || 0
      }));
    }
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };

  const insert = async (sql, params = []) => {
    if (isPostgres) {
      const cleaned = sql.trim().endsWith(';') ? sql.trim().slice(0, -1) : sql.trim();
      const result = await database.query(`${cleaned} RETURNING id`, params);
      return result.rows[0]?.id;
    }
    const info = await run(sql, params);
    return info.lastID;
  };

  return { all, get, run, insert };
}

async function asegurarClientes(db, objetivo) {
  const existentes = await db.all('SELECT * FROM clientes');
  const clientes = [...existentes];

  const faltan = Math.max(0, objetivo - existentes.length);
  if (faltan === 0) {
    return clientes;
  }

  console.log(`➕ Generando ${faltan} clientes adicionales...`);
  for (let i = 0; i < faltan; i++) {
    const nombre = generarNombreCliente();
    const identificacion = `CLI-${Date.now()}-${i}`;
    const direccion = `${randomFrom(calles)} ${randomNumber(1, 120)}, Las Palmas`;
    const email = generarEmail(nombre);
    const telefono = `6${randomNumber(10000000, 99999999)}`;

    const clienteId = await db.insert(
      `INSERT INTO clientes (nombre, direccion, codigo_postal, telefono, email, identificacion, pais, provincia, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, direccion, '35001', telefono, email, identificacion, 'España', 'Las Palmas', new Date().toISOString()]
    );

    clientes.push({
      id: clienteId,
      nombre,
      identificacion
    });
  }

  return clientes;
}

async function obtenerSiguienteNumeroFactura(db, empresaId, year) {
  const rows = await db.all(
    'SELECT numero_factura FROM facturas WHERE empresa_id = ? AND numero_factura LIKE ?',
    [empresaId, `%/${year}`]
  );

  let max = 0;
  rows.forEach(row => {
    const match = row.numero_factura && row.numero_factura.match(/(\d+)\//);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) {
        max = num;
      }
    }
  });

  return max + 1;
}

function generarCalendarioVentas(total, year) {
  const start = new Date(`${year}-01-05T12:00:00Z`);
  const end = new Date(`${year}-12-20T12:00:00Z`);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const fechas = Array.from({ length: total }, () => {
    const randomMs = startMs + Math.random() * (endMs - startMs);
    const fecha = new Date(randomMs);
    const fechaISO = fecha.toISOString().split('T')[0];
    const fechaVencimiento = new Date(fecha);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + randomNumber(15, 45));

    return {
      fecha,
      fechaISO,
      fechaVencimientoISO: fechaVencimiento.toISOString().split('T')[0]
    };
  });

  return fechas.sort((a, b) => a.fecha - b.fecha);
}

function generarCoche(existingMatriculas) {
  let matricula = '';
  do {
    matricula = `${randomNumber(1000, 9999)}-${randomLetters(3)}`;
  } while (existingMatriculas.has(matricula));
  existingMatriculas.add(matricula);

  const marcaInfo = randomFrom(marcasModelos);
  const modelo = randomFrom(marcaInfo.modelos);

  return {
    matricula,
    chasis: randomChasis(),
    color: randomFrom(colores),
    kms: randomNumber(5000, 180000),
    marca: marcaInfo.marca,
    modelo
  };
}

function generarNombreCliente() {
  const nombres = ['Carlos', 'María', 'Jose', 'Ana', 'Pedro', 'Lucía', 'Javier', 'Paula', 'Miguel', 'Elena', 'Raúl', 'Carmen', 'Sergio', 'Patricia', 'David', 'Laura'];
  const apellidos = ['García', 'Hernández', 'Rodríguez', 'Martín', 'Fernández', 'Díaz', 'López', 'Serrano', 'Suárez', 'Castro', 'Navarro', 'Vega', 'Romero', 'Ibáñez', 'León', 'Campos'];
  return `${randomFrom(nombres)} ${randomFrom(apellidos)}`;
}

function generarEmail(nombre) {
  const slug = nombre.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.');
  return `${slug}.${randomNumber(100, 999)}@${randomFrom(dominiosEmail)}`;
}

function formatInvoiceNumber(counter, year) {
  return `TEC${String(counter).padStart(3, '0')}/${year}`;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomLetters(length) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}

function randomChasis() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 17; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function toMoney(value) {
  return Math.round(value * 100) / 100;
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

main();

