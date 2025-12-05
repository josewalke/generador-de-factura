import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export interface FacturaPDFData {
  numero: string;
  fecha: string;
  cliente: string;
  clienteDireccion?: string;
  clienteNif?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteCodigoPostal?: string;
  clienteProvincia?: string;
  clientePais?: string;
  clienteCodigoPais?: string;
  clienteTipoIdentificacion?: string;
  clienteRegimenFiscal?: string;
  empresa: string;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
  codigoVeriFactu?: string;
  hashDocumento?: string;
  numeroSerie?: string;
  selladoTemporal?: string;
  // Datos del emisor para VeriFactu
  empresaCif?: string;
  empresaNombre?: string;
  // Datos adicionales
  fechaOperacion?: string;
  tipoDocumento?: string;
  productos: Array<{
    descripcion: string;
    cantidad: number;
    precio: number;
    // Datos adicionales del vehículo
    marca?: string;
    modelo?: string;
    matricula?: string;
    color?: string;
    kilometros?: number;
    chasis?: string;
  }>;
}

class FacturaPDFService {
  // Generar datos para el código QR VeriFactu según normativa española
  private generarDatosQR(factura: FacturaPDFData): string {
    // Formatear fecha y hora para VeriFactu (formato ISO 8601)
    const fechaEmision = factura.fecha ? new Date(factura.fecha).toISOString().replace('Z', '') : new Date().toISOString().replace('Z', '');
    const fechaFormateada = fechaEmision.split('T')[0]; // YYYY-MM-DD
    const horaFormateada = fechaEmision.split('T')[1] || '00:00:00'; // HH:MM:SS
    
    // Extraer serie del número de factura (si existe formato SERIE-NUMERO)
    const numeroCompleto = factura.numero || '';
    const serie = factura.numeroSerie || numeroCompleto.split('/')[0] || 'F24';
    const numeroFactura = numeroCompleto.includes('/') ? numeroCompleto.split('/')[1] : numeroCompleto;
    
    // NIF/CIF del emisor
    const nifEmisor = factura.empresaCif || 'B-93.289.585'; // CIF por defecto de Telwagen
    const nombreEmisor = factura.empresaNombre || factura.empresa || 'Telwagen Car Ibérica, S.L.';
    
    // Tipo de documento (F1 = Factura completa, F2 = Factura simplificada)
    const tipoDocumento = factura.tipoDocumento || 'F1';
    
    // Convertir valores numéricos para asegurar que sean números
    const total = Number(factura.total || 0);
    const subtotal = Number(factura.subtotal || 0);
    
    // Construir URL de verificación VeriFactu
    const fechaURL = fechaFormateada.replace(/-/g, ''); // YYYYMMDD
    const urlVerificacion = `https://verifactu.aeat.es/v1/qr?NIF=${encodeURIComponent(nifEmisor)}&NUM=${encodeURIComponent(numeroFactura)}&SER=${encodeURIComponent(serie)}&IMP=${total.toFixed(2)}&FEC=${fechaURL}`;
    
    // Generar string QR según formato estándar VeriFactu
    let qrString = `NIF=${nifEmisor}\n`;
    qrString += `NUM=${numeroFactura}\n`;
    qrString += `SER=${serie}\n`;
    qrString += `FEC=${fechaFormateada}T${horaFormateada}\n`;
    qrString += `IMP=${total.toFixed(2)}\n`;
    qrString += `BIM=${subtotal.toFixed(2)}\n`;
    qrString += `TIP=${tipoDocumento}\n`;
    qrString += `SOFT=Telwagen Factura v2.0\n`;
    
    if (factura.codigoVeriFactu) {
      qrString += `ID=${factura.codigoVeriFactu}\n`;
    }
    
    if (factura.hashDocumento) {
      qrString += `HASH=${factura.hashDocumento}\n`;
    }
    
    if (factura.selladoTemporal) {
      qrString += `SELLADO=${factura.selladoTemporal}\n`;
    }
    
    qrString += `URL=${urlVerificacion}\n`;
    qrString += `EMISOR=${nombreEmisor}`;
    
    console.log('📱 [FacturaPDFService] Datos QR VeriFactu generados según normativa');
    console.log('📱 [FacturaPDFService] String QR:', qrString);
    console.log('📱 [FacturaPDFService] Tamaño:', qrString.length, 'caracteres');
    
    return qrString;
  }

