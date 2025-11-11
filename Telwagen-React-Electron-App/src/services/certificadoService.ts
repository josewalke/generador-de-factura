import { apiClient, handleApiResponse } from './apiClient';

export interface CertificadoDigital {
  CommonName: string;
  Subject: string;
  CIF?: string;
  IsValid: boolean;
  NotBefore?: string;
  NotAfter?: string;
  DaysUntilExpiry?: number;
  SerialNumber?: string;
  Thumbprint?: string;
  Issuer?: string;
  Algorithm?: string;
  Hash?: string;
  Type?: string;
  // Campos del backend
  empresa?: string;
  cif?: string;
  isValido?: boolean;
  validoDesde?: string;
  validoHasta?: string;
  diasRestantes?: number;
  serial?: string;
  thumbprint?: string;
  sujeto?: string;
}

export interface CertificadosResponse {
  success: boolean;
  certificados: CertificadoDigital[];
  total: number;
  error?: string;
}

class CertificadoService {
  // Extraer nombre de organización del Subject del certificado
  private extraerNombreOrganizacion(subject: string): string {
    if (!subject) return 'Organización no disponible';
    
    try {
      // Buscar el campo O= (Organization) en el Subject
      const orgMatch = subject.match(/O=([^,]+)/);
      if (orgMatch && orgMatch[1]) {
        return orgMatch[1].trim();
      }
      
      // Si no hay O=, buscar en el CN= (Common Name) y extraer solo la parte de organización
      const cnMatch = subject.match(/CN=([^,]+)/);
      if (cnMatch && cnMatch[1]) {
        const cn = cnMatch[1].trim();
        // Si contiene paréntesis, tomar la parte antes del paréntesis
        const beforeParenthesis = cn.split('(')[0].trim();
        if (beforeParenthesis && beforeParenthesis !== cn) {
          return beforeParenthesis;
        }
        return cn;
      }
      
      return 'Organización no disponible';
    } catch (error) {
      console.error('Error al extraer nombre de organización:', error);
      return 'Organización no disponible';
    }
  }

  // Mapear datos del backend al formato del frontend
  private mapearCertificado(certificadoBackend: any): CertificadoDigital {
    console.log('🔐 [certificadoService] Extrayendo nombre de organización...');
    console.log('🔐 [certificadoService] Subject original:', certificadoBackend.sujeto);
    
    const nombreOrganizacion = this.extraerNombreOrganizacion(certificadoBackend.sujeto);
    console.log('🔐 [certificadoService] Nombre de organización extraído:', nombreOrganizacion);
    
    // Calcular fechas si no están disponibles pero tenemos días restantes
    let fechaDesde = certificadoBackend.validoDesde;
    let fechaHasta = certificadoBackend.validoHasta;
    
    if ((!fechaDesde || !fechaHasta) && certificadoBackend.diasRestantes) {
      const hoy = new Date();
      const diasRestantes = certificadoBackend.diasRestantes;
      
      // Calcular fecha de vencimiento (hoy + días restantes)
      const fechaVencimiento = new Date(hoy);
      fechaVencimiento.setDate(hoy.getDate() + diasRestantes);
      
      // Si no tenemos fecha de inicio, calcular hacia atrás desde hoy
      if (!fechaDesde) {
        // Asumir que el certificado empezó hace aproximadamente 1 año
        // (certificados suelen durar 1-2 años)
        const fechaInicio = new Date(hoy);
        fechaInicio.setFullYear(hoy.getFullYear() - 1);
        fechaDesde = fechaInicio.toISOString();
      }
      
      if (!fechaHasta) {
        fechaHasta = fechaVencimiento.toISOString();
      }
      
      console.log('🔐 [certificadoService] Fechas calculadas:', {
        hoy: hoy.toISOString(),
        fechaDesde,
        fechaHasta,
        diasRestantes: certificadoBackend.diasRestantes,
        fechaVencimiento: fechaVencimiento.toISOString()
      });
    }
    
    return {
      // Campos del frontend (mapeados desde el backend)
      CommonName: nombreOrganizacion,
      Subject: certificadoBackend.sujeto || '',
      CIF: certificadoBackend.cif || '',
      IsValid: certificadoBackend.isValido || false,
      NotBefore: fechaDesde || null,
      NotAfter: fechaHasta || null,
      DaysUntilExpiry: certificadoBackend.diasRestantes || 0,
      SerialNumber: certificadoBackend.serial || certificadoBackend.thumbprint || '',
      Thumbprint: certificadoBackend.thumbprint || '',
      // Campos originales del backend (para referencia)
      empresa: certificadoBackend.empresa,
      cif: certificadoBackend.cif,
      isValido: certificadoBackend.isValido,
      validoDesde: certificadoBackend.validoDesde,
      validoHasta: certificadoBackend.validoHasta,
      diasRestantes: certificadoBackend.diasRestantes,
      serial: certificadoBackend.serial,
      thumbprint: certificadoBackend.thumbprint,
      sujeto: certificadoBackend.sujeto
    };
  }

