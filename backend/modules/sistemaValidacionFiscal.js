/**
 * Sistema de Validación de Campos Fiscales
 * Valida formatos fiscales según normativa española para cumplir con Ley Antifraude
 */
class SistemaValidacionFiscal {
    constructor() {
        this.paises = {
            'ES': 'España',
            'FR': 'Francia',
            'DE': 'Alemania',
            'IT': 'Italia',
            'PT': 'Portugal',
            'GB': 'Reino Unido',
            'US': 'Estados Unidos',
            'MX': 'México',
            'AR': 'Argentina',
            'BR': 'Brasil',
            'CL': 'Chile',
            'CO': 'Colombia',
            'PE': 'Perú',
            'VE': 'Venezuela',
            'UY': 'Uruguay',
            'PY': 'Paraguay',
            'BO': 'Bolivia',
            'EC': 'Ecuador',
            'CU': 'Cuba',
            'DO': 'República Dominicana',
            'GT': 'Guatemala',
            'HN': 'Honduras',
            'SV': 'El Salvador',
            'NI': 'Nicaragua',
            'CR': 'Costa Rica',
            'PA': 'Panamá',
            'JM': 'Jamaica',
            'TT': 'Trinidad y Tobago',
            'BB': 'Barbados',
            'BS': 'Bahamas',
            'CA': 'Canadá',
            'AU': 'Australia',
            'NZ': 'Nueva Zelanda',
            'JP': 'Japón',
            'CN': 'China',
            'IN': 'India',
            'RU': 'Rusia',
            'ZA': 'Sudáfrica',
            'EG': 'Egipto',
            'MA': 'Marruecos',
            'TN': 'Túnez',
            'DZ': 'Argelia',
            'LY': 'Libia',
            'SD': 'Sudán',
            'ET': 'Etiopía',
            'KE': 'Kenia',
            'NG': 'Nigeria',
            'GH': 'Ghana',
            'CI': 'Costa de Marfil',
            'SN': 'Senegal',
            'ML': 'Mali',
            'BF': 'Burkina Faso',
            'NE': 'Níger',
            'TD': 'Chad',
            'CM': 'Camerún',
            'CF': 'República Centroafricana',
            'CD': 'República Democrática del Congo',
            'CG': 'República del Congo',
            'GA': 'Gabón',
            'GQ': 'Guinea Ecuatorial',
            'ST': 'Santo Tomé y Príncipe',
            'AO': 'Angola',
            'ZM': 'Zambia',
            'ZW': 'Zimbabue',
            'BW': 'Botsuana',
            'NA': 'Namibia',
            'SZ': 'Suazilandia',
            'LS': 'Lesoto',
            'MG': 'Madagascar',
            'MU': 'Mauricio',
            'SC': 'Seychelles',
            'KM': 'Comoras',
            'DJ': 'Yibuti',
            'SO': 'Somalia',
            'ER': 'Eritrea',
            'SS': 'Sudán del Sur',
            'UG': 'Uganda',
            'RW': 'Ruanda',
            'BI': 'Burundi',
            'TZ': 'Tanzania',
            'MW': 'Malaui',
            'MZ': 'Mozambique',
            'MG': 'Madagascar',
            'RE': 'Reunión',
            'YT': 'Mayotte',
            'IO': 'Territorio Británico del Océano Índico',
            'SH': 'Santa Elena',
            'AC': 'Ascensión',
            'TA': 'Tristán de Acuña'
        };

        this.provinciasEspana = {
            '01': 'Álava',
            '02': 'Albacete',
            '03': 'Alicante',
            '04': 'Almería',
            '05': 'Ávila',
            '06': 'Badajoz',
            '07': 'Islas Baleares',
            '08': 'Barcelona',
            '09': 'Burgos',
            '10': 'Cáceres',
            '11': 'Cádiz',
            '12': 'Castellón',
            '13': 'Ciudad Real',
            '14': 'Córdoba',
            '15': 'A Coruña',
            '16': 'Cuenca',
            '17': 'Girona',
            '18': 'Granada',
            '19': 'Guadalajara',
            '20': 'Guipúzcoa',
            '21': 'Huelva',
            '22': 'Huesca',
            '23': 'Jaén',
            '24': 'León',
            '25': 'Lleida',
            '26': 'La Rioja',
            '27': 'Lugo',
            '28': 'Madrid',
            '29': 'Málaga',
            '30': 'Murcia',
            '31': 'Navarra',
            '32': 'Ourense',
            '33': 'Asturias',
            '34': 'Palencia',
            '35': 'Las Palmas',
            '36': 'Pontevedra',
            '37': 'Salamanca',
            '38': 'Santa Cruz de Tenerife',
            '39': 'Cantabria',
            '40': 'Segovia',
            '41': 'Sevilla',
            '42': 'Soria',
            '43': 'Tarragona',
            '44': 'Teruel',
            '45': 'Toledo',
            '46': 'Valencia',
            '47': 'Valladolid',
            '48': 'Vizcaya',
            '49': 'Zamora',
            '50': 'Zaragoza',
            '51': 'Ceuta',
            '52': 'Melilla'
        };

        this.regimenesFiscales = {
            'general': 'Régimen General',
            'simplificado': 'Régimen Simplificado',
            'agricola': 'Régimen Especial Agrario',
            'pesquero': 'Régimen Especial de la Pesca',
            'recargo': 'Régimen de Recargo de Equivalencia',
            'exento': 'Régimen de Exención',
            'no_sujeto': 'No Sujeto',
            'exportacion': 'Exportación',
            'importacion': 'Importación',
            'intracomunitario': 'Operaciones Intracomunitarias',
            'inversion': 'Régimen de Inversión del Sujeto Pasivo'
        };
    }

