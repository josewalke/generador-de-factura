class ValidacionService {
    constructor(sistemaValidacionFiscal) {
        this.sistemaValidacionFiscal = sistemaValidacionFiscal;
    }

    /**
     * Validar NIF
     */
    validarNIF(nif) {
        return this.sistemaValidacionFiscal.validarNIF(nif);
    }

    /**
     * Validar CIF
     */
    validarCIF(cif) {
        return this.sistemaValidacionFiscal.validarCIF(cif);
    }

    /**
     * Validar NIE
     */
    validarNIE(nie) {
        return this.sistemaValidacionFiscal.validarNIE(nie);
    }

    /**
     * Validar identificación fiscal (NIF, CIF o NIE)
     */
    validarIdentificacionFiscal(identificacion) {
        return this.sistemaValidacionFiscal.validarIdentificacionFiscal(identificacion);
    }

    /**
     * Validar código de país
     */
    validarCodigoPais(codigo) {
        return this.sistemaValidacionFiscal.validarCodigoPais(codigo);
    }

    /**
     * Validar provincia
     */
    validarProvincia(provincia) {
        return this.sistemaValidacionFiscal.validarProvincia(provincia);
    }

    /**
     * Validar datos fiscales de cliente
     */
    validarDatosFiscalesCliente(datos) {
        return this.sistemaValidacionFiscal.validarDatosFiscalesCliente(datos);
    }

    /**
     * Validar datos fiscales de empresa
     */
    validarDatosFiscalesEmpresa(datos) {
        return this.sistemaValidacionFiscal.validarDatosFiscalesEmpresa(datos);
    }

    /**
     * Obtener lista de países
     */
    obtenerPaises() {
        return this.sistemaValidacionFiscal.obtenerPaises();
    }

    /**
     * Obtener lista de provincias de España
     */
    obtenerProvinciasEspana() {
        return this.sistemaValidacionFiscal.obtenerProvinciasEspana();
    }

    /**
     * Obtener lista de regímenes fiscales
     */
    obtenerRegimenesFiscales() {
        return this.sistemaValidacionFiscal.obtenerRegimenesFiscales();
    }
}

module.exports = ValidacionService;



