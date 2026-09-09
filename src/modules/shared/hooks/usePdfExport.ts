import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PdfExportOptions {
    title: string;
    empresa: {
        razonSocial: string;
        ruc: string;
        direccion?: string;
    };
    periodo?: {
        inicio: Date;
        fin: Date;
    };
    columns: string[];
    data: any[][];
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    headerColor?: string; // Hex color like #3F51B5
}

export const usePdfExport = () => {
    const exportToPdf = ({
        title,
        empresa,
        periodo,
        columns,
        data,
        filename = 'reporte.pdf',
        orientation = 'portrait',
        headerColor = '#64748b' // Default slate-500
    }: PdfExportOptions) => {
        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });

        // Convertir hex a RGB
        const hexToRgb = (hex: string): [number, number, number] => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
                ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
                : [100, 116, 139]; // Fallback to slate-500
        };

        const primaryColor = hexToRgb(headerColor);
        const secondaryColor = [100, 116, 139] as [number, number, number]; // Slate 500

        // Encabezado
        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(empresa.razonSocial.toUpperCase(), 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'normal');
        doc.text(`RUC: ${empresa.ruc}`, 14, 26);
        if (empresa.direccion) {
            doc.text(empresa.direccion, 14, 31);
        }

        // Título del Reporte y Periodo
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 14, 42);

        if (periodo) {
            const fechaInicio = format(periodo.inicio, 'dd/MM/yyyy', { locale: es });
            const fechaFin = format(periodo.fin, 'dd/MM/yyyy', { locale: es });
            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.setFont('helvetica', 'normal');
            doc.text(`Del ${fechaInicio} al ${fechaFin}`, 14, 48);
        }

        // Tabla
        autoTable(doc, {
            startY: 55,
            head: [columns],
            body: data,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                valign: 'middle'
            },
            columnStyles: {
                // Configuración automática o parametrizable si se requiere
                0: { fontStyle: 'bold' } // Primera columna (usualmente código/nombre) en negrita
            },
            didDrawPage: (_data) => {
                // Pie de página
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(...secondaryColor);
                const fechaImpresion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
                doc.text(`Generado el: ${fechaImpresion}`, 14, doc.internal.pageSize.height - 10);
                doc.text(`Página ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
            }
        });

        doc.save(filename);
    };

    return { exportToPdf };
};
