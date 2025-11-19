const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const database = require('./database');

class ImportadorExcel {
    constructor(db) {
        this.db = db;
    }

    // Función para formatear precios según especificaciones españolas
    formatearPrecio(precio) {
        if (!precio || precio === 0) return '';
        
        // Formatear con separador de miles (punto) y decimales (coma)
        const formateado = precio.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Añadir el símbolo del euro al final
        return `${formateado} €`;
    }

    /**
     * Importar coches desde archivo Excel
     * @param {string} filePath - Ruta del archivo Excel
     * @param {string} sheetName - Nombre de la hoja (opcional)
     * @returns {Promise<Object>} - Resultado de la importación
     */
    async importarCoches(filePath, sheetName = null) {
        try {
            console.log('\n📖 ========== LECTURA DE ARCHIVO EXCEL ==========');
            console.log('📁 Ruta del archivo:', filePath);
            console.log('📄 Verificando existencia del archivo...');
            
            // Verificar que el archivo existe
            if (!fs.existsSync(filePath)) {
                throw new Error(`El archivo no existe en la ruta: ${filePath}`);
            }
            
            const fileStats = fs.statSync(filePath);
            console.log('📊 Información del archivo:', {
                size: `${fileStats.size} bytes`,
                modified: fileStats.mtime
            });
            
            // Leer archivo Excel
            console.log('📖 Leyendo archivo Excel...');
            const workbook = XLSX.readFile(filePath);
            console.log('📋 Hojas encontradas:', workbook.SheetNames);
            
            const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
            if (!sheet) {
                throw new Error(`No se encontró la hoja "${sheetName || workbook.SheetNames[0]}" en el archivo Excel`);
            }
            
            // Obtener rango de la hoja
            const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
            console.log('📐 Rango de la hoja:', {
                inicio: `A${range.s.r + 1}`,
                fin: `${String.fromCharCode(65 + range.e.c)}${range.e.r + 1}`,
                filas: range.e.r + 1,
                columnas: range.e.c + 1
            });
            
            // Convertir a JSON
            // Primero intentar leer con headers automáticos
            console.log('🔄 Intentando leer con headers automáticos...');
            let data = XLSX.utils.sheet_to_json(sheet);
            console.log('📊 Resultado lectura automática:', {
                filasEncontradas: data.length,
                primeraFila: data.length > 0 ? Object.keys(data[0]) : null
            });
            
            // Si no hay datos, intentar leer con headers en la primera fila
            if (!data || data.length === 0) {
                console.log('⚠️ No se encontraron datos con lectura automática.');
                console.log('🔄 Intentando leer con headers explícitos en primera fila...');
                const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
                console.log('📋 Datos raw (array de arrays):', {
                    totalFilas: rawData.length,
                    primeraFila: rawData[0],
                    todasLasFilas: rawData
                });
                
                if (rawData && rawData.length > 1) {
                    // Si hay más de una fila, usar la primera como headers
                    const headers = rawData[0];
                    const rows = rawData.slice(1);
                    
                    console.log('📋 Headers detectados:', headers);
                    console.log('📋 Filas de datos encontradas:', rows.length);
                    
                    // Convertir a objetos con los headers como claves
                    data = rows.map((row, rowIndex) => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            if (header) {
                                obj[header] = row[index] || null;
                            }
                        });
                        return obj;
                    }).filter(row => {
                        // Filtrar filas completamente vacías
                        const hasData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
                        if (!hasData) {
                            console.log('⚠️ Fila vacía filtrada:', row);
                        }
                        return hasData;
                    });
                    
                    console.log('📊 Datos convertidos desde raw:', data.length, 'filas válidas');
                    if (data.length > 0) {
                        console.log('📊 Primera fila de datos:', data[0]);
                    }
                } else if (rawData && rawData.length === 1) {
                    // Solo hay headers, no hay datos
                    console.log('❌ PROBLEMA DETECTADO: El archivo solo contiene encabezados');
                    console.log('📋 Headers encontrados:', rawData[0]);
                    console.log('📊 Análisis del archivo:');
                    console.log('   - Total de filas en el archivo: 1 (solo encabezados)');
                    console.log('   - Filas de datos: 0');
                    console.log('   - Columnas detectadas:', rawData[0].length);
                    console.log('   - Nombres de columnas:', rawData[0].filter(h => h).join(', '));
                    
                    const headersList = rawData[0].filter(h => h).join(', ');
                    throw new Error(`El archivo Excel solo contiene encabezados (${headersList}). Debe tener al menos una fila de datos después de los encabezados. Formato esperado: Fila 1 = Encabezados (Matrícula, Modelo, Color, Chasis, Kilómetros), Fila 2+ = Datos de coches. Nota: La columna "Estado" es opcional y se ignorará si existe.`);
                } else if (!rawData || rawData.length === 0) {
                    console.log('❌ El archivo Excel está completamente vacío');
                    throw new Error('El archivo Excel está completamente vacío. Verifica que el archivo tenga contenido.');
                }
            }
            
            console.log('📖 ========== FIN LECTURA DE ARCHIVO EXCEL ==========\n');
            
            // Debug: mostrar las primeras filas para diagnóstico
            console.log('\n📊 ========== ANÁLISIS DE DATOS LEÍDOS ==========');
            console.log('📈 Total de filas de datos encontradas:', data.length);
            
            if (data.length > 0) {
                console.log('✅ Se encontraron datos en el archivo');
                console.log('📋 Columnas detectadas en primera fila:', Object.keys(data[0]));
                console.log('📄 Primera fila completa:', JSON.stringify(data[0], null, 2));
                
                if (data.length > 1) {
                    console.log('📄 Segunda fila:', JSON.stringify(data[1], null, 2));
                }
                
                if (data.length > 2) {
                    console.log(`📄 ... y ${data.length - 2} filas más`);
                }
            } else {
                console.log('❌ No se encontraron datos después del procesamiento');
                // Si no hay datos, intentar leer con header en la primera fila
                console.log('🔄 Reintentando lectura con método alternativo...');
                const dataWithHeaders = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                console.log('📋 Datos con headers (método alternativo):', {
                    totalFilas: dataWithHeaders.length,
                    contenido: dataWithHeaders
                });
                
                if (!dataWithHeaders || dataWithHeaders.length === 0) {
                    throw new Error('El archivo Excel está vacío o no contiene datos. Asegúrate de que el archivo tenga al menos una fila de datos además de los encabezados.');
                }
                
                if (dataWithHeaders.length === 1) {
                    throw new Error('El archivo Excel solo contiene encabezados. Debe tener al menos una fila de datos.');
                }
                
                throw new Error('No se pudieron leer los datos del archivo Excel. Verifica que el archivo tenga el formato correcto con columnas: Matrícula, Modelo, Color, Chasis, Kilómetros. La columna "Estado" es opcional y se ignorará si existe.');
            }
            
            console.log('📊 ========== FIN ANÁLISIS DE DATOS ==========\n');
            
            let importados = 0;
            let errores = 0;
            const erroresDetalle = [];

            // Validar que haya al menos una fila de datos
            if (!data || data.length === 0) {
                throw new Error('El archivo Excel está vacío. Debe contener al menos una fila de datos.');
            }

            // Validar que la primera fila tenga datos válidos
            if (!data[0] || typeof data[0] !== 'object') {
                throw new Error('El formato del archivo Excel no es válido. La primera fila debe contener los encabezados de las columnas.');
            }

            // Detectar automáticamente los nombres de las columnas
            const columnasDetectadas = this.detectarColumnasCoches(data[0]);
            console.log('🔍 Columnas detectadas:', columnasDetectadas);
            
            // Verificar si existe columna "Estado" (se ignorará si existe)
            const tieneEstado = Object.keys(data[0]).some(col => 
                col.toLowerCase().includes('estado') || 
                col.toLowerCase().includes('state') ||
                col.toLowerCase().includes('status')
            );
            if (tieneEstado) {
                console.log('ℹ️ Se detectó columna "Estado" en el archivo. Esta columna será ignorada (no se usa en la base de datos).');
            }
            
            // Validar que se hayan detectado las columnas mínimas necesarias
            if (!columnasDetectadas.matricula && !columnasDetectadas.chasis && !columnasDetectadas.modelo) {
                console.log('⚠️ No se detectaron columnas principales. Columnas disponibles:', Object.keys(data[0]));
                throw new Error(`No se pudieron detectar las columnas necesarias en el archivo Excel. Columnas encontradas: ${Object.keys(data[0]).join(', ')}. Se requieren al menos: Matrícula, Modelo, Color, Chasis. La columna "Estado" es opcional y se ignorará si existe.`);
            }
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    // Debug: mostrar datos de la fila actual
                    console.log(`\n🔍 Procesando fila ${i + 2}:`, row);
                    
                    // Mapear campos del Excel usando las columnas detectadas
                    // Nota: La columna "Estado" se ignora si existe, no se usa en la BD
                    let marca = this.obtenerValor(row, columnasDetectadas.marca);
                    let modelo = this.obtenerValor(row, columnasDetectadas.modelo);
                    
                    // Si no hay marca pero hay modelo, extraer marca del modelo
                    if (!marca && modelo) {
                        const partes = modelo.toString().trim().split(' ');
                        marca = partes.length > 0 ? partes[0] : '';
                        if (partes.length > 1) {
                            modelo = partes.slice(1).join(' ');
                        }
                    }
                    
                    const coche = {
                        matricula: this.obtenerValor(row, columnasDetectadas.matricula),
                        chasis: this.obtenerValor(row, columnasDetectadas.chasis),
                        color: this.obtenerValor(row, columnasDetectadas.color),
                        kms: parseInt(this.obtenerValor(row, columnasDetectadas.kms) || 0),
                        modelo: modelo,
                        marca: marca || null
                    };
                    
                    console.log('📋 Datos mapeados (sin Estado):', coche);

                    // Validar campos obligatorios con mensajes específicos
                    const camposFaltantes = [];
                    if (!coche.matricula || coche.matricula.toString().trim() === '') {
                        camposFaltantes.push('Matricula');
                    }
                    if (!coche.chasis || coche.chasis.toString().trim() === '') {
                        camposFaltantes.push('Chasis');
                    }
                    if (!coche.color || coche.color.toString().trim() === '') {
                        camposFaltantes.push('Color');
                    }
                    if (!coche.modelo || coche.modelo.toString().trim() === '') {
                        camposFaltantes.push('Modelo');
                    }

                    if (camposFaltantes.length > 0) {
                        throw new Error(`Faltan campos obligatorios: ${camposFaltantes.join(', ')}`);
                    }

                    // Limpiar y validar datos
                    coche.matricula = coche.matricula.toString().trim().toUpperCase();
                    coche.chasis = coche.chasis.toString().trim().toUpperCase();
                    coche.color = coche.color.toString().trim();
                    coche.modelo = coche.modelo.toString().trim();
                    coche.marca = coche.marca ? coche.marca.toString().trim() : null;
                    
                    // Validar que kms sea un número válido
                    if (isNaN(coche.kms) || coche.kms < 0) {
                        coche.kms = 0;
                    }

                    // Insertar en la base de datos (compatible con SQLite y PostgreSQL)
                    const dbType = config.get('database.type') || 'postgresql';
                    const isPostgreSQL = dbType === 'postgresql';
                    
                    if (isPostgreSQL) {
                        // PostgreSQL: usar ON CONFLICT
                        // Acceder directamente a database para usar query
                        try {
                            await database.query(`
                                INSERT INTO coches (matricula, chasis, color, kms, modelo, marca, activo)
                                VALUES ($1, $2, $3, $4, $5, $6, true)
                                ON CONFLICT (matricula) 
                                DO UPDATE SET 
                                    chasis = EXCLUDED.chasis,
                                    color = EXCLUDED.color,
                                    kms = EXCLUDED.kms,
                                    modelo = EXCLUDED.modelo,
                                    marca = EXCLUDED.marca,
                                    activo = true
                            `, [coche.matricula, coche.chasis, coche.color, coche.kms, coche.modelo, coche.marca]);
                        } catch (dbError) {
                            // Si falla por falta de constraint UNIQUE, intentar UPDATE
                            if (dbError.message.includes('duplicate key') || dbError.message.includes('unique constraint') || dbError.message.includes('violates unique constraint')) {
                                // Verificar si existe primero
                                const existing = await database.query(`SELECT id FROM coches WHERE matricula = $1`, [coche.matricula]);
                                if (existing.rows && existing.rows.length > 0) {
                                    // Actualizar en lugar de insertar
                                    await database.query(`
                                        UPDATE coches 
                                        SET chasis = $1, color = $2, kms = $3, modelo = $4, marca = $5, activo = true
                                        WHERE matricula = $6
                                    `, [coche.chasis, coche.color, coche.kms, coche.modelo, coche.marca, coche.matricula]);
                                } else {
                                    // Si no existe, intentar insertar sin ON CONFLICT
                                    await database.query(`
                                        INSERT INTO coches (matricula, chasis, color, kms, modelo, marca, activo)
                                        VALUES ($1, $2, $3, $4, $5, $6, true)
                                    `, [coche.matricula, coche.chasis, coche.color, coche.kms, coche.modelo, coche.marca]);
                                }
                            } else {
                                throw dbError;
                            }
                        }
                    } else {
                        // SQLite: usar INSERT OR REPLACE
                        await new Promise((resolve, reject) => {
                            this.db.run(`
                                INSERT OR REPLACE INTO coches (matricula, chasis, color, kms, modelo, marca, activo)
                                VALUES (?, ?, ?, ?, ?, ?, 1)
                            `, [coche.matricula, coche.chasis, coche.color, coche.kms, coche.modelo, coche.marca], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    }

                    importados++;
                } catch (error) {
                    errores++;
                    erroresDetalle.push({
                        fila: i + 2, // +2 porque Excel empieza en 1 y la primera fila son headers
                        mensaje: error.message,
                        error: error.message, // Mantener ambos para compatibilidad
                        datos: row
                    });
                    console.log(`❌ Error en fila ${i + 2}:`, error.message);
                }
            }

            return {
                success: true,
                total: data.length,
                importados,
                errores,
                erroresDetalle
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Importar productos desde archivo Excel
     * @param {string} filePath - Ruta del archivo Excel
     * @param {string} sheetName - Nombre de la hoja (opcional)
     * @returns {Promise<Object>} - Resultado de la importación
     */
    async importarProductos(filePath, sheetName = null) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            // Detectar automáticamente los nombres de las columnas
            const columnasDetectadas = this.detectarColumnasProductos(data[0]);
            console.log('🔍 Columnas detectadas:', columnasDetectadas);

            let importados = 0;
            let errores = 0;
            const erroresDetalle = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    const producto = {
                        codigo: this.obtenerValor(row, columnasDetectadas.codigo),
                        descripcion: this.obtenerValor(row, columnasDetectadas.descripcion),
                        precio: parseFloat(this.obtenerValor(row, columnasDetectadas.precio) || 0),
                        stock: parseInt(this.obtenerValor(row, columnasDetectadas.stock) || 0)
                    };

                    if (!producto.codigo || !producto.descripcion) {
                        throw new Error('Faltan campos obligatorios');
                    }

                    await new Promise((resolve, reject) => {
                        this.db.run(`
                            INSERT OR REPLACE INTO productos (codigo, descripcion, precio, stock)
                            VALUES (?, ?, ?, ?)
                        `, [producto.codigo, producto.descripcion, producto.precio, producto.stock], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    importados++;
                } catch (error) {
                    errores++;
                    erroresDetalle.push({
                        fila: i + 2,
                        error: error.message,
                        datos: row
                    });
                }
            }

            return {
                success: true,
                total: data.length,
                importados,
                errores,
                erroresDetalle
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Importar clientes desde archivo Excel
     * @param {string} filePath - Ruta del archivo Excel
     * @param {string} sheetName - Nombre de la hoja (opcional)
     * @returns {Promise<Object>} - Resultado de la importación
     */
    async importarClientes(filePath, sheetName = null) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            // Detectar automáticamente los nombres de las columnas
            const columnasDetectadas = this.detectarColumnasClientes(data[0]);
            console.log('🔍 Columnas detectadas:', columnasDetectadas);

            let importados = 0;
            let errores = 0;
            const erroresDetalle = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    const cliente = {
                        nombre: this.obtenerValor(row, columnasDetectadas.nombre),
                        direccion: this.obtenerValor(row, columnasDetectadas.direccion),
                        identificacion: this.obtenerValor(row, columnasDetectadas.identificacion),
                        email: this.obtenerValor(row, columnasDetectadas.email),
                        telefono: this.obtenerValor(row, columnasDetectadas.telefono)
                    };

                    if (!cliente.nombre || !cliente.identificacion) {
                        throw new Error('Faltan campos obligatorios');
                    }

                    await new Promise((resolve, reject) => {
                        this.db.run(`
                            INSERT OR REPLACE INTO clientes (nombre, direccion, identificacion, email, telefono)
                            VALUES (?, ?, ?, ?, ?)
                        `, [cliente.nombre, cliente.direccion, cliente.identificacion, cliente.email, cliente.telefono], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    importados++;
                } catch (error) {
                    errores++;
                    erroresDetalle.push({
                        fila: i + 2,
                        error: error.message,
                        datos: row
                    });
                }
            }

            return {
                success: true,
                total: data.length,
                importados,
                errores,
                erroresDetalle
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generar plantilla Excel para importación
     * @param {string} tipo - Tipo de plantilla ('coches', 'productos', 'clientes')
     * @param {string} filePath - Ruta donde guardar la plantilla
     */
    generarPlantilla(tipo, filePath) {
        let headers = [];
        let datosEjemplo = [];

        switch (tipo) {
            case 'coches':
                headers = ['Matricula', 'Marca', 'Modelo', 'Chasis', 'Color', 'Kms'];
                datosEjemplo = [
                    ['GC-1234-AB', 'BMW', '320i', 'WBAVB13506PT12345', 'Blanco', 45000],
                    ['GC-5678-CD', 'Volkswagen', 'Golf', 'WVWZZZ1KZAW123456', 'Negro', 32000]
                ];
                break;
            case 'productos':
                headers = ['Codigo', 'Descripcion', 'Precio', 'Stock'];
                datosEjemplo = [
                    ['NISSAN-MICRA-1.0', 'Nissan Micra 1.0', 15000, 10],
                    ['NISSAN-QASHQAI-1.3', 'Nissan Qashqai 1.3', 25000, 5]
                ];
                break;
            case 'clientes':
                headers = ['Nombre', 'Direccion', 'Identificacion', 'Email', 'Telefono'];
                datosEjemplo = [
                    ['Cliente Ejemplo S.L.', 'Calle Ejemplo 123', 'B12345678', 'cliente@ejemplo.com', '+34 123 456 789'],
                    ['Otro Cliente S.A.', 'Avenida Test 456', 'A87654321', 'otro@ejemplo.com', '+34 987 654 321']
                ];
                break;
            default:
                throw new Error('Tipo de plantilla no válido');
        }

        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...datosEjemplo]);
        
        // Añadir hoja al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
        
        // Escribir archivo
        XLSX.writeFile(wb, filePath);
    }

    /**
     * Detectar automáticamente los nombres de las columnas para coches
     * @param {Object} primeraFila - Primera fila del Excel (headers)
     * @returns {Object} - Objeto con los nombres de columnas detectados
     */
    detectarColumnasCoches(primeraFila) {
        // Validar que primeraFila sea un objeto válido
        if (!primeraFila || typeof primeraFila !== 'object') {
            throw new Error('La primera fila del archivo Excel no contiene datos válidos');
        }

        const columnas = {
            matricula: null,
            chasis: null,
            color: null,
            kms: null,
            modelo: null,
            marca: null
        };

        // Patrones de búsqueda para cada campo
        const patrones = {
            matricula: [
                'matricula', 'matrícula', 'matriculas', 'matrículas',
                'placa', 'placas', 'license', 'registration',
                'mat', 'plate', 'reg'
            ],
            chasis: [
                'chasis', 'chassis', 'vin', 'numero_chasis', 'número_chasis',
                'numero_chassis', 'número_chassis', 'chasis_number',
                'vin_number', 'frame', 'bastidor'
            ],
            color: [
                'color', 'colores', 'paint', 'pintura', 'colour',
                'tinte', 'tono', 'shade'
            ],
            kms: [
                'kms', 'kilometros', 'kilómetros', 'kilometraje', 'kilometrage',
                'mileage', 'odometer', 'odometro', 'odómetro',
                'km', 'miles', 'millas', 'distance', 'distancia'
            ],
            modelo: [
                'modelo', 'modelos', 'model', 'models', 'tipo', 'type',
                'vehiculo', 'vehículo', 'vehicle', 'car', 'coche'
            ],
            marca: [
                'marca', 'marcas', 'brand', 'brands', 'make', 'makes',
                'fabricante', 'manufacturer', 'manufacturer'
            ]
        };

        // Buscar cada campo en las columnas disponibles
        Object.keys(patrones).forEach(campo => {
            const nombresColumna = Object.keys(primeraFila);
            
            for (const nombreColumna of nombresColumna) {
                const nombreNormalizado = nombreColumna.toLowerCase()
                    .replace(/[áéíóúàèìòùäëïöüâêîôû]/g, (match) => {
                        const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
                                    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
                                    'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
                                    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u' };
                        return map[match] || match;
                    })
                    .replace(/[^a-z0-9]/g, '');
                
                // Buscar coincidencias exactas o parciales
                for (const patron of patrones[campo]) {
                    const patronNormalizado = patron.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    if (nombreNormalizado === patronNormalizado || 
                        nombreNormalizado.includes(patronNormalizado) ||
                        patronNormalizado.includes(nombreNormalizado)) {
                        columnas[campo] = nombreColumna;
                        console.log(`✅ Campo '${campo}' detectado como: '${nombreColumna}'`);
                        break;
                    }
                }
                
                if (columnas[campo]) break;
            }
        });

        // Verificar campos no detectados
        const camposNoDetectados = Object.keys(columnas).filter(campo => !columnas[campo]);
        if (camposNoDetectados.length > 0) {
            console.log(`⚠️ Campos no detectados: ${camposNoDetectados.join(', ')}`);
            console.log('📋 Columnas disponibles:', Object.keys(primeraFila));
        }

        return columnas;
    }

    /**
     * Obtener valor de una fila usando diferentes nombres de columna posibles
     * @param {Object} fila - Fila del Excel
     * @param {string} nombreColumna - Nombre de la columna detectada
     * @returns {string|number|null} - Valor encontrado
     */
    obtenerValor(fila, nombreColumna) {
        if (!nombreColumna) return null;
        
        // Buscar el valor exacto
        if (fila[nombreColumna] !== undefined) {
            return fila[nombreColumna];
        }
        
        // Buscar variaciones del nombre
        const variaciones = [
            nombreColumna.toLowerCase(),
            nombreColumna.toUpperCase(),
            nombreColumna.charAt(0).toUpperCase() + nombreColumna.slice(1).toLowerCase()
        ];
        
        for (const variacion of variaciones) {
            if (fila[variacion] !== undefined) {
                return fila[variacion];
            }
        }
        
        return null;
    }

    /**
     * Detectar automáticamente los nombres de las columnas para productos
     * @param {Object} primeraFila - Primera fila del Excel (headers)
     * @returns {Object} - Objeto con los nombres de columnas detectados
     */
    detectarColumnasProductos(primeraFila) {
        const columnas = {
            codigo: null,
            descripcion: null,
            precio: null,
            stock: null
        };

        const patrones = {
            codigo: [
                'codigo', 'código', 'code', 'sku', 'referencia', 'ref',
                'id', 'identificador', 'product_code', 'item_code'
            ],
            descripcion: [
                'descripcion', 'descripción', 'description', 'nombre', 'name',
                'producto', 'product', 'articulo', 'artículo', 'item',
                'titulo', 'título', 'title'
            ],
            precio: [
                'precio', 'price', 'coste', 'costo', 'cost', 'valor', 'value',
                'importe', 'amount', 'tarifa', 'rate', 'pvp', 'pvp_iva'
            ],
            stock: [
                'stock', 'inventario', 'inventory', 'cantidad', 'quantity',
                'disponible', 'available', 'existencias', 'units', 'unidades'
            ]
        };

        Object.keys(patrones).forEach(campo => {
            const nombresColumna = Object.keys(primeraFila);
            
            for (const nombreColumna of nombresColumna) {
                const nombreNormalizado = nombreColumna.toLowerCase()
                    .replace(/[áéíóúàèìòùäëïöüâêîôû]/g, (match) => {
                        const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
                                    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
                                    'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
                                    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u' };
                        return map[match] || match;
                    })
                    .replace(/[^a-z0-9]/g, '');
                
                for (const patron of patrones[campo]) {
                    const patronNormalizado = patron.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    if (nombreNormalizado === patronNormalizado || 
                        nombreNormalizado.includes(patronNormalizado) ||
                        patronNormalizado.includes(nombreNormalizado)) {
                        columnas[campo] = nombreColumna;
                        break;
                    }
                }
                
                if (columnas[campo]) break;
            }
        });

        return columnas;
    }

    /**
     * Detectar automáticamente los nombres de las columnas para clientes
     * @param {Object} primeraFila - Primera fila del Excel (headers)
     * @returns {Object} - Objeto con los nombres de columnas detectados
     */
    detectarColumnasClientes(primeraFila) {
        const columnas = {
            nombre: null,
            direccion: null,
            identificacion: null,
            email: null,
            telefono: null
        };

        const patrones = {
            nombre: [
                'nombre', 'name', 'razon_social', 'razón_social', 'company',
                'empresa', 'cliente', 'customer', 'client', 'titular'
            ],
            direccion: [
                'direccion', 'dirección', 'address', 'domicilio', 'residencia',
                'calle', 'street', 'ubicacion', 'ubicación', 'location'
            ],
            identificacion: [
                'identificacion', 'identificación', 'id', 'dni', 'nif', 'cif',
                'nie', 'passport', 'pasaporte', 'documento', 'document',
                'tax_id', 'fiscal_id', 'identification'
            ],
            email: [
                'email', 'e-mail', 'correo', 'mail', 'electronic_mail',
                'contacto_email', 'contact_email'
            ],
            telefono: [
                'telefono', 'teléfono', 'phone', 'movil', 'móvil', 'mobile',
                'celular', 'cellular', 'contacto', 'contact', 'tlf'
            ]
        };

        Object.keys(patrones).forEach(campo => {
            const nombresColumna = Object.keys(primeraFila);
            
            for (const nombreColumna of nombresColumna) {
                const nombreNormalizado = nombreColumna.toLowerCase()
                    .replace(/[áéíóúàèìòùäëïöüâêîôû]/g, (match) => {
                        const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
                                    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
                                    'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u',
                                    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u' };
                        return map[match] || match;
                    })
                    .replace(/[^a-z0-9]/g, '');
                
                for (const patron of patrones[campo]) {
                    const patronNormalizado = patron.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    if (nombreNormalizado === patronNormalizado || 
                        nombreNormalizado.includes(patronNormalizado) ||
                        patronNormalizado.includes(nombreNormalizado)) {
                        columnas[campo] = nombreColumna;
                        break;
                    }
                }
                
                if (columnas[campo]) break;
            }
        });

        return columnas;
    }

    /**
     * Exportar coches a archivo Excel
     * @param {string} filePath - Ruta donde guardar el archivo Excel
     * @param {Array} filtros - Filtros opcionales para la exportación
     * @returns {Promise<Object>} - Resultado de la exportación
     */
    async exportarCoches(filePath, filtros = {}) {
        try {
            console.log('📤 Iniciando exportación de coches...');
            
            // Construir consulta SQL con filtros opcionales
            let query = `
                SELECT 
                    c.id,
                    c.matricula,
                    c.chasis,
                    c.color,
                    c.kms,
                    c.modelo,
                    c.activo,
                    c.fecha_creacion,
                    CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as vendido,
                    f.numero_factura,
                    f.fecha_emision as fecha_venta,
                    f.total as precio_venta,
                    cl.nombre as cliente_nombre
                FROM coches c
                LEFT JOIN productos p ON c.matricula = p.codigo
                LEFT JOIN detalles_factura df ON p.id = df.producto_id
                LEFT JOIN facturas f ON df.factura_id = f.id AND f.estado IN ('pagada', 'pendiente')
                LEFT JOIN clientes cl ON f.cliente_id = cl.id
                WHERE c.activo = 1
            `;
            
            const params = [];
            
            // Añadir filtros si se proporcionan
            if (filtros.modelo) {
                query += ' AND c.modelo LIKE ?';
                params.push(`%${filtros.modelo}%`);
            }
            
            if (filtros.color) {
                query += ' AND c.color LIKE ?';
                params.push(`%${filtros.color}%`);
            }
            
            if (filtros.kmsMin) {
                query += ' AND c.kms >= ?';
                params.push(filtros.kmsMin);
            }
            
            if (filtros.kmsMax) {
                query += ' AND c.kms <= ?';
                params.push(filtros.kmsMax);
            }
            
            query += ' ORDER BY c.fecha_creacion DESC';
            
            // Ejecutar consulta
            const coches = await new Promise((resolve, reject) => {
                this.db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`📊 ${coches.length} coches encontrados para exportar`);
            
            // Preparar datos para Excel
            const headers = [
                'ID', 'Matrícula', 'Chasis', 'Color', 'Kilómetros', 
                'Modelo', 'Estado', 'Fecha Creación', 'Vendido', 'Nº Factura', 'Fecha Venta', 'Precio Venta', 'Cliente'
            ];
            
            const datos = coches.map(coche => [
                coche.id,
                coche.matricula,
                coche.chasis,
                coche.color,
                coche.kms,
                coche.modelo,
                coche.activo ? 'Activo' : 'Inactivo',
                new Date(coche.fecha_creacion).toLocaleDateString('es-ES'),
                coche.vendido ? 'Sí' : 'No',
                coche.numero_factura || '',
                coche.fecha_venta ? new Date(coche.fecha_venta).toLocaleDateString('es-ES') : '',
                this.formatearPrecio(coche.precio_venta),
                coche.cliente_nombre || ''
            ]);
            
            // Crear workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...datos]);
            
            // Añadir estilos y formato
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Ajustar ancho de columnas
            const colWidths = [
                { wch: 8 },   // ID
                { wch: 15 },  // Matrícula
                { wch: 20 },  // Chasis
                { wch: 12 },  // Color
                { wch: 12 },  // Kilómetros
                { wch: 25 },  // Modelo
                { wch: 10 },  // Estado
                { wch: 15 },  // Fecha Creación
                { wch: 10 },  // Vendido
                { wch: 15 },  // Nº Factura
                { wch: 15 },  // Fecha Venta
                { wch: 15 },  // Precio Venta
                { wch: 25 }   // Cliente
            ];
            ws['!cols'] = colWidths;
            
            // Añadir hoja al workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Coches');
            
            // Escribir archivo
            XLSX.writeFile(wb, filePath);
            
            console.log('✅ Exportación completada:', filePath);
            
            return {
                success: true,
                total: coches.length,
                filePath: filePath,
                message: `Se exportaron ${coches.length} coches correctamente`
            };
            
        } catch (error) {
            console.error('❌ Error en exportación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Exportar productos a archivo Excel
     * @param {string} filePath - Ruta donde guardar el archivo Excel
     * @param {Array} filtros - Filtros opcionales para la exportación
     * @returns {Promise<Object>} - Resultado de la exportación
     */
    async exportarProductos(filePath, filtros = {}) {
        try {
            console.log('📤 Iniciando exportación de productos...');
            
            let query = `
                SELECT 
                    id,
                    codigo,
                    descripcion,
                    precio,
                    stock,
                    activo,
                    fecha_creacion,
                    fecha_modificacion
                FROM productos 
                WHERE activo = 1
            `;
            
            const params = [];
            
            if (filtros.codigo) {
                query += ' AND codigo LIKE ?';
                params.push(`%${filtros.codigo}%`);
            }
            
            if (filtros.descripcion) {
                query += ' AND descripcion LIKE ?';
                params.push(`%${filtros.descripcion}%`);
            }
            
            if (filtros.precioMin) {
                query += ' AND precio >= ?';
                params.push(filtros.precioMin);
            }
            
            if (filtros.precioMax) {
                query += ' AND precio <= ?';
                params.push(filtros.precioMax);
            }
            
            query += ' ORDER BY fecha_creacion DESC';
            
            const productos = await new Promise((resolve, reject) => {
                this.db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`📊 ${productos.length} productos encontrados para exportar`);
            
            const headers = [
                'ID', 'Código', 'Descripción', 'Precio', 'Stock', 
                'Activo', 'Fecha Creación', 'Fecha Modificación'
            ];
            
            const datos = productos.map(producto => [
                producto.id,
                producto.codigo,
                producto.descripcion,
                producto.precio,
                producto.stock,
                producto.activo ? 'Sí' : 'No',
                new Date(producto.fecha_creacion).toLocaleDateString('es-ES'),
                producto.fecha_modificacion ? new Date(producto.fecha_modificacion).toLocaleDateString('es-ES') : ''
            ]);
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...datos]);
            
            const colWidths = [
                { wch: 8 },   // ID
                { wch: 20 },  // Código
                { wch: 30 },  // Descripción
                { wch: 12 },  // Precio
                { wch: 10 },  // Stock
                { wch: 8 },   // Activo
                { wch: 15 },  // Fecha Creación
                { wch: 15 }   // Fecha Modificación
            ];
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, 'Productos');
            XLSX.writeFile(wb, filePath);
            
            console.log('✅ Exportación completada:', filePath);
            
            return {
                success: true,
                total: productos.length,
                filePath: filePath,
                message: `Se exportaron ${productos.length} productos correctamente`
            };
            
        } catch (error) {
            console.error('❌ Error en exportación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Exportar clientes a archivo Excel
     * @param {string} filePath - Ruta donde guardar el archivo Excel
     * @param {Array} filtros - Filtros opcionales para la exportación
     * @returns {Promise<Object>} - Resultado de la exportación
     */
    async exportarClientes(filePath, filtros = {}) {
        try {
            console.log('📤 Iniciando exportación de clientes...');
            
            let query = `
                SELECT 
                    id,
                    nombre,
                    direccion,
                    identificacion,
                    email,
                    telefono,
                    activo,
                    fecha_creacion,
                    fecha_modificacion
                FROM clientes 
                WHERE activo = 1
            `;
            
            const params = [];
            
            if (filtros.nombre) {
                query += ' AND nombre LIKE ?';
                params.push(`%${filtros.nombre}%`);
            }
            
            if (filtros.identificacion) {
                query += ' AND identificacion LIKE ?';
                params.push(`%${filtros.identificacion}%`);
            }
            
            if (filtros.email) {
                query += ' AND email LIKE ?';
                params.push(`%${filtros.email}%`);
            }
            
            query += ' ORDER BY fecha_creacion DESC';
            
            const clientes = await new Promise((resolve, reject) => {
                this.db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`📊 ${clientes.length} clientes encontrados para exportar`);
            
            const headers = [
                'ID', 'Nombre', 'Dirección', 'Identificación', 'Email', 'Teléfono',
                'Activo', 'Fecha Creación', 'Fecha Modificación'
            ];
            
            const datos = clientes.map(cliente => [
                cliente.id,
                cliente.nombre,
                cliente.direccion,
                cliente.identificacion,
                cliente.email,
                cliente.telefono,
                cliente.activo ? 'Sí' : 'No',
                new Date(cliente.fecha_creacion).toLocaleDateString('es-ES'),
                cliente.fecha_modificacion ? new Date(cliente.fecha_modificacion).toLocaleDateString('es-ES') : ''
            ]);
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...datos]);
            
            const colWidths = [
                { wch: 8 },   // ID
                { wch: 25 },  // Nombre
                { wch: 30 },  // Dirección
                { wch: 15 },  // Identificación
                { wch: 25 },  // Email
                { wch: 15 },  // Teléfono
                { wch: 8 },   // Activo
                { wch: 15 },  // Fecha Creación
                { wch: 15 }   // Fecha Modificación
            ];
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
            XLSX.writeFile(wb, filePath);
            
            console.log('✅ Exportación completada:', filePath);
            
            return {
                success: true,
                total: clientes.length,
                filePath: filePath,
                message: `Se exportaron ${clientes.length} clientes correctamente`
            };
            
        } catch (error) {
            console.error('❌ Error en exportación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = ImportadorExcel;