  // Generar código QR como imagen base64
  private async generarQRCode(datosQR: string): Promise<string> {
    try {
      console.log('📱 [FacturaPDFService] Generando código QR...');
      console.log('📱 [FacturaPDFService] Datos QR (longitud):', datosQR.length);
      
      if (!datosQR || datosQR.trim() === '') {
        console.warn('⚠️ [FacturaPDFService] Datos QR vacíos, no se generará QR');
        return '';
      }
      
      const qrDataURL = await QRCode.toDataURL(datosQR, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('✅ [FacturaPDFService] QR generado exitosamente, longitud:', qrDataURL.length);
      console.log('📱 [FacturaPDFService] QR preview (primeros 100 chars):', qrDataURL.substring(0, 100));
      return qrDataURL;
    } catch (error) {
      console.error('❌ [FacturaPDFService] Error al generar código QR:', error);
      console.error('❌ [FacturaPDFService] Stack:', error instanceof Error ? error.stack : 'N/A');
      // Retornar un placeholder si falla
      return '';
    }
  }

  // Generar PDF de factura usando HTML del diseño de facturas.html
  async generarPDFFactura(factura: FacturaPDFData): Promise<void> {
    try {
      console.log('📄 [FacturaPDFService] Generando PDF para factura:', factura.numero);
      console.log('📄 [FacturaPDFService] Datos de factura recibidos:', {
        numero: factura.numero,
        codigoVeriFactu: factura.codigoVeriFactu,
        hashDocumento: factura.hashDocumento ? `${factura.hashDocumento.substring(0, 20)}...` : 'no disponible',
        total: factura.total
      });
      
      // Generar código QR
      const datosQR = this.generarDatosQR(factura);
      const qrCodeDataURL = await this.generarQRCode(datosQR);
      
      console.log('📱 [FacturaPDFService] QR generado:', qrCodeDataURL ? `Sí (${qrCodeDataURL.length} chars)` : 'No');
      
      // Generar HTML con el diseño exacto de facturas.html
      const htmlContent = await this.generarHTMLFactura(factura, qrCodeDataURL);
      
      console.log('📄 [FacturaPDFService] HTML generado (QR se agregará directamente al PDF con jsPDF)');
      
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
      
      // Usar html2canvas para convertir HTML a imagen
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 860, // 800px + 60px de padding (30px cada lado)
        height: tempDiv.scrollHeight,
        logging: false
      });
      
      // Crear PDF con jsPDF
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
      
      // Agregar QR directamente al PDF si está disponible
      if (qrCodeDataURL && qrCodeDataURL.length > 0) {
        console.log('📱 [FacturaPDFService] Agregando QR directamente al PDF...');
        try {
          // Ir a la última página (o primera si solo hay una)
          const totalPages = pdf.getNumberOfPages();
          pdf.setPage(totalPages);
          
          // Calcular posición para el QR en la esquina inferior izquierda
          // Colocamos el QR abajo a la izquierda, con un poco de espacio del borde
          const pageHeight = 295; // A4 height in mm
          const marginBottom = 10; // Margen inferior pequeño
          const marginLeft = 10; // Margen izquierdo pequeño
          const qrSize = 30; // 30mm x 30mm
          const qrX = marginLeft; // Posición horizontal a la izquierda
          const qrY = pageHeight - marginBottom - qrSize; // Posición vertical abajo (lo más bajo posible)
          
          // Agregar la imagen QR (sin texto arriba)
          pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
          
          console.log('✅ [FacturaPDFService] QR agregado al PDF exitosamente en la esquina inferior izquierda de la página', totalPages);
        } catch (error) {
          console.error('❌ [FacturaPDFService] Error al agregar QR al PDF:', error);
          console.error('❌ [FacturaPDFService] Error details:', error instanceof Error ? error.stack : String(error));
        }
      } else {
        console.warn('⚠️ [FacturaPDFService] No se agregó QR al PDF porque qrCodeDataURL está vacío');
        console.warn('⚠️ [FacturaPDFService] Datos disponibles:', {
          tieneCodigo: !!factura.codigoVeriFactu,
          tieneHash: !!factura.hashDocumento,
          qrCodeDataURL: qrCodeDataURL ? 'existe pero vacío' : 'no existe'
        });
      }
      
      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);
      
