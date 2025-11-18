import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
}

export interface EmpresaExcelData {
  'Nombre Empresa': string;
  'CIF': string;
  'Dirección': string;
  'Teléfono': string;
  'Email': string;
  'Certificado Digital': string;
  'Certificado Asignado': string;
  'Fecha Creación': string;
}

export interface CocheExcelData {
  'Matrícula': string;
  'Modelo': string;
  'Color': string;
  'Chasis': string;
  'Kms': number;
  'Estado': string;
  'Fecha Creación': string;
}

export interface CertificadoExcelData {
  'Nombre Organización': string;
  'CIF': string;
  'Estado': string;
  'Válido Desde': string;
  'Válido Hasta': string;
  'Días Restantes': number;
  'Serial Number': string;
  'Thumbprint': string;
  'Tipo': string;
  'Algoritmo': string;
}

class ExcelService {
  // Exportar empresas a Excel
  exportEmpresas(empresas: any[], options: ExcelExportOptions = {}): void {
    try {
      console.log('📊 [excelService] Exportando empresas a Excel...');
      console.log('📊 [excelService] Número de empresas:', empresas.length);
      
      const excelData: EmpresaExcelData[] = empresas.map(empresa => ({
        'Nombre Empresa': empresa.nombre || 'N/A',
        'CIF': empresa.cif || 'N/A',
        'Dirección': empresa.direccion || 'N/A',
        'Teléfono': empresa.telefono || 'N/A',
        'Email': empresa.email || 'N/A',
        'Certificado Digital': empresa.certificadoDigital ? 'Sí' : 'No',
        'Certificado Asignado': empresa.certificadoAsignado?.CommonName || 'No asignado',
        'Fecha Creación': empresa.fecha_creacion ? new Date(empresa.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'
      }));

      this.exportToExcel(excelData, {
        filename: options.filename || 'empresas',
        sheetName: options.sheetName || 'Empresas',
        includeHeaders: options.includeHeaders !== false
      });
      
      console.log('📊 [excelService] Exportación de empresas completada');
    } catch (error) {
      console.error('📊 [excelService] Error al exportar empresas:', error);
      throw error;
    }
  }

  // Exportar coches a Excel
  exportCoches(coches: any[], options: ExcelExportOptions = {}): void {
    try {
      console.log('📊 [excelService] Exportando coches a Excel...');
      console.log('📊 [excelService] Número de coches:', coches.length);
      
      const excelData: CocheExcelData[] = coches.map(coche => ({
        'Matrícula': coche.matricula || 'N/A',
        'Modelo': coche.modelo || 'N/A',
        'Color': coche.color || 'N/A',
        'Chasis': coche.chasis || 'N/A',
        'Kms': coche.kms || 0,
        'Estado': coche.vendido ? 'Vendido' : 'Disponible',
        'Fecha Creación': coche.fecha_creacion ? new Date(coche.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'
      }));

      this.exportToExcel(excelData, {
        filename: options.filename || 'coches',
        sheetName: options.sheetName || 'Coches',
        includeHeaders: options.includeHeaders !== false
      });
      
      console.log('📊 [excelService] Exportación de coches completada');
    } catch (error) {
      console.error('📊 [excelService] Error al exportar coches:', error);
      throw error;
    }
  }

  // Exportar certificados a Excel
  exportCertificados(certificados: any[], options: ExcelExportOptions = {}): void {
    try {
      console.log('📊 [excelService] Exportando certificados a Excel...');
      console.log('📊 [excelService] Número de certificados:', certificados.length);
      
      const excelData: CertificadoExcelData[] = certificados.map(certificado => ({
        'Nombre Organización': certificado.CommonName || 'N/A',
        'CIF': certificado.CIF || 'N/A',
        'Estado': certificado.IsValid ? 'Válido' : 'Inválido',
        'Válido Desde': certificado.NotBefore ? new Date(certificado.NotBefore).toLocaleDateString('es-ES') : 'N/A',
        'Válido Hasta': certificado.NotAfter ? new Date(certificado.NotAfter).toLocaleDateString('es-ES') : 'N/A',
        'Días Restantes': certificado.DaysUntilExpiry || 0,
        'Serial Number': certificado.SerialNumber || 'N/A',
        'Thumbprint': certificado.Thumbprint || 'N/A',
        'Tipo': certificado.tipo || 'N/A',
        'Algoritmo': certificado.algoritmo || 'N/A'
      }));

      this.exportToExcel(excelData, {
        filename: options.filename || 'certificados',
        sheetName: options.sheetName || 'Certificados',
        includeHeaders: options.includeHeaders !== false
      });
      
      console.log('📊 [excelService] Exportación de certificados completada');
    } catch (error) {
      console.error('📊 [excelService] Error al exportar certificados:', error);
      throw error;
    }
  }

  // Función genérica para exportar a Excel
  private exportToExcel(data: any[], options: ExcelExportOptions): void {
    try {
      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Crear hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Configurar ancho de columnas
      const columnWidths = this.calculateColumnWidths(data);
      worksheet['!cols'] = columnWidths;
      
      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Datos');
      
      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${options.filename || 'export'}_${timestamp}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(workbook, filename);
      
      console.log('📊 [excelService] Archivo Excel generado:', filename);
    } catch (error) {
      console.error('📊 [excelService] Error al generar archivo Excel:', error);
      throw error;
    }
  }

  // Calcular ancho de columnas automáticamente
  private calculateColumnWidths(data: any[]): any[] {
    if (data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    return columns.map(column => {
      const maxLength = Math.max(
        column.length, // Longitud del encabezado
        ...data.map(row => String(row[column] || '').length) // Longitud máxima de datos
      );
      
      // Limitar el ancho entre 10 y 50 caracteres
      return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
  }

  // Exportar datos combinados (empresas + certificados + coches)
  exportDatosCompletos(empresas: any[], certificados: any[], coches: any[], options: ExcelExportOptions = {}): void {
    try {
      console.log('📊 [excelService] Exportando datos completos a Excel...');
      
      const workbook = XLSX.utils.book_new();
      
      // Hoja de empresas
      const empresasData: EmpresaExcelData[] = empresas.map(empresa => ({
        'Nombre Empresa': empresa.nombre || 'N/A',
        'CIF': empresa.cif || 'N/A',
        'Dirección': empresa.direccion || 'N/A',
        'Teléfono': empresa.telefono || 'N/A',
        'Email': empresa.email || 'N/A',
        'Certificado Digital': empresa.certificadoDigital ? 'Sí' : 'No',
        'Certificado Asignado': empresa.certificadoAsignado?.CommonName || 'No asignado',
        'Fecha Creación': empresa.fecha_creacion ? new Date(empresa.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'
      }));
      
      const empresasSheet = XLSX.utils.json_to_sheet(empresasData);
      empresasSheet['!cols'] = this.calculateColumnWidths(empresasData);
      XLSX.utils.book_append_sheet(workbook, empresasSheet, 'Empresas');
      
      // Hoja de certificados
      const certificadosData: CertificadoExcelData[] = certificados.map(certificado => ({
        'Nombre Organización': certificado.CommonName || 'N/A',
        'CIF': certificado.CIF || 'N/A',
        'Estado': certificado.IsValid ? 'Válido' : 'Inválido',
        'Válido Desde': certificado.NotBefore ? new Date(certificado.NotBefore).toLocaleDateString('es-ES') : 'N/A',
        'Válido Hasta': certificado.NotAfter ? new Date(certificado.NotAfter).toLocaleDateString('es-ES') : 'N/A',
        'Días Restantes': certificado.DaysUntilExpiry || 0,
        'Serial Number': certificado.SerialNumber || 'N/A',
        'Thumbprint': certificado.Thumbprint || 'N/A',
        'Tipo': certificado.tipo || 'N/A',
        'Algoritmo': certificado.algoritmo || 'N/A'
      }));
      
      const certificadosSheet = XLSX.utils.json_to_sheet(certificadosData);
      certificadosSheet['!cols'] = this.calculateColumnWidths(certificadosData);
      XLSX.utils.book_append_sheet(workbook, certificadosSheet, 'Certificados');
      
      // Hoja de coches
      const cochesData: CocheExcelData[] = coches.map(coche => ({
        'Matrícula': coche.matricula || 'N/A',
        'Modelo': coche.modelo || 'N/A',
        'Color': coche.color || 'N/A',
        'Chasis': coche.chasis || 'N/A',
        'Kms': coche.kms || 0,
        'Estado': coche.vendido ? 'Vendido' : 'Disponible',
        'Fecha Creación': coche.fecha_creacion ? new Date(coche.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'
      }));
      
      const cochesSheet = XLSX.utils.json_to_sheet(cochesData);
      cochesSheet['!cols'] = this.calculateColumnWidths(cochesData);
      XLSX.utils.book_append_sheet(workbook, cochesSheet, 'Coches');
      
      // Generar archivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${options.filename || 'datos_completos'}_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      console.log('📊 [excelService] Archivo Excel completo generado:', filename);
    } catch (error) {
      console.error('📊 [excelService] Error al exportar datos completos:', error);
      throw error;
    }
  }

  // Importar coches desde archivo Excel
  async importCoches(file: File): Promise<{ success: boolean; importados: number; errores: number; erroresDetalle?: any[] }> {
    try {
      console.log('📥 [excelService] Importando coches desde Excel...');
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('archivo', file);
      
      // Importar desde apiClient
      const { apiClient } = await import('./apiClient');
      const response = await apiClient.post('/api/importar/coches', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const result = response.data;
      console.log('📥 [excelService] Resultado de importación:', result);
      
      return {
        success: result.success || false,
        importados: result.importados || 0,
        errores: result.errores || 0,
        erroresDetalle: result.erroresDetalle || []
      };
    } catch (error: any) {
      console.error('📥 [excelService] Error al importar coches:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al importar coches');
    }
  }
}

export const excelService = new ExcelService();
export default excelService;
