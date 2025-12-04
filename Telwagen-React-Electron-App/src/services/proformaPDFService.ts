import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ProformaPDFData {
  numero: string;
  fecha: string;
  cliente: string;
  clienteCif?: string;
  clienteDireccion?: string;
  empresa: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  productos: Array<{
    descripcion: string;
    cantidad: number;
    precio: number;
    marca?: string;
    modelo?: string;
    matricula?: string;
    color?: string;
    kilometros?: number;
    chasis?: string;
  }>;
}

class ProformaPDFService {
  async generarPDFProforma(proforma: ProformaPDFData): Promise<void> {
    try {
      console.log('📄 [ProformaPDFService] Generando PDF para proforma:', proforma.numero);
      
      const htmlContent = this.generarHTMLProforma(proforma);
      
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
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 860,
        height: tempDiv.scrollHeight
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      document.body.removeChild(tempDiv);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Proforma_${proforma.numero.replace('/', '_')}_${timestamp}.pdf`;
      pdf.save(filename);
      
      console.log('📄 [ProformaPDFService] PDF generado:', filename);
    } catch (error) {
      console.error('📄 [ProformaPDFService] Error al generar PDF:', error);
      throw error;
    }
  }

  private generarHTMLProforma(proforma: ProformaPDFData): string {
    const fechaFormateada = new Date(proforma.fecha).toLocaleDateString('es-ES');
    const subtotal = proforma.subtotal || proforma.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuesto = proforma.impuesto || subtotal * 0.095;
    const total = proforma.total || subtotal + impuesto;
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proforma ${proforma.numero}</title>
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
            
            .proforma-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                border-bottom: 2px solid #7c3aed;
                padding-bottom: 20px;
            }
            
            .empresa-info h2 {
                font-size: 18px;
                margin-bottom: 5px;
                color: #333;
                letter-spacing: 0.5px;
            }
            
            .empresa-info p {
                margin: 3px 0;
                color: #666;
            }
            
            .proforma-info h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #7c3aed;
            }
            
            .proforma-info p {
                margin: 5px 0;
                color: #666;
            }
            
            .proforma-badge {
                display: inline-block;
                background: #7c3aed;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 10px;
                margin-top: 5px;
            }
            
            .cliente-section {
                margin-bottom: 30px;
                background: #f8f5ff;
                padding: 15px;
                border-radius: 8px;
            }
            
            .cliente-section h3 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #7c3aed;
            }
            
            .cliente-section p {
                margin: 3px 0;
                color: #666;
            }
            
            .productos-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .productos-table th,
            .productos-table td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
            }
            
            .productos-table th {
                background: #7c3aed;
                color: white;
                font-weight: bold;
                font-size: 11px;
            }
            
            .productos-table td {
                font-size: 11px;
            }
            
            .productos-table tr:nth-child(even) {
                background: #f8f5ff;
            }
            
            .vehiculo-info {
                font-size: 10px;
                color: #666;
                margin-top: 4px;
            }
            
            .totales-section {
                margin-bottom: 30px;
                text-align: right;
            }
            
            .totales-section p {
                margin: 5px 0;
                font-size: 12px;
            }
            
            .total-final {
                font-size: 18px;
                font-weight: bold;
                color: #7c3aed;
                border-top: 2px solid #7c3aed;
                padding-top: 10px;
                margin-top: 10px;
            }
            
            .nota-section {
                background: #fff7ed;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .nota-section h4 {
                color: #f59e0b;
                margin-bottom: 5px;
            }
            
            .nota-section p {
                color: #666;
                font-size: 11px;
            }
            
            .banco-section h3 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #333;
            }
            
            .banco-section p {
                margin: 3px 0;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="proforma-container">
            <div class="header">
                <div class="empresa-info">
                    <h2>Telwagen Car Ibérica, S.L.</h2>
                    <p>CIF: B-93.289.585</p>
                    <p>C. / Tomás Miller N° 48 Local 35007 Las Palmas de Gran Canaria</p>
                </div>
                <div class="proforma-info">
                    <h1>PROFORMA</h1>
                    <p>Nº: ${proforma.numero}</p>
                    <p>Fecha: ${fechaFormateada}</p>
                    <span class="proforma-badge">${proforma.estado?.toUpperCase() || 'PENDIENTE'}</span>
                </div>
            </div>
            
            <div class="cliente-section">
                <h3>DATOS DEL CLIENTE:</h3>
                <p><strong>Nombre:</strong> ${proforma.cliente}</p>
                ${proforma.clienteCif ? `<p><strong>CIF/NIF:</strong> ${proforma.clienteCif}</p>` : ''}
                ${proforma.clienteDireccion ? `<p><strong>Dirección:</strong> ${proforma.clienteDireccion}</p>` : ''}
            </div>
            
            <table class="productos-table">
                <thead>
                    <tr>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                        <th>Precio Unit.</th>
                        <th>IGIC</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${proforma.productos.map(producto => `
                        <tr>
                            <td>${producto.cantidad}</td>
                            <td>
                                ${producto.descripcion}
                                ${producto.matricula ? `
                                <div class="vehiculo-info">
                                    ${producto.marca || ''} ${producto.modelo || ''} · Matrícula: ${producto.matricula}
                                    ${producto.color ? ` · Color: ${producto.color}` : ''}
                                    ${producto.kilometros ? ` · ${producto.kilometros} km` : ''}
                                </div>
                                ` : ''}
                            </td>
                            <td>${producto.precio.toFixed(2)} €</td>
                            <td>${(producto.precio * 0.095).toFixed(2)} €</td>
                            <td>${(producto.precio * producto.cantidad).toFixed(2)} €</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totales-section">
                <p><strong>Base Imponible:</strong> ${subtotal.toFixed(2)} €</p>
                <p><strong>IGIC (9.5%):</strong> ${impuesto.toFixed(2)} €</p>
                <p class="total-final"><strong>TOTAL:</strong> ${total.toFixed(2)} €</p>
            </div>
            
            <div class="nota-section">
                <h4>⚠️ NOTA IMPORTANTE</h4>
                <p>Este documento es una proforma y no tiene valor fiscal. Los precios indicados son orientativos y pueden variar. La validez de esta proforma es de 30 días desde su fecha de emisión.</p>
            </div>
            
            <div class="banco-section">
                <h3>DATOS BANCARIOS:</h3>
                <p><strong>Banco:</strong> Banco Santander</p>
                <p><strong>IBAN:</strong> ES83 0049 7246 7024 1000 2644</p>
                <p><strong>SWIFT:</strong> BSCHESMM</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

export const proformaPDFService = new ProformaPDFService();
export default proformaPDFService;

