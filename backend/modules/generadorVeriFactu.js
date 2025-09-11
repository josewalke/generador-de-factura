const xml2js = require('xml2js');

/**
 * Generador XML VeriFactu para cumplir con la Ley Antifraude
 * Genera el formato XML requerido por la AEAT para el envío de registros
 */
class GeneradorVeriFactu {
    constructor() {
        this.builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            renderOpts: { pretty: true, indent: '  ', newline: '\n' }
        });
    }

    /**
     * Genera XML VeriFactu para una factura
     * @param {Object} datosFactura - Datos completos de la factura
     * @returns {string} XML VeriFactu
     */
    generarXMLVeriFactu(datosFactura) {
        try {
            const xmlData = {
                VeriFactu: {
                    $: {
                        'xmlns': 'http://www.agenciatributaria.gob.es/VeriFactu',
                        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                        'xsi:schemaLocation': 'http://www.agenciatributaria.gob.es/VeriFactu VeriFactu.xsd'
                    },
                    Cabecera: {
                        Version: '1.0',
                        FechaGeneracion: new Date().toISOString(),
                        NumeroRegistros: '1'
                    },
                    Registro: {
                        $: {
                            Id: datosFactura.numero_serie
                        },
                        Factura: {
                            NumeroFactura: datosFactura.numero_factura,
                            FechaEmision: this.formatearFecha(datosFactura.fecha_emision),
                            FechaOperacion: this.formatearFecha(datosFactura.fecha_operacion || datosFactura.fecha_emision),
                            TipoDocumento: datosFactura.tipo_documento || 'factura',
                            MetodoPago: datosFactura.metodo_pago || 'transferencia',
                            ReferenciaOperacion: datosFactura.referencia_operacion || '',
                            HashDocumento: datosFactura.hash_documento,
                            SelladoTemporal: datosFactura.sellado_temporal
                        },
                        Emisor: {
                            Identificacion: {
                                Tipo: 'CIF',
                                Numero: datosFactura.empresa_cif
                            },
                            Nombre: datosFactura.empresa_nombre,
                            Direccion: {
                                Calle: this.extraerCalle(datosFactura.empresa_direccion),
                                CodigoPostal: datosFactura.empresa_codigo_postal || '',
                                Provincia: datosFactura.empresa_provincia || '',
                                Pais: datosFactura.empresa_pais || 'España',
                                CodigoPais: datosFactura.empresa_codigo_pais || 'ES'
                            },
                            RegimenFiscal: datosFactura.empresa_regimen_fiscal || 'general'
                        },
                        Receptor: {
                            Identificacion: {
                                Tipo: this.obtenerTipoIdentificacion(datosFactura.cliente_identificacion),
                                Numero: datosFactura.cliente_identificacion
                            },
                            Nombre: datosFactura.cliente_nombre,
                            Direccion: {
                                Calle: this.extraerCalle(datosFactura.cliente_direccion),
                                CodigoPostal: datosFactura.cliente_codigo_postal || '',
                                Provincia: datosFactura.cliente_provincia || '',
                                Pais: datosFactura.cliente_pais || 'España',
                                CodigoPais: datosFactura.cliente_codigo_pais || 'ES'
                            },
                            RegimenFiscal: datosFactura.cliente_regimen_fiscal || 'general'
                        },
                        Detalles: {
                            Detalle: datosFactura.detalles ? datosFactura.detalles.map(detalle => ({
                                Cantidad: detalle.cantidad,
                                Descripcion: detalle.descripcion,
                                PrecioUnitario: detalle.precio_unitario,
                                Subtotal: detalle.subtotal,
                                TipoImpuesto: detalle.tipo_impuesto || 'IGIC',
                                ImporteImpuesto: detalle.igic,
                                Total: detalle.total
                            })) : []
                        },
                        Totales: {
                            BaseImponible: datosFactura.subtotal,
                            ImporteImpuesto: datosFactura.igic,
                            Total: datosFactura.total
                        }
                    }
                }
            };

            return this.builder.buildObject(xmlData);
        } catch (error) {
            console.error('❌ Error al generar XML VeriFactu:', error);
            throw new Error('Error al generar XML VeriFactu');
        }
        }

    /**
     * Valida el XML VeriFactu generado
     * @param {string} xmlContent - Contenido XML
     * @returns {Object} Resultado de la validación
     */
    validarXMLVeriFactu(xmlContent) {
        try {
            const parser = new xml2js.Parser();
            let errores = [];
            let advertencias = [];

            parser.parseString(xmlContent, (err, result) => {
                if (err) {
                    errores.push(`Error de sintaxis XML: ${err.message}`);
                    return;
                }

                // Validaciones específicas VeriFactu
                if (!result.VeriFactu) {
                    errores.push('Elemento VeriFactu no encontrado');
                }

                if (!result.VeriFactu.Registro) {
                    errores.push('Elemento Registro no encontrado');
                }

                if (!result.VeriFactu.Registro[0].Factura) {
                    errores.push('Elemento Factura no encontrado');
                }

                // Validar campos obligatorios
                const factura = result.VeriFactu.Registro[0].Factura[0];
                if (!factura.NumeroFactura) {
                    errores.push('NumeroFactura es obligatorio');
                }

                if (!factura.FechaEmision) {
                    errores.push('FechaEmision es obligatoria');
                }

                if (!factura.HashDocumento) {
                    errores.push('HashDocumento es obligatorio');
                }

                if (!factura.SelladoTemporal) {
                    errores.push('SelladoTemporal es obligatorio');
                }
            });

            return {
                valido: errores.length === 0,
                errores,
                advertencias
            };
        } catch (error) {
            console.error('❌ Error al validar XML VeriFactu:', error);
            return {
                valido: false,
                errores: [`Error de validación: ${error.message}`],
                advertencias: []
            };
        }
    }

    /**
     * Formatea fecha para XML VeriFactu
     * @param {string} fecha - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    formatearFecha(fecha) {
        try {
            const date = new Date(fecha);
            return date.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Extrae la calle de una dirección completa
     * @param {string} direccion - Dirección completa
     * @returns {string} Calle extraída
     */
    extraerCalle(direccion) {
        if (!direccion) return '';
        
        // Separar por saltos de línea y tomar la primera línea
        const lineas = direccion.split('\n');
        return lineas[0] || direccion;
    }

    /**
     * Determina el tipo de identificación basado en el formato
     * @param {string} identificacion - Número de identificación
     * @returns {string} Tipo de identificación
     */
    obtenerTipoIdentificacion(identificacion) {
        if (!identificacion) return 'NIF';
        
        const identificacionUpper = identificacion.toUpperCase();
        
        if (identificacionUpper.startsWith('B') || identificacionUpper.startsWith('A') || identificacionUpper.startsWith('G')) {
            return 'CIF';
        } else if (identificacionUpper.startsWith('X') || identificacionUpper.startsWith('Y') || identificacionUpper.startsWith('Z')) {
            return 'NIE';
        } else {
            return 'NIF';
        }
    }

    /**
     * Genera código de respuesta simulado de la AEAT
     * @param {string} xmlContent - Contenido XML enviado
     * @returns {Object} Respuesta simulada de la AEAT
     */
    generarRespuestaAEAT(xmlContent) {
        try {
            // Simular respuesta de la AEAT
            const codigoRespuesta = Math.random() > 0.1 ? '0000' : '1001'; // 90% éxito
            const mensaje = codigoRespuesta === '0000' ? 'Registro aceptado' : 'Error en validación';
            
            return {
                codigo: codigoRespuesta,
                mensaje: mensaje,
                timestamp: new Date().toISOString(),
                numeroRegistro: `AEAT-${Date.now()}`,
                valido: codigoRespuesta === '0000'
            };
        } catch (error) {
            console.error('❌ Error al generar respuesta AEAT:', error);
            return {
                codigo: '9999',
                mensaje: 'Error interno',
                timestamp: new Date().toISOString(),
                numeroRegistro: null,
                valido: false
            };
        }
    }
}

module.exports = GeneradorVeriFactu;