  // Obtener certificados disponibles en Windows
  async getCertificadosDisponibles(): Promise<CertificadosResponse> {
    try {
      console.log('🔐 [certificadoService] Obteniendo certificados disponibles...');
      const response = await apiClient.get('/api/firma-digital/certificados-windows');
      console.log('🔐 [certificadoService] Respuesta completa del servidor:', response);
      console.log('🔐 [certificadoService] Status:', response.status);
      console.log('🔐 [certificadoService] Headers:', response.headers);
      console.log('🔐 [certificadoService] Data completa:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.certificados) {
        console.log('🔐 [certificadoService] Número de certificados encontrados:', response.data.certificados.length);
        
        // Mapear certificados del backend al formato del frontend
        const certificadosMapeados = response.data.certificados.map((cert: any) => this.mapearCertificado(cert));
        
        certificadosMapeados.forEach((cert: CertificadoDigital, index: number) => {
          console.log(`🔐 [certificadoService] Certificado ${index + 1} mapeado:`, {
            CommonName: cert.CommonName,
            Subject: cert.Subject,
            CIF: cert.CIF,
            IsValid: cert.IsValid,
            NotBefore: cert.NotBefore,
            NotAfter: cert.NotAfter,
            DaysUntilExpiry: cert.DaysUntilExpiry,
            SerialNumber: cert.SerialNumber,
            Thumbprint: cert.Thumbprint
          });
        });
        
        // Devolver los datos mapeados
        return {
          success: response.data.success,
          certificados: certificadosMapeados,
          total: response.data.total
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('🔐 [certificadoService] Error al obtener certificados:', error);
      console.error('🔐 [certificadoService] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // Obtener información del certificado actual
  async getInformacionCertificado(): Promise<any> {
    try {
      console.log('🔐 [certificadoService] Obteniendo información del certificado actual...');
      const response = await apiClient.get('/api/firma-digital/certificado');
      console.log('🔐 [certificadoService] Información del certificado:', response.data);
      return handleApiResponse(response);
    } catch (error) {
      console.error('🔐 [certificadoService] Error al obtener información del certificado:', error);
      throw error;
    }
  }

  // Asociar certificado con empresa
  async asociarCertificadoEmpresa(empresaId: string, certificadoData: any): Promise<any> {
    try {
      console.log('🔐 [certificadoService] Asociando certificado con empresa:', empresaId);
      const response = await apiClient.post('/api/firma-digital/asociar-certificado', {
        empresaId,
        certificado: certificadoData
      });
      console.log('🔐 [certificadoService] Certificado asociado:', response.data);
      return handleApiResponse(response);
    } catch (error) {
      console.error('🔐 [certificadoService] Error al asociar certificado:', error);
      throw error;
    }
  }
}

export const certificadoService = new CertificadoService();
export default certificadoService;
