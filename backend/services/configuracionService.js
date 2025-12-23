class ConfiguracionService {
    constructor(configuracionEmpresa) {
        this.configuracionEmpresa = configuracionEmpresa;
    }

    /**
     * Obtener configuración de empresa
     */
    getEmpresa() {
        if (this.configuracionEmpresa) {
            return {
                success: true,
                data: this.configuracionEmpresa
            };
        } else {
            return {
                success: false,
                error: 'Configuración de empresa no disponible'
            };
        }
    }
}

module.exports = ConfiguracionService;

