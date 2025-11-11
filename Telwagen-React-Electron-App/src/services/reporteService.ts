import * as XLSX from 'xlsx';

export interface ReporteMensualData {
  mes: string;
  año: number;
  totalFacturas: number;
  totalIngresos: number;
  facturasPagadas: number;
  facturasPendientes: number;
  facturasVencidas: number;
  promedioFactura: number;
  crecimientoMensual: number;
}

export interface FacturaExportData {
  numero: string;
  fecha: string;
  cliente: string;
  empresa: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  productos: string; // Lista de productos separados por comas
}

class ReporteService {
  // Generar reporte mensual
  async generarReporteMensual(facturas: any[]): Promise<ReporteMensualData> {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear();
    
    // Filtrar facturas del mes actual
    const facturasMesActual = facturas.filter(factura => {
      const fechaFactura = new Date(factura.fecha);
      return fechaFactura.getMonth() + 1 === mesActual && 
             fechaFactura.getFullYear() === añoActual;
    });
    
    // Calcular estadísticas
    const totalFacturas = facturasMesActual.length;
    const totalIngresos = facturasMesActual.reduce((sum, f) => sum + f.total, 0);
    
    // LÓGICA CORREGIDA: Si existe una factura, significa que ya se pagó
    // Por lo tanto, todas las facturas existentes se consideran pagadas
    const facturasPagadas = totalFacturas; // Todas las facturas están pagadas
    const facturasPendientes = 0; // No hay facturas pendientes si existen
    const facturasVencidas = 0; // No hay facturas vencidas si existen
    
    const promedioFactura = totalFacturas > 0 ? totalIngresos / totalFacturas : 0;
    
    // Calcular crecimiento mensual (comparar con mes anterior)
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const añoAnterior = mesActual === 1 ? añoActual - 1 : añoActual;
    
    const facturasMesAnterior = facturas.filter(factura => {
      const fechaFactura = new Date(factura.fecha);
      return fechaFactura.getMonth() + 1 === mesAnterior && 
             fechaFactura.getFullYear() === añoAnterior;
    });
    
    const ingresosMesAnterior = facturasMesAnterior.reduce((sum, f) => sum + f.total, 0);
    const crecimientoMensual = ingresosMesAnterior > 0 
      ? ((totalIngresos - ingresosMesAnterior) / ingresosMesAnterior) * 100 
      : 0;
    
    return {
      mes: this.obtenerNombreMes(mesActual),
      año: añoActual,
      totalFacturas,
      totalIngresos,
      facturasPagadas,
      facturasPendientes,
      facturasVencidas,
      promedioFactura,
      crecimientoMensual
    };
  }
  
