/**
 * Controlador de Cifrado
 * Maneja las peticiones HTTP relacionadas con cifrado/descifrado
 */

class CifradoController {
    constructor(cifradoService) {
        this.cifradoService = cifradoService;
    }

    /**
     * POST /api/cifrado/cifrar
     */
    async cifrar(req, res) {
        try {
            const { datos } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            const resultado = await this.cifradoService.cifrar(datos, req.usuario, ipAddress);

            res.json({ success: true, data: resultado });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * POST /api/cifrado/descifrar
     */
    async descifrar(req, res) {
        try {
            const { datosCifrados } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            const resultado = await this.cifradoService.descifrar(datosCifrados, req.usuario, ipAddress);

            res.json({ success: true, data: resultado });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = CifradoController;


