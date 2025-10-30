// C:\Proyecto PG2\frontend\src\utils\exportPDF.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * @param {HTMLElement} rootEl  Nodo que contiene el dashboard a exportar
 * @param {Object} meta         Datos para el encabezado (fechas, dim, etc.)
 */
export async function exportDashboard(rootEl, meta = {}) {
  if (!rootEl) return;

  // Tamaño A4 en puntos
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Margenes
  const margin = 32;
  const contentW = pageW - margin * 2;

  // Header con filtros
  const {
    fromDate = '',
    toDate = '',
    dim = '',
    producto = '',
    linea = '',
    uiMode = '',
  } = meta;

  // Captura del nodo a imagen (canvas)
  // scale>1 mejora la nitidez
  const canvas = await html2canvas(rootEl, {
    scale: 2,
    backgroundColor: '#111827', // fondo oscuro si usas dark theme
    useCORS: true,
    windowWidth: rootEl.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgW = contentW;
  const imgH = (canvas.height * imgW) / canvas.width;

  // Dividir en páginas si la imagen es grande
  let remainingH = imgH;
  let positionY = margin + 90; // deja espacio para encabezado

  // Función: encabezado + leyenda filtros
  const drawHeader = (pageNumber) => {
    pdf.setFillColor(17, 24, 39); // #111827
    pdf.rect(0, 0, pageW, 72, 'F');

    pdf.setTextColor(229, 231, 235); // #e5e7eb
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Six Sigma — Gerfor Guatemala', margin, 32);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const line1 = `Modo: ${uiMode || '-'} | Dimensión: ${dim || '-'} | Producto: ${producto || '-'} | Línea: ${linea || '-'}`;
    const line2 = `Rango: ${fromDate || '-'}  →  ${toDate || '-'} | Exportado: ${new Date().toLocaleString()}`;
    pdf.text(line1, margin, 52);
    pdf.text(line2, margin, 68);

    // número de página
    pdf.text(
      `Página ${pageNumber}`,
      pageW - margin - pdf.getTextWidth(`Página ${pageNumber}`),
      32
    );
  };

  // Función: pie de página
  const drawFooter = () => {
    pdf.setDrawColor(55, 65, 81); // #374151
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageH - 40, pageW - margin, pageH - 40);
    pdf.setTextColor(156, 163, 175); // #9ca3af
    pdf.setFontSize(9);
    pdf.text('Dashboard Six Sigma — Exportación PDF', margin, pageH - 22);
  };

  let page = 1;
  drawHeader(page);

  let imgPosY = margin + 90; // debajo del header
  let imgPosX = margin;

  // Troceo vertical si excede una hoja
  const sliceH = pageH - (margin + 90) - 56; // alto útil (header + footer + márgenes)
  let sourceY = 0;
  const sourceW = canvas.width;
  const sourceH = canvas.height;

  while (remainingH > 0) {
    const sliceHeightPx = Math.min(
      (sliceH * canvas.width) / contentW, // convertir alto disponible a escala del canvas
      sourceH - sourceY
    );

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = sourceW;
    pageCanvas.height = sliceHeightPx;

    const ctx = pageCanvas.getContext('2d');
    ctx.drawImage(
      canvas,
      0, sourceY, sourceW, sliceHeightPx, // src
      0, 0, sourceW, sliceHeightPx        // dst
    );

    const pageImg = pageCanvas.toDataURL('image/png');
    const pageImgH = (sliceHeightPx * contentW) / sourceW;

    pdf.addImage(pageImg, 'PNG', imgPosX, imgPosY, contentW, pageImgH, undefined, 'FAST');
    drawFooter();

    remainingH -= pageImgH;

    if (remainingH > 0) {
      pdf.addPage();
      page += 1;
      drawHeader(page);
      drawFooter();
      // Reset para siguiente página
      imgPosY = margin + 90;
      sourceY += sliceHeightPx;
    }
  }

  pdf.save(
    `sixsigma_${uiMode || 'modo'}_${dim || 'dim'}_${fromDate || 'desde'}_${toDate || 'hasta'}.pdf`
  );
}