  // Exportar facturas a Excel con productos detallados
  async exportarFacturasExcel(facturas: any[]): Promise<void> {
    try {
      console.log('📊 [ReporteService] Exportando facturas a Excel con productos detallados...');
      
      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // 1. HOJA DE FACTURAS RESUMIDAS
      const datosFacturasResumen = facturas.map(factura => ({
        'Número Factura': factura.numero,
        'Fecha': new Date(factura.fecha).toLocaleDateString('es-ES'),
        'Cliente': factura.cliente,
        'Empresa': factura.empresa,
        'Subtotal': factura.subtotal,
        'Impuesto': factura.impuesto,
        'Total': factura.total,
        'Estado': '✅ Pagada',
        'Método Pago': factura.metodo_pago || 'transferencia',
        'Referencia': factura.referencia_operacion || '',
        'Fecha Pago': factura.fecha_operacion ? new Date(factura.fecha_operacion).toLocaleDateString('es-ES') : new Date(factura.fecha).toLocaleDateString('es-ES')
      }));
      
      const wsFacturasResumen = XLSX.utils.json_to_sheet(datosFacturasResumen);
      wsFacturasResumen['!cols'] = [
        { wch: 15 }, // Número Factura
        { wch: 12 }, // Fecha
        { wch: 20 }, // Cliente
        { wch: 25 }, // Empresa
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Impuesto
        { wch: 12 }, // Total
        { wch: 12 }, // Estado
        { wch: 15 }, // Método Pago
        { wch: 20 }, // Referencia
        { wch: 12 }  // Fecha Pago
      ];
      XLSX.utils.book_append_sheet(wb, wsFacturasResumen, 'Facturas Resumen');
      
      // 2. HOJA DE PRODUCTOS DETALLADOS
      const productosDetallados: any[] = [];
      
      facturas.forEach(factura => {
        if (factura.productos && factura.productos.length > 0) {
          factura.productos.forEach((producto: any, index: number) => {
            productosDetallados.push({
              'Número Factura': factura.numero,
              'Fecha Factura': new Date(factura.fecha).toLocaleDateString('es-ES'),
              'Cliente': factura.cliente,
              'Empresa': factura.empresa,
              'Item': index + 1,
              'Marca': producto.marca || '',
              'Modelo': producto.modelo || '',
              'Matrícula': producto.matricula || '',
              'Color': producto.color || '',
              'Kilómetros': producto.kilometros ? `${producto.kilometros} km` : '',
              'Chasis': producto.chasis || '',
              'Cantidad': producto.cantidad || 1,
              'Precio Unitario': producto.precioUnitario || producto.precio || 0,
              'Subtotal': producto.subtotal || (producto.precioUnitario * producto.cantidad) || 0,
              'Tipo Impuesto': producto.tipoImpuesto || producto.tipo_impuesto || 'igic',
              'Porcentaje Impuesto': producto.tipoImpuesto === 'iva' ? '21%' : '9.5%',
              'Impuesto': producto.impuesto || 0,
              'Total Item': producto.total || (producto.subtotal + producto.impuesto) || 0,
              'Categoría': producto.categoria || 'vehiculo',
              'Stock': producto.stock || 0
            });
          });
        } else {
          // Si no hay productos detallados, crear una fila con la información básica
          productosDetallados.push({
            'Número Factura': factura.numero,
            'Fecha Factura': new Date(factura.fecha).toLocaleDateString('es-ES'),
            'Cliente': factura.cliente,
            'Empresa': factura.empresa,
            'Item': 1,
            'Descripción': 'Servicio general',
            'Cantidad': 1,
            'Precio Unitario': factura.subtotal || 0,
            'Subtotal': factura.subtotal || 0,
            'Tipo Impuesto': 'igic',
            'Porcentaje Impuesto': '9.5%',
            'Impuesto': factura.impuesto || 0,
            'Total Item': factura.total || 0,
            'Categoría': 'servicio',
            'Stock': 0
          });
        }
      });
      
      const wsProductosDetallados = XLSX.utils.json_to_sheet(productosDetallados);
      wsProductosDetallados['!cols'] = [
        { wch: 15 }, // Número Factura
        { wch: 12 }, // Fecha Factura
        { wch: 20 }, // Cliente
        { wch: 25 }, // Empresa
        { wch: 8 },  // Item
        { wch: 15 }, // Marca
        { wch: 15 }, // Modelo
        { wch: 12 }, // Matrícula
        { wch: 12 }, // Color
        { wch: 12 }, // Kilómetros
        { wch: 20 }, // Chasis
        { wch: 10 }, // Cantidad
        { wch: 12 }, // Precio Unitario
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Tipo Impuesto
        { wch: 15 }, // Porcentaje Impuesto
        { wch: 12 }, // Impuesto
        { wch: 12 }, // Total Item
        { wch: 12 }, // Categoría
        { wch: 8 }   // Stock
      ];
      XLSX.utils.book_append_sheet(wb, wsProductosDetallados, 'Productos Detallados');
      
      // 3. HOJA DE RESUMEN MENSUAL
      const reporteMensual = await this.generarReporteMensual(facturas);
      const datosResumen = [
        ['Métrica', 'Valor'],
        ['Mes', `${reporteMensual.mes} ${reporteMensual.año}`],
        ['Total Facturas', reporteMensual.totalFacturas],
        ['Total Ingresos', `€${reporteMensual.totalIngresos.toLocaleString()}`],
        ['Facturas Pagadas', reporteMensual.facturasPagadas],
        ['Facturas Pendientes', reporteMensual.facturasPendientes],
        ['Facturas Vencidas', reporteMensual.facturasVencidas],
        ['Promedio por Factura', `€${reporteMensual.promedioFactura.toLocaleString()}`],
        ['Crecimiento Mensual', `${reporteMensual.crecimientoMensual.toFixed(2)}%`],
        ['', ''],
        ['RESUMEN POR TIPO DE IMPUESTO', ''],
        ['Facturas con IGIC (9.5%)', this.contarFacturasPorImpuesto(facturas, 'igic')],
        ['Facturas con IVA (21%)', this.contarFacturasPorImpuesto(facturas, 'iva')],
        ['Ingresos IGIC', `€${this.calcularIngresosPorImpuesto(facturas, 'igic').toLocaleString()}`],
        ['Ingresos IVA', `€${this.calcularIngresosPorImpuesto(facturas, 'iva').toLocaleString()}`],
        ['', ''],
        ['NOTA IMPORTANTE:', ''],
        ['Todas las facturas existentes', 'se consideran pagadas'],
        ['Si existe una factura,', 'significa que ya se pagó']
      ];
      
      const wsResumen = XLSX.utils.aoa_to_sheet(datosResumen);
      wsResumen['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Mensual');
      
      // 4. HOJA DE ANÁLISIS DE IMPUESTOS
      const analisisImpuestos = this.generarAnalisisImpuestos(facturas);
      const wsAnalisisImpuestos = XLSX.utils.json_to_sheet(analisisImpuestos);
      wsAnalisisImpuestos['!cols'] = [
        { wch: 15 }, // Número Factura
        { wch: 12 }, // Fecha
        { wch: 20 }, // Cliente
        { wch: 12 }, // Tipo Impuesto
        { wch: 15 }, // Porcentaje
        { wch: 12 }, // Base Imponible
        { wch: 12 }, // Impuesto
        { wch: 12 }, // Total
        { wch: 20 }  // Observaciones
      ];
      XLSX.utils.book_append_sheet(wb, wsAnalisisImpuestos, 'Análisis Impuestos');
      
      // Generar nombre de archivo
      const fechaActual = new Date();
      const timestamp = fechaActual.toISOString().slice(0, 10);
      const filename = `Reporte_Facturas_Detallado_${timestamp}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(wb, filename);
      
      console.log('📊 [ReporteService] Excel detallado exportado:', filename);
    } catch (error) {
      console.error('📊 [ReporteService] Error al exportar Excel:', error);
      throw error;
    }
  }
  
  // Generar reporte mensual en PDF
  async generarReporteMensualPDF(facturas: any[]): Promise<void> {
    try {
      console.log('📊 [ReporteService] Generando reporte mensual PDF...');
      
      const reporte = await this.generarReporteMensual(facturas);
      
      // Crear HTML para el reporte
      const htmlContent = this.generarHTMLReporteMensual(reporte, facturas);
      
      // Crear elemento temporal para renderizar el HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.padding = '30px';
      document.body.appendChild(tempDiv);
      
      // Esperar un momento para que se renderice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Usar html2canvas para convertir HTML a imagen
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 860,
        height: tempDiv.scrollHeight
      });
      
      // Crear PDF con jsPDF
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calcular dimensiones
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Agregar la imagen al PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Si la imagen es más alta que una página, agregar páginas adicionales
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);
      
      // Descargar el PDF
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Reporte_Mensual_${reporte.mes}_${reporte.año}_${timestamp}.pdf`;
      pdf.save(filename);
      
      console.log('📊 [ReporteService] Reporte mensual PDF generado:', filename);
    } catch (error) {
      console.error('📊 [ReporteService] Error al generar reporte mensual PDF:', error);
      throw error;
    }
  }
  