      // Descargar el PDF
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Factura_${factura.numero.replace('/', '_')}_${timestamp}.pdf`;
      pdf.save(filename);
      
      console.log('📄 [FacturaPDFService] PDF generado:', filename);
    } catch (error) {
      console.error('📄 [FacturaPDFService] Error al generar PDF:', error);
      throw error;
    }
  }

  // Generar HTML con el diseño exacto de facturas.html
  private async generarHTMLFactura(factura: FacturaPDFData, qrCodeDataURL: string): Promise<string> {
    const fechaFormateada = new Date(factura.fecha).toLocaleDateString('es-ES');
    const subtotal = factura.productos.reduce((sum, p) => {
      const precio = Number(p.precio_unitario || p.precio || 0);
      const cantidad = Number(p.cantidad || 1);
      return sum + (precio * cantidad);
    }, 0);
    const impuesto = subtotal * 0.095;
    const total = subtotal + impuesto;
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${factura.numero}</title>
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
            
            .factura-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
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
            
            .factura-info h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #333;
            }
            
            .factura-info p {
                margin: 5px 0;
                color: #666;
            }
            
            .cliente-section {
                margin-bottom: 30px;
            }
            
            .cliente-section h3 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #333;
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
                padding: 8px;
                text-align: left;
            }
            
            .productos-table th {
                background: #f5f5f5;
                font-weight: bold;
                font-size: 11px;
            }
            
            .productos-table td {
                font-size: 11px;
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
                font-size: 16px;
                font-weight: bold;
                color: #333;
                border-top: 1px solid #333;
                padding-top: 20px;
                margin: 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            
            .total-final strong {
                margin-right: 10px;
                flex-shrink: 0;
            }
            
            .total-final span {
                font-weight: bold;
                text-align: right;
                flex-shrink: 0;
            }
        </style>
    </head>
    <body>
        <div class="factura-container">
            <!-- Header de la factura -->
            <div class="header">
                <div class="empresa-info">
                    <h2>Telwagen Car Ibérica, S.L.</h2>
                    <p>CIF: B-93.289.585</p>
                    <p>C. / Tomás Miller N° 48 Local 35007 Las Palmas de Gran Canaria</p>
                </div>
                <div class="factura-info">
                    <h1>FACTURA</h1>
                    <p>Nº: ${factura.numero}</p>
                    <p>Fecha: ${fechaFormateada}</p>
                </div>
            </div>
            
            <!-- Datos del cliente -->
            <div class="cliente-section">
                <h3>DATOS DEL CLIENTE:</h3>
                <p><strong>Nombre:</strong> ${factura.cliente}</p>
                ${factura.clienteNif ? `<p><strong>${factura.clienteTipoIdentificacion || 'NIF'}:</strong> ${factura.clienteNif}</p>` : ''}
                ${factura.clienteDireccion ? `<p><strong>Dirección:</strong> ${factura.clienteDireccion}` : ''}
                ${factura.clienteCodigoPostal || factura.clienteProvincia || factura.clientePais ? `${factura.clienteCodigoPostal ? ` ${factura.clienteCodigoPostal}` : ''}${factura.clienteProvincia ? `, ${factura.clienteProvincia}` : ''}${factura.clientePais ? `, ${factura.clientePais}` : ''}${factura.clienteCodigoPais ? ` (${factura.clienteCodigoPais})` : ''}</p>` : (factura.clienteDireccion ? '</p>' : '')}
                ${factura.clienteTelefono ? `<p><strong>Teléfono:</strong> ${factura.clienteTelefono}</p>` : ''}
                ${factura.clienteEmail ? `<p><strong>Email:</strong> ${factura.clienteEmail}</p>` : ''}
                ${factura.clienteRegimenFiscal ? `<p><strong>Régimen Fiscal:</strong> ${factura.clienteRegimenFiscal}</p>` : ''}
            </div>
            
            <!-- Tabla de productos -->
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
                    ${factura.productos.map(producto => {
                        const precio = Number(producto.precio_unitario || producto.precio || 0);
                        const cantidad = Number(producto.cantidad || 1);
                        const subtotal = precio * cantidad;
                        const impuesto = subtotal * 0.095;
                        return `
                        <tr>
                            <td>${cantidad}</td>
                            <td>${producto.descripcion || 'Producto sin descripción'}</td>
                            <td>${precio.toFixed(2)} €</td>
                            <td>${impuesto.toFixed(2)} €</td>
                            <td>${subtotal.toFixed(2)} €</td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
            
