const ValidacionService = require('../services/validacionService');

class ValidacionController {
    constructor(sistemaValidacionFiscal, logger) {
        this.service = new ValidacionService(sistemaValidacionFiscal);
        this.logger = logger;
    }

    /**
     * POST /api/validacion/nif
     */
    validarNIF = async (req, res) => {
        try {
            const { nif } = req.body;
            const resultado = this.service.validarNIF(nif);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando NIF', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/cif
     */
    validarCIF = async (req, res) => {
        try {
            const { cif } = req.body;
            const resultado = this.service.validarCIF(cif);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando CIF', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/nie
     */
    validarNIE = async (req, res) => {
        try {
            const { nie } = req.body;
            const resultado = this.service.validarNIE(nie);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando NIE', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/identificacion
     */
    validarIdentificacion = async (req, res) => {
        try {
            const { identificacion } = req.body;
            const resultado = this.service.validarIdentificacionFiscal(identificacion);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando identificación', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/pais
     */
    validarPais = async (req, res) => {
        try {
            const { codigo } = req.body;
            const resultado = this.service.validarCodigoPais(codigo);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando país', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/provincia
     */
    validarProvincia = async (req, res) => {
        try {
            const { provincia } = req.body;
            const resultado = this.service.validarProvincia(provincia);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando provincia', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/cliente
     */
    validarCliente = async (req, res) => {
        try {
            const datos = req.body;
            const resultado = this.service.validarDatosFiscalesCliente(datos);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando datos fiscales de cliente', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * POST /api/validacion/empresa
     */
    validarEmpresa = async (req, res) => {
        try {
            const datos = req.body;
            const resultado = this.service.validarDatosFiscalesEmpresa(datos);
            res.json({ success: true, data: resultado });
        } catch (error) {
            this.logger.error('Error validando datos fiscales de empresa', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * GET /api/validacion/paises
     */
    obtenerPaises = (req, res) => {
        try {
            const paises = this.service.obtenerPaises();
            res.json({
                success: true,
                data: paises
            });
        } catch (error) {
            this.logger.error('Error obteniendo países', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * GET /api/validacion/provincias
     */
    obtenerProvincias = (req, res) => {
        try {
            const provincias = this.service.obtenerProvinciasEspana();
            res.json({
                success: true,
                data: provincias
            });
        } catch (error) {
            this.logger.error('Error obteniendo provincias', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };

    /**
     * GET /api/validacion/regimenes
     */
    obtenerRegimenes = (req, res) => {
        try {
            const regimenes = this.service.obtenerRegimenesFiscales();
            res.json({
                success: true,
                data: regimenes
            });
        } catch (error) {
            this.logger.error('Error obteniendo regímenes fiscales', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };
}

module.exports = ValidacionController;



