/**
 * Servicio de Cifrado
 * Encapsula la lógica de negocio para cifrado/descifrado de datos
 */

class CifradoService {
    constructor(sistemaCifrado, sistemaLogsSeguridad) {
        this.sistemaCifrado = sistemaCifrado;
        this.sistemaLogsSeguridad = sistemaLogsSeguridad;
    }

    /**
     * Cifrar datos
     */
    async cifrar(datos, usuario, ipAddress) {
        try {
            const resultado = this.sistemaCifrado.cifrar(datos);
            
            // Registrar evento de cifrado
            if (this.sistemaLogsSeguridad) {
                await this.sistemaLogsSeguridad.registrarCifrado(
                    usuario.id,
                    usuario.username,
                    'cifrar',
                    'datos_sensibles',
                    ipAddress
                );
            }

            return resultado;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Descifrar datos
     */
    async descifrar(datosCifrados, usuario, ipAddress) {
        try {
            const resultado = this.sistemaCifrado.descifrar(datosCifrados);
            
            // Registrar evento de descifrado
            if (this.sistemaLogsSeguridad) {
                await this.sistemaLogsSeguridad.registrarCifrado(
                    usuario.id,
                    usuario.username,
                    'descifrar',
                    'datos_sensibles',
                    ipAddress
                );
            }

            return resultado;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CifradoService;