    /**
     * Valida un NIF español
     */
    validarNIF(nif) {
        if (!nif || typeof nif !== 'string') {
            return { valido: false, error: 'NIF es requerido' };
        }

        // Limpiar el NIF
        const nifLimpio = nif.replace(/[-\s]/g, '').toUpperCase();
        
        // Verificar formato básico
        if (!/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(nifLimpio)) {
            return { valido: false, error: 'Formato de NIF inválido' };
        }

        // Extraer número y letra
        const numero = nifLimpio.substring(0, 8);
        const letra = nifLimpio.substring(8, 9);

        // Calcular letra correcta
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        const resto = parseInt(numero) % 23;
        const letraCorrecta = letras[resto];

        if (letra !== letraCorrecta) {
            return { valido: false, error: 'Letra de control incorrecta' };
        }

        return { valido: true, nif: nifLimpio };
    }

    /**
     * Valida un CIF español
     */
    validarCIF(cif) {
        if (!cif || typeof cif !== 'string') {
            return { valido: false, error: 'CIF es requerido' };
        }

        // Limpiar el CIF
        const cifLimpio = cif.replace(/[-\s]/g, '').toUpperCase();
        
        // Verificar formato básico
        if (!/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(cifLimpio)) {
            return { valido: false, error: 'Formato de CIF inválido' };
        }

        // Extraer componentes
        const tipo = cifLimpio.substring(0, 1);
        const numero = cifLimpio.substring(1, 8);
        const control = cifLimpio.substring(8, 9);

        // Calcular dígito de control
        let suma = 0;
        for (let i = 0; i < numero.length; i++) {
            let digito = parseInt(numero[i]);
            if (i % 2 === 1) {
                digito *= 2;
                if (digito > 9) {
                    digito = Math.floor(digito / 10) + (digito % 10);
                }
            }
            suma += digito;
        }

        const resto = suma % 10;
        let controlCalculado;

        if (['A', 'B', 'E', 'H'].includes(tipo)) {
            controlCalculado = resto === 0 ? '0' : (10 - resto).toString();
        } else if (['C', 'D', 'F', 'G', 'J', 'U', 'V'].includes(tipo)) {
            controlCalculado = resto === 0 ? '0' : (10 - resto).toString();
        } else if (['N', 'P', 'Q', 'R', 'S', 'W'].includes(tipo)) {
            const letras = 'JABCDEFGHI';
            controlCalculado = letras[resto];
        }

        if (control !== controlCalculado) {
            return { valido: false, error: 'Dígito de control incorrecto' };
        }

        return { valido: true, cif: cifLimpio };
    }

    /**
     * Valida un NIE español
     */
    validarNIE(nie) {
        if (!nie || typeof nie !== 'string') {
            return { valido: false, error: 'NIE es requerido' };
        }

        // Limpiar el NIE
        const nieLimpio = nie.replace(/[-\s]/g, '').toUpperCase();
        
        // Verificar formato básico
        if (!/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(nieLimpio)) {
            return { valido: false, error: 'Formato de NIE inválido' };
        }

        // Convertir primera letra a número
        const letraInicial = nieLimpio.substring(0, 1);
        const numero = nieLimpio.substring(1, 8);
        const letra = nieLimpio.substring(8, 9);

        const conversiones = { 'X': '0', 'Y': '1', 'Z': '2' };
        const numeroCompleto = conversiones[letraInicial] + numero;

        // Calcular letra correcta
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        const resto = parseInt(numeroCompleto) % 23;
        const letraCorrecta = letras[resto];

        if (letra !== letraCorrecta) {
            return { valido: false, error: 'Letra de control incorrecta' };
        }

        return { valido: true, nie: nieLimpio };
    }