            <!-- Totales -->
            <div class="totales-section">
                <p><strong>Base Imponible:</strong> ${subtotal.toFixed(2)} €</p>
                <p><strong>IGIC (9.5%):</strong> ${impuesto.toFixed(2)} €</p>
                <p class="total-final"><strong>TOTAL:</strong><span>${total.toFixed(2)} €</span></p>
            </div>
            
            <!-- Información bancaria -->
            <!-- El código QR VeriFactu se agregará directamente al PDF con jsPDF, no en el HTML -->
        </div>
    </body>
    </html>
    `;
  }

  // Generar PDF desde HTML (alternativa)
  async generarPDFDesdeHTML(elementId: string, filename: string): Promise<void> {
    try {
      console.log('📄 [FacturaPDFService] Generando PDF desde HTML:', elementId);
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Elemento con ID ${elementId} no encontrado`);
      }
      
      // Convertir HTML a canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Crear PDF desde canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Descargar PDF
      pdf.save(filename);
      
      console.log('📄 [FacturaPDFService] PDF desde HTML generado:', filename);
    } catch (error) {
      console.error('📄 [FacturaPDFService] Error al generar PDF desde HTML:', error);
      throw error;
    }
  }

  // Generar PDF con plantilla personalizada
  async generarPDFConPlantilla(factura: FacturaPDFData, plantilla: 'simple' | 'detallada' = 'simple'): Promise<void> {
    try {
      console.log('📄 [FacturaPDFService] Generando PDF con plantilla:', plantilla);
      
      if (plantilla === 'detallada') {
        await this.generarPDFDetallado(factura);
      } else {
        await this.generarPDFFactura(factura);
      }
    } catch (error) {
      console.error('📄 [FacturaPDFService] Error al generar PDF con plantilla:', error);
      throw error;
    }
  }

  // PDF detallado con más información
  private async generarPDFDetallado(factura: FacturaPDFData): Promise<void> {
    // Generar código QR
    const datosQR = this.generarDatosQR(factura);
    const qrCodeDataURL = await this.generarQRCode(datosQR);
    
    const doc = new jsPDF();
    
    // Configuración básica
    doc.setFont('helvetica');
    
    // Header con logo (simulado)
    doc.setFillColor(0, 0, 139);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('TELWAGEN', 20, 20);
    
    doc.setFontSize(12);
    doc.text('Car Ibérica, S.L.', 20, 25);
    
    // Resetear color
    doc.setTextColor(0, 0, 0);
    
    // Título de factura
    doc.setFontSize(18);
    doc.text('FACTURA', 150, 20);
    doc.setFontSize(12);
    doc.text(`Nº ${factura.numero}`, 150, 25);
    
    // Información detallada de la empresa
    doc.setFontSize(10);
    doc.text('CIF: B-93.289.585', 20, 40);
    doc.text('Registro Mercantil: Las Palmas', 20, 45);
    doc.text('Tel: +34 928 123 456', 20, 50);
    doc.text('Email: info@telwagen.es', 20, 55);
    doc.text('Web: www.telwagen.es', 20, 60);
    
    // Información del cliente
    doc.setFontSize(12);
    doc.text('FACTURAR A:', 20, 80);
    doc.setFontSize(10);
    doc.text(factura.cliente, 20, 90);
    doc.text(factura.empresa, 20, 95);
    
    // Fechas
    doc.setFontSize(12);
    doc.text('FECHA DE EMISIÓN:', 120, 80);
    doc.setFontSize(10);
    doc.text(new Date(factura.fecha).toLocaleDateString('es-ES'), 120, 90);
    
    doc.setFontSize(12);
    doc.text('VENCIMIENTO:', 120, 100);
    doc.setFontSize(10);
    const fechaVencimiento = new Date(factura.fecha);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    doc.text(fechaVencimiento.toLocaleDateString('es-ES'), 120, 110);
    
    // Tabla de productos más detallada
    doc.setFontSize(12);
    doc.text('DETALLE DE LA FACTURA:', 20, 130);
    
    // Encabezados
    doc.setFontSize(10);
    doc.text('Código', 20, 145);
    doc.text('Descripción', 50, 145);
    doc.text('Cant.', 120, 145);
    doc.text('P. Unit.', 140, 145);
    doc.text('Desc.', 160, 145);
    doc.text('Total', 180, 145);
    
    // Línea separadora
    doc.line(20, 150, 190, 150);
    
    // Productos
    let yPosition = 160;
    factura.productos.forEach((producto, index) => {
      doc.text(`P${String(index + 1).padStart(3, '0')}`, 20, yPosition);
      doc.text(producto.descripcion, 50, yPosition);
      doc.text(producto.cantidad.toString(), 120, yPosition);
      doc.text(`€${producto.precio.toLocaleString()}`, 140, yPosition);
      doc.text('0%', 160, yPosition);
      doc.text(`€${(producto.cantidad * producto.precio).toLocaleString()}`, 180, yPosition);
      yPosition += 10;
    });
    
    // Línea separadora final
    doc.line(20, yPosition, 190, yPosition);
    
    // Totales detallados
    yPosition += 15;
    doc.setFontSize(10);
    doc.text('Base Imponible:', 150, yPosition);
    doc.text(`€${factura.subtotal.toLocaleString()}`, 180, yPosition);
    
    yPosition += 10;
    doc.text('IGIC (9.5%):', 150, yPosition);
    doc.text(`€${factura.impuesto.toLocaleString()}`, 180, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL FACTURA:', 150, yPosition);
    doc.text(`€${factura.total.toLocaleString()}`, 180, yPosition);
    
    // Información legal
    yPosition += 25;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('CONDICIONES DE PAGO: 30 días desde la fecha de emisión.', 20, yPosition);
    doc.text('En caso de impago, se aplicarán intereses de demora según la Ley 3/2004.', 20, yPosition + 10);
    doc.text('Esta factura ha sido generada electrónicamente y tiene validez legal.', 20, yPosition + 20);
    
    // Agregar código QR VeriFactu si está disponible
    if (qrCodeDataURL) {
      yPosition += 35;
      // Agregar imagen QR (40x40mm) sin texto arriba
      doc.addImage(qrCodeDataURL, 'PNG', 85, yPosition, 40, 40);
      
      yPosition += 50;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      if (factura.codigoVeriFactu) {
        doc.text(`Código: ${factura.codigoVeriFactu}`, 105, yPosition, { align: 'center' });
        yPosition += 5;
      }
      if (factura.hashDocumento) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`Hash: ${factura.hashDocumento.substring(0, 40)}...`, 105, yPosition, { align: 'center' });
        yPosition += 5;
      }
    }
    
    // Pie de página
    yPosition = Math.max(yPosition + 10, 280);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Telwagen Car Ibérica, S.L. - CIF: B-93.289.585', 105, yPosition, { align: 'center' });
    doc.text('C. / Tomás Miller N° 48 Local, 35007 Las Palmas de Gran Canaria', 105, yPosition + 5, { align: 'center' });
    
    // Descargar
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Factura_Detallada_${factura.numero}_${timestamp}.pdf`;
    doc.save(filename);
    
    console.log('📄 [FacturaPDFService] PDF detallado generado:', filename);
  }
}

export const facturaPDFService = new FacturaPDFService();
export default facturaPDFService;