  // Generar HTML para el reporte mensual
  private generarHTMLReporteMensual(reporte: ReporteMensualData, facturas: any[]): string {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const añoActual = fechaActual.getFullYear();
    
    const facturasMesActual = facturas.filter(factura => {
      const fechaFactura = new Date(factura.fecha);
      return fechaFactura.getMonth() + 1 === mesActual && 
             fechaFactura.getFullYear() === añoActual;
    });
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Mensual - ${reporte.mes} ${reporte.año}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
            }
            
            .reporte-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            
            .header h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #333;
            }
            
            .header h2 {
                font-size: 18px;
                color: #666;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 12px;
                color: #666;
            }
            
            .facturas-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .facturas-table th,
            .facturas-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            
            .facturas-table th {
                background: #f5f5f5;
                font-weight: bold;
                font-size: 11px;
            }
            
            .facturas-table td {
                font-size: 11px;
            }
            
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
            }
        </style>
    </head>
    <body>
        <div class="reporte-container">
            <!-- Header -->
            <div class="header">
                <h1>📊 REPORTE MENSUAL</h1>
                <h2>${reporte.mes} ${reporte.año}</h2>
                <p>Telwagen Car Ibérica, S.L.</p>
            </div>
            
            <!-- Estadísticas principales -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${reporte.totalFacturas}</div>
                    <div class="stat-label">Total Facturas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">€${reporte.totalIngresos.toLocaleString()}</div>
                    <div class="stat-label">Total Ingresos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reporte.facturasPagadas}</div>
                    <div class="stat-label">Facturas Pagadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">€${reporte.promedioFactura.toLocaleString()}</div>
                    <div class="stat-label">Promedio por Factura</div>
                </div>
            </div>
            
            <!-- Nota explicativa -->
            <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #2e7d32; font-weight: bold;">
                    ✅ Todas las facturas existentes se consideran pagadas
                </p>
                <p style="margin: 5px 0 0 0; color: #388e3c; font-size: 11px;">
                    Si existe una factura en el sistema, significa que el pago ya se ha realizado
                </p>
            </div>
            
            <!-- Tabla de facturas del mes -->
            <h3 style="margin-bottom: 15px;">Facturas del Mes</h3>
            <table class="facturas-table">
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${facturasMesActual.map(factura => `
                        <tr>
                            <td>${factura.numero}</td>
                            <td>${new Date(factura.fecha).toLocaleDateString('es-ES')}</td>
                            <td>${factura.cliente}</td>
                            <td>€${factura.total.toLocaleString()}</td>
                            <td style="color: #4caf50; font-weight: bold;">✅ Pagada</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <!-- Footer -->
            <div class="footer">
                <p>Reporte generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
                <p>Telwagen Car Ibérica, S.L. - CIF: B-93.289.585</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  
  // Contar facturas por tipo de impuesto
  private contarFacturasPorImpuesto(facturas: any[], tipoImpuesto: string): number {
    return facturas.filter(factura => {
      if (factura.productos && factura.productos.length > 0) {
        return factura.productos.some((p: any) => 
          (p.tipoImpuesto || p.tipo_impuesto || 'igic') === tipoImpuesto
        );
      }
      return tipoImpuesto === 'igic'; // Por defecto IGIC
    }).length;
  }
  
  // Calcular ingresos por tipo de impuesto
  private calcularIngresosPorImpuesto(facturas: any[], tipoImpuesto: string): number {
    return facturas.reduce((total, factura) => {
      if (factura.productos && factura.productos.length > 0) {
        const ingresosProductos = factura.productos
          .filter((p: any) => (p.tipoImpuesto || p.tipo_impuesto || 'igic') === tipoImpuesto)
          .reduce((sum: number, p: any) => sum + (p.total || 0), 0);
        return total + ingresosProductos;
      }
      // Si no hay productos detallados, usar el total de la factura si es del tipo correcto
      return tipoImpuesto === 'igic' ? total + factura.total : total;
    }, 0);
  }
  
  // Generar análisis de impuestos
  private generarAnalisisImpuestos(facturas: any[]): any[] {
    const analisis: any[] = [];
    
    facturas.forEach(factura => {
      if (factura.productos && factura.productos.length > 0) {
        // Agrupar productos por tipo de impuesto
        const productosPorImpuesto = factura.productos.reduce((acc: any, producto: any) => {
          const tipoImpuesto = producto.tipoImpuesto || producto.tipo_impuesto || 'igic';
          if (!acc[tipoImpuesto]) {
            acc[tipoImpuesto] = [];
          }
          acc[tipoImpuesto].push(producto);
          return acc;
        }, {});
        
        // Crear una fila por cada tipo de impuesto
        Object.keys(productosPorImpuesto).forEach(tipoImpuesto => {
          const productos = productosPorImpuesto[tipoImpuesto];
          const subtotal = productos.reduce((sum: number, p: any) => sum + (p.subtotal || 0), 0);
          const impuesto = productos.reduce((sum: number, p: any) => sum + (p.impuesto || 0), 0);
          const total = subtotal + impuesto;
          
          analisis.push({
            'Número Factura': factura.numero,
            'Fecha': new Date(factura.fecha).toLocaleDateString('es-ES'),
            'Cliente': factura.cliente,
            'Tipo Impuesto': tipoImpuesto.toUpperCase(),
            'Porcentaje': tipoImpuesto === 'iva' ? '21%' : '9.5%',
            'Base Imponible': subtotal,
            'Impuesto': impuesto,
            'Total': total,
            'Observaciones': `${productos.length} producto(s) con ${tipoImpuesto.toUpperCase()}`
          });
        });
      } else {
        // Si no hay productos detallados, usar datos de la factura
        analisis.push({
          'Número Factura': factura.numero,
          'Fecha': new Date(factura.fecha).toLocaleDateString('es-ES'),
          'Cliente': factura.cliente,
          'Tipo Impuesto': 'IGIC',
          'Porcentaje': '9.5%',
          'Base Imponible': factura.subtotal,
          'Impuesto': factura.impuesto,
          'Total': factura.total,
          'Observaciones': 'Factura sin productos detallados'
        });
      }
    });
    
    return analisis;
  }
  
  // Obtener nombre del mes
  private obtenerNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  }
}

export const reporteService = new ReporteService();
export default reporteService;