    /**
     * Valida cualquier tipo de identificación fiscal española
     */
    validarIdentificacionFiscal(identificacion) {
        if (!identificacion || typeof identificacion !== 'string') {
            return { valido: false, error: 'Identificación fiscal es requerida' };
        }

        const identificacionLimpia = identificacion.replace(/[-\s]/g, '').toUpperCase();

        // Determinar tipo y validar
        if (/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(identificacionLimpia)) {
            return { ...this.validarNIF(identificacion), tipo: 'NIF' };
        } else if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(identificacionLimpia)) {
            return { ...this.validarCIF(identificacion), tipo: 'CIF' };
        } else if (/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(identificacionLimpia)) {
            return { ...this.validarNIE(identificacion), tipo: 'NIE' };
        } else {
            return { valido: false, error: 'Formato de identificación fiscal no reconocido' };
        }
    }

    /**
     * Valida un código de país ISO 3166-1
     */
    validarCodigoPais(codigo) {
        if (!codigo || typeof codigo !== 'string') {
            return { valido: false, error: 'Código de país es requerido' };
        }

        const codigoLimpio = codigo.toUpperCase();
        
        if (!/^[A-Z]{2}$/.test(codigoLimpio)) {
            return { valido: false, error: 'Código de país debe tener 2 letras' };
        }

        if (!this.paises[codigoLimpio]) {
            return { valido: false, error: 'Código de país no válido' };
        }

        return { 
            valido: true, 
            codigo: codigoLimpio, 
            nombre: this.paises[codigoLimpio] 
        };
    }

    /**
     * Valida una provincia española
     */
    validarProvincia(provincia) {
        if (!provincia || typeof provincia !== 'string') {
            return { valido: false, error: 'Provincia es requerida' };
        }

        const provinciaLimpia = provincia.trim();
        
        // Buscar por código
        const codigoProvincia = Object.keys(this.provinciasEspana).find(
            codigo => this.provinciasEspana[codigo].toLowerCase() === provinciaLimpia.toLowerCase()
        );

        if (codigoProvincia) {
            return { 
                valido: true, 
                provincia: this.provinciasEspana[codigoProvincia],
                codigo: codigoProvincia
            };
        }

        // Buscar por nombre parcial
        const provinciasEncontradas = Object.entries(this.provinciasEspana).filter(
            ([codigo, nombre]) => nombre.toLowerCase().includes(provinciaLimpia.toLowerCase())
        );

        if (provinciasEncontradas.length === 1) {
            const [codigo, nombre] = provinciasEncontradas[0];
            return { 
                valido: true, 
                provincia: nombre,
                codigo: codigo
            };
        }

        return { valido: false, error: 'Provincia no válida' };
    }

    /**
     * Valida un régimen fiscal
     */
    validarRegimenFiscal(regimen) {
        if (!regimen || typeof regimen !== 'string') {
            return { valido: false, error: 'Régimen fiscal es requerido' };
        }

        const regimenLimpio = regimen.toLowerCase().trim();
        
        if (!this.regimenesFiscales[regimenLimpio]) {
            return { valido: false, error: 'Régimen fiscal no válido' };
        }

        return { 
            valido: true, 
            regimen: regimenLimpio,
            descripcion: this.regimenesFiscales[regimenLimpio]
        };
    }

    /**
     * Valida un código postal español
     */
    validarCodigoPostal(codigoPostal) {
        if (!codigoPostal || typeof codigoPostal !== 'string') {
            return { valido: false, error: 'Código postal es requerido' };
        }

        const codigoLimpio = codigoPostal.replace(/[-\s]/g, '');
        
        if (!/^[0-9]{5}$/.test(codigoLimpio)) {
            return { valido: false, error: 'Código postal debe tener 5 dígitos' };
        }

        // Validar rango de códigos postales españoles
        const codigoNumero = parseInt(codigoLimpio);
        if (codigoNumero < 1000 || codigoNumero > 52999) {
            return { valido: false, error: 'Código postal fuera del rango válido' };
        }

        return { valido: true, codigo: codigoLimpio };
    }

    /**
     * Valida datos fiscales completos de un cliente
     */
    validarDatosFiscalesCliente(datos) {
        const errores = [];
        const datosValidados = {};

        // Validar identificación fiscal
        if (datos.identificacion) {
            const validacionIdentificacion = this.validarIdentificacionFiscal(datos.identificacion);
            if (!validacionIdentificacion.valido) {
                errores.push(`Identificación fiscal: ${validacionIdentificacion.error}`);
            } else {
                datosValidados.identificacion = validacionIdentificacion;
            }
        }

        // Validar tipo de identificación
        if (datos.tipo_identificacion) {
            const tiposValidos = ['NIF', 'CIF', 'NIE'];
            if (!tiposValidos.includes(datos.tipo_identificacion)) {
                errores.push('Tipo de identificación debe ser NIF, CIF o NIE');
            } else {
                datosValidados.tipo_identificacion = datos.tipo_identificacion;
            }
        }

        // Validar código de país
        if (datos.codigo_pais) {
            const validacionPais = this.validarCodigoPais(datos.codigo_pais);
            if (!validacionPais.valido) {
                errores.push(`Código de país: ${validacionPais.error}`);
            } else {
                datosValidados.codigo_pais = validacionPais;
            }
        }

        // Validar provincia (solo para España)
        if (datos.provincia && datos.codigo_pais === 'ES') {
            const validacionProvincia = this.validarProvincia(datos.provincia);
            if (!validacionProvincia.valido) {
                errores.push(`Provincia: ${validacionProvincia.error}`);
            } else {
                datosValidados.provincia = validacionProvincia;
            }
        }

        // Validar régimen fiscal
        if (datos.regimen_fiscal) {
            const validacionRegimen = this.validarRegimenFiscal(datos.regimen_fiscal);
            if (!validacionRegimen.valido) {
                errores.push(`Régimen fiscal: ${validacionRegimen.error}`);
            } else {
                datosValidados.regimen_fiscal = validacionRegimen;
            }
        }

        return {
            valido: errores.length === 0,
            errores,
            datosValidados
        };
    }

    /**
     * Valida datos fiscales completos de una empresa
     */
    validarDatosFiscalesEmpresa(datos) {
        const errores = [];
        const datosValidados = {};

        // Validar CIF (empresas españolas)
        if (datos.cif) {
            const validacionCIF = this.validarCIF(datos.cif);
            if (!validacionCIF.valido) {
                errores.push(`CIF: ${validacionCIF.error}`);
            } else {
                datosValidados.cif = validacionCIF;
            }
        }

        // Validar código de país
        if (datos.codigo_pais) {
            const validacionPais = this.validarCodigoPais(datos.codigo_pais);
            if (!validacionPais.valido) {
                errores.push(`Código de país: ${validacionPais.error}`);
            } else {
                datosValidados.codigo_pais = validacionPais;
            }
        }

        // Validar provincia (solo para España)
        if (datos.provincia && datos.codigo_pais === 'ES') {
            const validacionProvincia = this.validarProvincia(datos.provincia);
            if (!validacionProvincia.valido) {
                errores.push(`Provincia: ${validacionProvincia.error}`);
            } else {
                datosValidados.provincia = validacionProvincia;
            }
        }

        // Validar código postal
        if (datos.codigo_postal && datos.codigo_pais === 'ES') {
            const validacionCP = this.validarCodigoPostal(datos.codigo_postal);
            if (!validacionCP.valido) {
                errores.push(`Código postal: ${validacionCP.error}`);
            } else {
                datosValidados.codigo_postal = validacionCP;
            }
        }

        // Validar régimen fiscal
        if (datos.regimen_fiscal) {
            const validacionRegimen = this.validarRegimenFiscal(datos.regimen_fiscal);
            if (!validacionRegimen.valido) {
                errores.push(`Régimen fiscal: ${validacionRegimen.error}`);
            } else {
                datosValidados.regimen_fiscal = validacionRegimen;
            }
        }

        return {
            valido: errores.length === 0,
            errores,
            datosValidados
        };
    }

    /**
     * Obtiene información de países disponibles
     */
    obtenerPaises() {
        return this.paises;
    }

    /**
     * Obtiene información de provincias españolas
     */
    obtenerProvinciasEspana() {
        return this.provinciasEspana;
    }

    /**
     * Obtiene información de regímenes fiscales
     */
    obtenerRegimenesFiscales() {
        return this.regimenesFiscales;
    }
}

module.exports = SistemaValidacionFiscal;
